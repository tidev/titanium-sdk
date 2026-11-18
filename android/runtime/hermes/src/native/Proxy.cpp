/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "ReferenceTable.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

#define TAG "Proxy"
#define INDEX_NAME 0
#define INDEX_OLD_VALUE 1
#define INDEX_VALUE 2

namespace titanium {

jobject Proxy::pendingJavaProxy = NULL;

// Shared by a Proxy and the native state of its JS object. Each side can outlive the other.
struct ProxyLink {
	explicit ProxyLink(Proxy* proxy)
		: proxy(proxy), id(proxy->id())
	{
	}

	// Set to NULL when the Proxy is deleted. Read and written on the JS thread only.
	Proxy* proxy;
	const jlong id;
};

// The native state of the real JS object of a proxy. Only the JS object owns it, so its
// destructor runs when Hermes collects the object. Hermes can run the destructor on its
// garbage collection thread, so the destructor only queues a notice.
struct ProxyState : public jsi::NativeState {
	explicit ProxyState(std::shared_ptr<ProxyLink> link)
		: link(std::move(link))
	{
	}

	~ProxyState() override
	{
		Proxy::notifyJsCollected(link->id);
	}

	const std::shared_ptr<ProxyLink> link;
};

// All live proxies by id. The JS thread owns this map.
static std::unordered_map<jlong, Proxy*> registry;
static jlong lastProxyId = 0;

// Notices from the Hermes garbage collection thread and from the Java finalizer thread.
static std::mutex pendingMutex;
static std::vector<jlong> pendingJavaUnreachable;
static std::vector<jlong> pendingJsCollected;

static jsi::Object copyObject(jsi::Runtime& rt, const jsi::Object& object)
{
	return jsi::Value(rt, object).getObject(rt);
}

static jsi::Function copyFunction(jsi::Runtime& rt, const jsi::Function& function)
{
	return jsi::Value(rt, function).getObject(rt).getFunction(rt);
}

static bool needsTraps(const ProxyClass* proxyClass)
{
	for (const ProxyClass* current = proxyClass; current != nullptr;
		current = current->parent ? current->parent() : nullptr) {
		if (current->indexed || current->interceptor) {
			return true;
		}
	}
	return false;
}

static bool isIndexed(const ProxyClass* proxyClass)
{
	for (const ProxyClass* current = proxyClass; current != nullptr;
		current = current->parent ? current->parent() : nullptr) {
		if (current->indexed) {
			return true;
		}
	}
	return false;
}

static ProxyInterceptor findInterceptor(const ProxyClass* proxyClass)
{
	for (const ProxyClass* current = proxyClass; current != nullptr;
		current = current->parent ? current->parent() : nullptr) {
		if (current->interceptor) {
			return current->interceptor;
		}
	}
	return nullptr;
}

// --- Lifetime -----------------------------------------------------------------------------------

Proxy::Proxy(jsi::Runtime& rt, const jsi::Object& jsObject, const ProxyClass* proxyClass)
	: id_(++lastProxyId)
	, class_(proxyClass)
	, owner_(NONE)
	, strong_(new jsi::Object(copyObject(rt, jsObject)))
	, refTableKey_(0)
	, usedSinceArm_(false)
	, stateful_(false)
	, javaFirst_(false)
{
	std::shared_ptr<ProxyLink> link = std::make_shared<ProxyLink>(this);
	state_ = link;
	jsObject.setNativeState(rt, std::make_shared<ProxyState>(link));
	registry[id_] = this;
}

Proxy::~Proxy()
{
	std::static_pointer_cast<ProxyLink>(state_)->proxy = nullptr;
	registry.erase(id_);
	if (refTableKey_ != 0) {
		LOGD(TAG, "Deleting ref in ReferenceTable for key: %lld, proxy id: %lld", (long long) refTableKey_, (long long) id_);
		unlinkJavaObject();
		ReferenceTable::destroyReference(refTableKey_);
		refTableKey_ = 0;
	}
}

// Java code can still hold the Java proxy when Hermes collected the JS object. Clear the id in
// its HermesObject, so that Java asks for a new JS object and does not use an id that is gone.
void Proxy::unlinkJavaObject()
{
	if (owner_ != JS_DECIDES) {
		// The table holds a weak reference. ReferenceTable.destroyReference() clears the id.
		return;
	}
	JNIEnv* env = JNIUtil::getJNIEnv();
	if (!env) {
		return;
	}
	jobject javaProxy = ReferenceTable::getReference(refTableKey_);
	if (!javaProxy) {
		return;
	}
	if (env->IsInstanceOf(javaProxy, JNIUtil::krollProxyClass)) {
		jobject krollObject = env->GetObjectField(javaProxy, JNIUtil::krollProxyKrollObjectField);
		if (krollObject) {
			// A new JS object can exist already. Its HermesObject has another id.
			if (env->IsInstanceOf(krollObject, JNIUtil::jsObjectClass)
				&& env->GetLongField(krollObject, JNIUtil::jsObjectPtrField) == id_) {
				env->SetLongField(krollObject, JNIUtil::jsObjectPtrField, 0);
			}
			env->DeleteLocalRef(krollObject);
		}
	}
	env->DeleteLocalRef(javaProxy);
}

Proxy* Proxy::fromId(jlong id)
{
	auto it = registry.find(id);
	return it == registry.end() ? nullptr : it->second;
}

Proxy* Proxy::unwrap(jsi::Runtime& rt, const jsi::Value& value)
{
	if (!value.isObject()) {
		return nullptr;
	}
	jsi::Object object = value.getObject(rt);
	if (object.hasNativeState<ProxyState>(rt)) {
		return object.getNativeState<ProxyState>(rt)->link->proxy;
	}
	// The value can be an object that inherits from a proxy, or the ES Proxy in front of a
	// real object. Every real object links to itself, and the lookup follows both.
	jsi::Value target = object.getProperty(rt, TiRuntime::state->backingProp);
	if (target.isObject()) {
		jsi::Object real = target.getObject(rt);
		if (real.hasNativeState<ProxyState>(rt)) {
			return real.getNativeState<ProxyState>(rt)->link->proxy;
		}
	}
	return nullptr;
}

Proxy* Proxy::unwrap(jsi::Runtime& rt, const jsi::Value& value, const ProxyClass& proxyClass)
{
	Proxy* proxy = unwrap(rt, value);
	if (proxy) {
		return proxy;
	}
	auto it = TiRuntime::state->moduleInstances.find(&proxyClass);
	if (it != TiRuntime::state->moduleInstances.end()) {
		return unwrap(rt, it->second);
	}
	return nullptr;
}

void Proxy::setPublicObject(jsi::Runtime& rt, const jsi::Object& object)
{
	strong_.reset(new jsi::Object(copyObject(rt, object)));
}

jsi::Value Proxy::jsObject(jsi::Runtime& rt)
{
	if (strong_) {
		return jsi::Value(rt, *strong_);
	}
	if (!weak_) {
		return jsi::Value::undefined();
	}
	jsi::Value locked = weak_->lock(rt);
	if (!locked.isObject()) {
		// Hermes collected the object. The notice from its native state deletes this proxy soon.
		return jsi::Value::undefined();
	}
	if (stateful_) {
		// Java passes the proxy to JS, so Java holds it now.
		javaDecides(rt);
	}
	return locked;
}

void Proxy::attach(jobject javaObject, bool armNow)
{
	ASSERT(javaObject != NULL);
	ASSERT(refTableKey_ == 0);
	refTableKey_ = ReferenceTable::createReference(javaObject);
	owner_ = JAVA_DECIDES;
	// Until arm() runs, the Java reference and the JS handle are both strong.
	// A notice cannot arrive in that time, because no canary exists yet.
	usedSinceArm_ = true;
	if (armNow) {
		arm();
	}
}

void Proxy::arm()
{
	if (owner_ != JAVA_DECIDES || refTableKey_ == 0) {
		return;
	}
	if (class_->isModule) {
		// A module lives as long as the runtime, so both references stay strong. The canary
		// must not revive a module: the garbage collector runs the finalizers of all objects
		// that only the module holds in the same pass, for example the TLS context of an
		// HTTP client.
		return;
	}
	if (!stateful_) {
		// A new JS object can replace this one, so the Java proxy is never revived.
		jsDecides(TiRuntime::rt());
		return;
	}
	ReferenceTable::armReference(refTableKey_, id_);
	usedSinceArm_ = false;
}

void Proxy::markStateful(jsi::Runtime& rt)
{
	if (stateful_) {
		return;
	}
	stateful_ = true;
	if (owner_ == JS_DECIDES) {
		// JS code holds the object now, because it just wrote to it.
		javaDecides(rt);
	}
	// In the other states, arm() runs later and reads the flag, or the proxy is a module.
}

jobject Proxy::getJavaObject()
{
	if (refTableKey_ == 0) {
		return NULL;
	}
	if (owner_ == JS_DECIDES && stateful_) {
		// The proxy crosses to Java as a receiver or as an argument. Java can keep it.
		javaDecides(TiRuntime::rt());
	}
	usedSinceArm_ = true;
	jobject ref = ReferenceTable::getReference(refTableKey_);
	if (ref == NULL) {
		LOGW(TAG, "Could not obtain reference, Java object has already been collected! (Key: %lld)", (long long) refTableKey_);
	}
	return ref;
}

void Proxy::unreferenceJavaObject(jobject ref)
{
	if (ref == NULL) {
		return;
	}
	JNIEnv* env = JNIUtil::getJNIEnv();
	ASSERT(env != NULL);
	env->DeleteLocalRef(ref);
}

void Proxy::javaDecides(jsi::Runtime& rt)
{
	if (owner_ != JS_DECIDES) {
		return;
	}
	jsi::Value locked = weak_->lock(rt);
	if (!locked.isObject()) {
		return;
	}
	strong_.reset(new jsi::Object(locked.getObject(rt)));
	weak_.reset();
	owner_ = JAVA_DECIDES;
	arm();
}

void Proxy::jsDecides(jsi::Runtime& rt)
{
	if (owner_ != JAVA_DECIDES || !strong_) {
		return;
	}
	// The canary already made the Java reference strong again.
	weak_.reset(new jsi::WeakObject(rt, *strong_));
	strong_.reset();
	owner_ = JS_DECIDES;
}

void Proxy::onJavaUnreachable(jsi::Runtime& rt)
{
	if (owner_ != JAVA_DECIDES) {
		return;
	}
	if (usedSinceArm_) {
		// Java got the proxy again after the canary was created. Ask once more.
		LOGD(TAG, "Proxy %lld was used since its canary was made, arming again", (long long) id_);
		arm();
		return;
	}
	LOGD(TAG, "Java dropped proxy %lld, the JS side decides now", (long long) id_);
	jsDecides(rt);
}

void Proxy::notifyJavaUnreachable(jlong id)
{
	std::lock_guard<std::mutex> lock(pendingMutex);
	pendingJavaUnreachable.push_back(id);
}

void Proxy::notifyJsCollected(jlong id)
{
	std::lock_guard<std::mutex> lock(pendingMutex);
	pendingJsCollected.push_back(id);
}

void Proxy::drainPending()
{
	std::vector<jlong> javaUnreachable;
	std::vector<jlong> jsCollected;
	{
		std::lock_guard<std::mutex> lock(pendingMutex);
		javaUnreachable.swap(pendingJavaUnreachable);
		jsCollected.swap(pendingJsCollected);
	}
	if (javaUnreachable.empty() && jsCollected.empty()) {
		return;
	}
	if (!TiRuntime::isAlive()) {
		return;
	}
	jsi::Runtime& rt = TiRuntime::rt();
	for (jlong id : jsCollected) {
		destroy(id);
	}
	for (jlong id : javaUnreachable) {
		Proxy* proxy = fromId(id);
		if (proxy) {
			proxy->onJavaUnreachable(rt);
		}
	}
}

void Proxy::destroy(jlong id)
{
	Proxy* proxy = fromId(id);
	if (proxy) {
		LOGD(TAG, "deleting titanium::Proxy with id: %lld", (long long) id);
		delete proxy;
	}
}

void Proxy::destroyAll()
{
	std::vector<Proxy*> all;
	all.reserve(registry.size());
	for (auto& entry : registry) {
		all.push_back(entry.second);
	}
	for (Proxy* proxy : all) {
		delete proxy;
	}
	registry.clear();

	std::lock_guard<std::mutex> lock(pendingMutex);
	pendingJavaUnreachable.clear();
	pendingJsCollected.clear();
}

// --- Class setup --------------------------------------------------------------------------------

void ClassBuilder::method(const char* name, ProxyMethod function, unsigned int argCount)
{
	JSUtil::setMethod(rt, prototype, name, argCount,
		[function](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
			return function(rt, thisVal, args, count);
		});
}

void ClassBuilder::accessor(const char* name, ProxyGetter getter, ProxySetter setter, bool readOnly)
{
	std::string propertyName(name);

	// The accessors are on the prototype, so JS code can reach them with a receiver that is not
	// a proxy, for example "SomeProxy.prototype.title = value". In V8 the accessors are on each
	// instance, and such code reads or writes a plain property. Do the same here.
	jsi::Function jsGetter = JSUtil::hostFunction(rt, name, 0,
		[getter, propertyName](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value*, size_t) -> jsi::Value {
			if (thisVal.isObject() && Proxy::unwrap(rt, thisVal) == nullptr) {
				return jsi::Value::undefined();
			}
			if (getter) {
				return getter(rt, thisVal);
			}
			return Proxy::getProperty(rt, thisVal, propertyName);
		});

	if (readOnly) {
		TiRuntime::state->defineNativeAccessor.call(rt, prototype, jsi::String::createFromAscii(rt, name), jsGetter);
		return;
	}

	jsi::Function jsSetter = JSUtil::hostFunction(rt, name, 1,
		[setter, propertyName](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
			jsi::Value undefined;
			const jsi::Value& value = count > 0 ? args[0] : undefined;
			if (thisVal.isObject() && Proxy::unwrap(rt, thisVal) == nullptr) {
				LOGD(TAG, "Property '%s' was set on an object that is not a proxy", propertyName.c_str());
				TiRuntime::state->defineOwn.call(rt, thisVal, jsi::String::createFromUtf8(rt, propertyName), value);
				return jsi::Value::undefined();
			}
			if (setter) {
				setter(rt, thisVal, value);
			} else {
				Proxy::onPropertyChanged(rt, thisVal, propertyName, value);
			}
			return jsi::Value::undefined();
		});
	TiRuntime::state->defineNativeAccessor.call(rt, prototype, jsi::String::createFromAscii(rt, name), jsGetter, jsSetter);
}

void ClassBuilder::constant(const char* name, jsi::Value value)
{
	TiRuntime::state->defineConstant.call(rt, prototype, jsi::String::createFromAscii(rt, name), value);
}

void ClassBuilder::staticConstant(const char* name, jsi::Value value)
{
	TiRuntime::state->defineConstant.call(rt, constructor, jsi::String::createFromAscii(rt, name), value);
}

// Proxy.prototype._hasListenersForEventType(type, hasListeners)
static jsi::Value hasListenersForEventType(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		JSException::GetJNIEnvironmentError(rt);
	}
	Proxy* proxy = Proxy::unwrap(rt, thisVal);
	if (proxy == nullptr) {
		LOGE(TAG, "_hasListenersForEventType() was called on an object that is not a proxy");
		JSException::Error(rt, "Failed to unwrap Proxy instance.");
	}
	if (count < 2) {
		JSException::Error(rt, "_hasListenersForEventType requires an event type and a flag.");
	}

	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy == NULL) {
		return jsi::Value::undefined();
	}
	jobject krollObject = env->GetObjectField(javaProxy, JNIUtil::krollProxyKrollObjectField);
	jstring javaEventType = TypeConverter::jsValueToJavaString(rt, env, args[0]);
	jboolean hasListeners = TypeConverter::jsBooleanToJavaBoolean(rt, args[1]);
	proxy->unreferenceJavaObject(javaProxy);

	if (krollObject) {
		env->CallVoidMethod(krollObject, JNIUtil::krollObjectSetHasListenersForEventTypeMethod, javaEventType, hasListeners);
		env->DeleteLocalRef(krollObject);
	}
	env->DeleteLocalRef(javaEventType);

	JSException::checkJavaException(rt, env);
	return jsi::Value::undefined();
}

// Proxy.prototype._onEventFired(type, data)
static jsi::Value onEventFired(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		JSException::GetJNIEnvironmentError(rt);
	}
	Proxy* proxy = Proxy::unwrap(rt, thisVal);
	if (proxy == nullptr) {
		LOGE(TAG, "_onEventFired() was called on an object that is not a proxy");
		JSException::Error(rt, "Failed to unwrap Proxy instance.");
	}
	if (count < 1) {
		JSException::Error(rt, "_onEventFired requires an event type.");
	}

	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy == NULL) {
		return jsi::Value::undefined();
	}
	jobject krollObject = env->GetObjectField(javaProxy, JNIUtil::krollProxyKrollObjectField);
	proxy->unreferenceJavaObject(javaProxy);

	jstring javaEventType = TypeConverter::jsValueToJavaString(rt, env, args[0]);
	bool isNew = false;
	jsi::Value undefined;
	jobject javaEventData = TypeConverter::jsValueToJavaObject(rt, env, count > 1 ? args[1] : undefined, &isNew);

	if (krollObject) {
		env->CallVoidMethod(krollObject, JNIUtil::krollObjectOnEventFiredMethod, javaEventType, javaEventData);
		env->DeleteLocalRef(krollObject);
	}
	env->DeleteLocalRef(javaEventType);
	if (isNew) {
		env->DeleteLocalRef(javaEventData);
	}

	JSException::checkJavaException(rt, env);
	return jsi::Value::undefined();
}

// Proxy.prototype.onPropertiesChanged(changes)
// Propagates property changes to the Java object from setPropertiesAndFire() in JS.
static jsi::Value proxyOnPropertiesChanged(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count)
{
	if (count < 1 || !args[0].isObject() || !args[0].getObject(rt).isArray(rt)) {
		JSException::Error(rt,
			"Proxy.propertiesChanged requires a list of lists of property name, the old value, and the new value");
	}
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		JSException::GetJNIEnvironmentError(rt);
	}
	Proxy* proxy = Proxy::unwrap(rt, thisVal);
	if (!proxy) {
		JSException::Error(rt, "Failed to unwrap Proxy instance");
	}

	jsi::Array changes = args[0].getObject(rt).getArray(rt);
	size_t length = changes.size(rt);
	jobjectArray jChanges = env->NewObjectArray((jsize) length, JNIUtil::objectClass, NULL);

	for (size_t i = 0; i < length; ++i) {
		jsi::Value changeValue = changes.getValueAtIndex(rt, i);
		if (!changeValue.isObject() || !changeValue.getObject(rt).isArray(rt)) {
			continue;
		}
		jsi::Array change = changeValue.getObject(rt).getArray(rt);
		jobjectArray jChange = env->NewObjectArray(3, JNIUtil::objectClass, NULL);

		jstring jName = TypeConverter::jsValueToJavaString(rt, env, change.getValueAtIndex(rt, INDEX_NAME));
		env->SetObjectArrayElement(jChange, INDEX_NAME, jName);
		env->DeleteLocalRef(jName);

		bool isNew = false;
		jobject jOldValue = TypeConverter::jsValueToJavaObject(rt, env, change.getValueAtIndex(rt, INDEX_OLD_VALUE), &isNew);
		env->SetObjectArrayElement(jChange, INDEX_OLD_VALUE, jOldValue);
		if (isNew) {
			env->DeleteLocalRef(jOldValue);
		}

		isNew = false;
		jobject jValue = TypeConverter::jsValueToJavaObject(rt, env, change.getValueAtIndex(rt, INDEX_VALUE), &isNew);
		env->SetObjectArrayElement(jChange, INDEX_VALUE, jValue);
		if (isNew) {
			env->DeleteLocalRef(jValue);
		}

		env->SetObjectArrayElement(jChanges, (jsize) i, jChange);
		env->DeleteLocalRef(jChange);
	}

	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy != NULL) {
		env->CallVoidMethod(javaProxy, JNIUtil::krollProxyOnPropertiesChangedMethod, jChanges);
		proxy->unreferenceJavaObject(javaProxy);
	}
	env->DeleteLocalRef(jChanges);

	JSException::checkJavaException(rt, env);
	return jsi::Value::undefined();
}

void Proxy::initBaseClasses(jsi::Runtime& rt)
{
	RuntimeState& state = *TiRuntime::state;

	// Neither base class has a Java object, so "init" leaves the new object as it is.
	auto makeBase = [&](const char* name, const jsi::Function* parent) -> jsi::Function {
		jsi::Function init = JSUtil::hostFunction(rt, name, 2,
			[](jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
				return jsi::Value::undefined();
			});
		jsi::Function ctor = state.makeConstructor.call(rt, jsi::String::createFromAscii(rt, name), init)
			.getObject(rt).getFunction(rt);
		if (parent) {
			state.setupPrototype.call(rt, ctor, *parent);
		} else {
			// The prototype chain of every proxy ends in an object that reports the first write
			// of a property that only JS knows.
			jsi::Function noteState = JSUtil::hostFunction(rt, "noteState", 1,
				[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
					Proxy* proxy = count > 0 ? Proxy::unwrap(rt, args[0]) : nullptr;
					if (proxy) {
						proxy->markStateful(rt);
					}
					return jsi::Value::undefined();
				});
			state.setupPrototype.call(rt, ctor, jsi::Value::null(), state.makeStateRoot.call(rt, noteState));
		}
		return ctor;
	};

	// EventEmitter: events.js in the common runtime adds the listener logic to its prototype.
	state.eventEmitterConstructor.emplace(makeBase("EventEmitter", nullptr));

	// Proxy: the base class of all Titanium proxies.
	jsi::Function proxyCtor = makeBase("Proxy", &*state.eventEmitterConstructor);
	jsi::Object proxyProto = proxyCtor.getPropertyAsObject(rt, "prototype");
	JSUtil::setMethod(rt, proxyProto, "_hasListenersForEventType", 2, hasListenersForEventType);
	JSUtil::setMethod(rt, proxyProto, "onPropertiesChanged", 1, proxyOnPropertiesChanged);
	JSUtil::setMethod(rt, proxyProto, "_onEventFired", 2, onEventFired);
	state.proxyConstructor.emplace(std::move(proxyCtor));
}

void Proxy::bindProxy(jsi::Runtime& rt, const jsi::Object& exports)
{
	exports.setProperty(rt, "Proxy", *TiRuntime::state->proxyConstructor);
}

jsi::Function Proxy::getConstructor(jsi::Runtime& rt, ProxyClass& proxyClass)
{
	RuntimeState& state = *TiRuntime::state;
	auto it = state.classConstructors.find(&proxyClass);
	if (it != state.classConstructors.end()) {
		return copyFunction(rt, it->second);
	}
	jsi::Function ctor = buildClass(rt, proxyClass);
	jsi::Function result = copyFunction(rt, ctor);
	state.classConstructors.emplace(&proxyClass, std::move(ctor));
	return result;
}

jsi::Function Proxy::buildClass(jsi::Runtime& rt, ProxyClass& proxyClass)
{
	LOGD(TAG, "Building proxy class %s", proxyClass.name);
	RuntimeState& state = *TiRuntime::state;

	if (proxyClass.javaClassName && !proxyClass.javaClass) {
		proxyClass.javaClass = JNIUtil::findClass(proxyClass.javaClassName);
	}

	jsi::Function parentCtor = proxyClass.parent
		? getConstructor(rt, *proxyClass.parent())
		: copyFunction(rt, *state.proxyConstructor);

	ProxyClass* classPointer = &proxyClass;
	auto makeInit = [classPointer](jsi::Runtime& rt) -> jsi::Function {
		return JSUtil::hostFunction(rt, classPointer->name, 2,
			[classPointer](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
				return Proxy::construct(rt, *classPointer, args, count);
			});
	};

	jsi::Function ctor = state.makeConstructor.call(rt, jsi::String::createFromAscii(rt, proxyClass.name), makeInit(rt))
		.getObject(rt).getFunction(rt);
	jsi::Object proto = state.setupPrototype.call(rt, ctor, parentCtor).getObject(rt);

	// Lets JS code extend a proxy class without knowledge of the Java class:
	//   var MyView = Ti.UI.View.inherit(function MyView() {});
	// Like in the V8 runtime, only the name of the function is used.
	jsi::Function inherit = JSUtil::hostFunction(rt, "inherit", 1,
		[classPointer, makeInit](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
			RuntimeState& state = *TiRuntime::state;
			jsi::Value name = jsi::String::createFromAscii(rt, "unknown");
			if (count > 0 && args[0].isObject()) {
				jsi::Value functionName = args[0].getObject(rt).getProperty(rt, "name");
				if (functionName.isString() && !functionName.getString(rt).utf8(rt).empty()) {
					name = std::move(functionName);
				}
			}
			jsi::Function child = state.makeConstructor.call(rt, name, makeInit(rt)).getObject(rt).getFunction(rt);
			state.setupPrototype.call(rt, child, Proxy::getConstructor(rt, *classPointer));
			return child;
		});
	ctor.setProperty(rt, "inherit", inherit);

	if (proxyClass.install) {
		ClassBuilder builder(rt, ctor, proto);
		proxyClass.install(builder);
	}
	return ctor;
}

static jsi::Function& indexedGetTrap(jsi::Runtime& rt)
{
	RuntimeState& state = *TiRuntime::state;
	if (!state.getIndexedTrap) {
		state.getIndexedTrap.emplace(JSUtil::hostFunction(rt, "getIndexed", 2,
			[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
				Proxy* proxy = count > 1 ? Proxy::unwrap(rt, args[0]) : nullptr;
				if (!proxy || !args[1].isNumber()) {
					return jsi::Value::undefined();
				}
				return Proxy::getIndexedProperty(rt, proxy, (uint32_t) args[1].getNumber());
			}));
	}
	return *state.getIndexedTrap;
}

static jsi::Function& indexedSetTrap(jsi::Runtime& rt)
{
	RuntimeState& state = *TiRuntime::state;
	if (!state.setIndexedTrap) {
		state.setIndexedTrap.emplace(JSUtil::hostFunction(rt, "setIndexed", 3,
			[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
				Proxy* proxy = count > 2 ? Proxy::unwrap(rt, args[0]) : nullptr;
				if (proxy && args[1].isNumber()) {
					Proxy::setIndexedProperty(rt, proxy, (uint32_t) args[1].getNumber(), args[2]);
				}
				return jsi::Value::undefined();
			}));
	}
	return *state.setIndexedTrap;
}

static jsi::Function& interceptTrap(jsi::Runtime& rt)
{
	RuntimeState& state = *TiRuntime::state;
	if (!state.interceptTrap) {
		state.interceptTrap.emplace(JSUtil::hostFunction(rt, "intercept", 2,
			[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
				RuntimeState& state = *TiRuntime::state;
				Proxy* proxy = count > 1 ? Proxy::unwrap(rt, args[0]) : nullptr;
				ProxyInterceptor interceptor = proxy ? findInterceptor(proxy->proxyClass()) : nullptr;
				if (!interceptor || !args[1].isString()) {
					return jsi::Value(rt, state.dontIntercept);
				}
				return interceptor(rt, proxy, args[1].getString(rt));
			}));
	}
	return *state.interceptTrap;
}

// Called by the JS constructor of a proxy class: init(newObject, argumentsOfTheConstructor).
// Returns the object that "new" must produce.
jsi::Value Proxy::construct(jsi::Runtime& rt, ProxyClass& proxyClass, const jsi::Value* args, size_t count)
{
	LOGD(TAG, "Proxy::construct %s", proxyClass.name);
	RuntimeState& state = *TiRuntime::state;

	// "this" is undefined when JS code calls the constructor without "new".
	if (count < 1 || !args[0].isObject()) {
		JSException::CalledConstructor(rt);
	}
	jsi::Object self = args[0].getObject(rt);

	if (!proxyClass.javaClass) {
		LOGE(TAG, "No JNI Java Class reference set for proxy Java proxy type %s", proxyClass.name);
		return jsi::Value::undefined();
	}

	// First things first, we need the native part in case future calls need to unwrap the proxy.
	Proxy* proxy = new Proxy(rt, self, &proxyClass);
	jlong proxyId = proxy->id();

	// Take the Java object that ProxyFactory::createJsProxy() passes in, if there is one.
	jobject javaProxy = pendingJavaProxy;
	pendingJavaProxy = NULL;
	bool createdJavaProxy = false;
	proxy->javaFirst_ = javaProxy != NULL;
	// attach() can make the handle of the proxy weak. This value keeps the JS object alive
	// until the constructor returns it.
	jsi::Value publicObject;

	try {
		// every instance gets a special "_properties" object for us to use internally for get/setProperty
		state.defineHidden.call(rt, self, jsi::String::createFromAscii(rt, "_properties"), jsi::Object(rt));

		// Link the object to itself under a hidden key. An object that inherits from a proxy finds
		// the proxy through this link. The Titanium kernel makes such objects: each JS file gets a
		// wrapper whose prototype is the real module. V8 does this lookup with
		// FindInstanceInPrototypeChain().
		state.linkBacking.call(rt, self);

		if (needsTraps(&proxyClass)) {
			jsi::Value getIndexed = jsi::Value::null();
			jsi::Value setIndexed = jsi::Value::null();
			jsi::Value intercept = jsi::Value::null();
			if (isIndexed(&proxyClass)) {
				getIndexed = jsi::Value(rt, indexedGetTrap(rt));
				setIndexed = jsi::Value(rt, indexedSetTrap(rt));
			}
			if (findInterceptor(&proxyClass)) {
				intercept = jsi::Value(rt, interceptTrap(rt));
			}
			jsi::Object trapped = state.makeTrappedWrapper
				.call(rt, self, getIndexed, setIndexed, intercept, state.dontIntercept).getObject(rt);
			proxy->setPublicObject(rt, trapped);
		}

		if (!javaProxy) {
			jsi::Value ctorArgs = count > 1 ? jsi::Value(rt, args[1]) : jsi::Value::undefined();
			javaProxy = ProxyFactory::createJavaProxy(rt, proxyClass.javaClass, proxy, ctorArgs);
			createdJavaProxy = true;
		}
		if (!javaProxy) {
			JSException::Error(rt, "Failed to create the Java proxy.");
		}

		// A Java object from createJsProxy() has no HermesObject yet. createJsProxy() arms it.
		publicObject = proxy->jsObject(rt);
		proxy->attach(javaProxy, createdJavaProxy);

		// Copy the creation properties. The constructor gets them either directly, or in the
		// Arguments object of a createXYZ() function, after the ScopeVars object.
		if (count > 1 && args[1].isObject()) {
			jsi::Object ctorArgs = args[1].getObject(rt);
			jsi::Value length = ctorArgs.getProperty(rt, state.lengthProp);
			if (length.isNumber() && length.getNumber() > 0) {
				jsi::Value first = ctorArgs.getProperty(rt, "0");
				if (first.isObject()) {
					bool extend = true;
					jsi::Object createProperties = first.getObject(rt);
					if (JSUtil::isArguments(rt, first)) {
						extend = false;
						jsi::Value innerLength = createProperties.getProperty(rt, state.lengthProp);
						if (innerLength.isNumber() && innerLength.getNumber() > 1) {
							jsi::Value properties = createProperties.getProperty(rt, "1");
							if (properties.isObject()) {
								extend = true;
								createProperties = properties.getObject(rt);
							}
						}
					}
					if (extend) {
						state.applyCreationProperties.call(rt, self, createProperties);
					}
				}
			}
		}
	} catch (...) {
		if (createdJavaProxy && javaProxy) {
			JNIEnv* env = JNIScope::getEnv();
			if (env) {
				env->DeleteLocalRef(javaProxy);
			}
		}
		if (fromId(proxyId) && proxy->owner() == NONE) {
			// No Java object was attached, so nothing else can delete this proxy.
			delete proxy;
		}
		throw;
	}

	if (createdJavaProxy) {
		JNIEnv* env = JNIScope::getEnv();
		if (env) {
			env->DeleteLocalRef(javaProxy);
		}
	}

	return publicObject;
}

void Proxy::bindClass(jsi::Runtime& rt, const jsi::Object& exports, ProxyClass& proxyClass)
{
	RuntimeState& state = *TiRuntime::state;
	jsi::Function ctor = getConstructor(rt, proxyClass);
	if (proxyClass.isModule) {
		jsi::Value instance = ctor.callAsConstructor(rt);
		exports.setProperty(rt, proxyClass.name, instance);
		state.moduleInstances.erase(&proxyClass);
		state.moduleInstances.emplace(&proxyClass, std::move(instance));
	} else {
		exports.setProperty(rt, proxyClass.name, ctor);
		exports.setProperty(rt, "constructor", ctor);
	}
}

void Proxy::disposeClass(jsi::Runtime& rt, ProxyClass& proxyClass)
{
	if (!TiRuntime::state) {
		return;
	}
	TiRuntime::state->classConstructors.erase(&proxyClass);
	TiRuntime::state->moduleInstances.erase(&proxyClass);
}

// --- Property helpers ---------------------------------------------------------------------------

jsi::Value Proxy::getProperty(jsi::Runtime& rt, const jsi::Value& thisVal, const std::string& name)
{
	if (!thisVal.isObject()) {
		return jsi::Value::undefined();
	}
	// Call getProperty on the Proxy to get the property.
	// We define this method in JavaScript on the Proxy prototype.
	jsi::Object object = thisVal.getObject(rt);
	jsi::Value getPropertyValue = object.getProperty(rt, TiRuntime::state->getPropertyProp);
	if (!getPropertyValue.isObject() || !getPropertyValue.getObject(rt).isFunction(rt)) {
		LOGE(TAG, "Proxy.prototype.getProperty is not a Function!");
		return jsi::Value::undefined();
	}
	jsi::Value value = getPropertyValue.getObject(rt).getFunction(rt)
		.callWithThis(rt, object, jsi::String::createFromUtf8(rt, name));
	if (!value.isUndefined() || !JNIUtil::krollProxyGetPropertyMethod) {
		return value;
	}

	// A JS object that was made for a Java proxy has no copy of the properties. Ask Java.
	Proxy* proxy = unwrap(rt, thisVal);
	JNIEnv* env = JNIScope::getEnv();
	if (!proxy || !proxy->isJavaFirst() || !env) {
		return value;
	}
	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy == NULL) {
		return value;
	}
	jstring javaName = env->NewStringUTF(name.c_str());
	jobject javaValue = env->CallObjectMethod(javaProxy, JNIUtil::krollProxyGetPropertyMethod, javaName);
	env->DeleteLocalRef(javaName);
	proxy->unreferenceJavaObject(javaProxy);
	JSException::checkJavaException(rt, env);
	if (javaValue == NULL) {
		return value;
	}
	jsi::Value result = TypeConverter::javaObjectToJsValue(rt, env, javaValue);
	env->DeleteLocalRef(javaValue);
	return result;
}

void Proxy::setProperty(jsi::Runtime& rt, const jsi::Value& thisVal, const std::string& name, const jsi::Value& value)
{
	if (!thisVal.isObject()) {
		return;
	}
	jsi::Object object = thisVal.getObject(rt);
	jsi::Value setPropertyValue = object.getProperty(rt, TiRuntime::state->setPropertyProp);
	if (!setPropertyValue.isObject() || !setPropertyValue.getObject(rt).isFunction(rt)) {
		LOGE(TAG, "Proxy.prototype.setProperty isn't a function!!!");
		return;
	}
	setPropertyValue.getObject(rt).getFunction(rt)
		.callWithThis(rt, object, jsi::String::createFromUtf8(rt, name), value);
}

void Proxy::onPropertyChanged(jsi::Runtime& rt, const jsi::Value& thisVal, const std::string& name, const jsi::Value& value)
{
	Proxy* proxy = unwrap(rt, thisVal);
	if (!proxy) {
		LOGE(TAG, "onPropertyChanged('%s') was called on an object that is not a proxy", name.c_str());
		JSException::Error(rt, "Failed to unwrap Proxy instance.");
	}
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_GET_ERROR(TAG);
		return;
	}

	jstring javaProperty = env->NewStringUTF(name.c_str());
	bool javaValueIsNew = false;
	jobject javaValue = TypeConverter::jsValueToJavaObject(rt, env, value, &javaValueIsNew);

	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy != NULL) {
		env->CallVoidMethod(javaProxy, JNIUtil::krollProxyOnPropertyChangedMethod, javaProperty, javaValue);
		proxy->unreferenceJavaObject(javaProxy);
	}
	env->DeleteLocalRef(javaProperty);
	if (javaValueIsNew) {
		env->DeleteLocalRef(javaValue);
	}

	JSException::checkJavaException(rt, env);

	// Store new property value on JS internal map.
	setProperty(rt, thisVal, name, value);
}

jsi::Value Proxy::getIndexedProperty(jsi::Runtime& rt, Proxy* proxy, uint32_t index)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		JSException::GetJNIEnvironmentError(rt);
	}
	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy == NULL) {
		return jsi::Value::undefined();
	}
	jobject value = env->CallObjectMethod(javaProxy, JNIUtil::krollProxyGetIndexedPropertyMethod, (jint) index);
	proxy->unreferenceJavaObject(javaProxy);

	JSException::checkJavaException(rt, env);

	jsi::Value result = TypeConverter::javaObjectToJsValue(rt, env, value);
	env->DeleteLocalRef(value);
	return result;
}

void Proxy::setIndexedProperty(jsi::Runtime& rt, Proxy* proxy, uint32_t index, const jsi::Value& value)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_GET_ERROR(TAG);
		return;
	}
	bool javaValueIsNew = false;
	jobject javaValue = TypeConverter::jsValueToJavaObject(rt, env, value, &javaValueIsNew);
	jobject javaProxy = proxy->getJavaObject();
	if (javaProxy != NULL) {
		env->CallVoidMethod(javaProxy, JNIUtil::krollProxySetIndexedPropertyMethod, (jint) index, javaValue);
		proxy->unreferenceJavaObject(javaProxy);
	}
	if (javaValueIsNew) {
		env->DeleteLocalRef(javaValue);
	}
	JSException::checkJavaException(rt, env);
}

void Proxy::logDeprecation(jsi::Runtime& rt, const char* message)
{
	LOGW(TAG, "%s", message);
	// Create an Error to obtain the JS stack of the caller.
	try {
		jsi::Value error = TiRuntime::state->errorConstructor.callAsConstructor(rt, jsi::String::createFromUtf8(rt, message));
		if (error.isObject()) {
			jsi::Value stack = error.getObject(rt).getProperty(rt, "stack");
			if (stack.isString()) {
				LOGW(TAG, "%s", stack.getString(rt).utf8(rt).c_str());
			}
		}
	} catch (const std::exception&) {
		// The warning itself is in the log. The stack is optional.
	}
}

} // namespace titanium
