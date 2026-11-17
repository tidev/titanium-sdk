/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <atomic>
#include <mutex>
#include <string>
#include <vector>

#include <hermes/hermes.h>
#include <jsi/instrumentation.h>

#include "AndroidUtil.h"
#include "HermesPrelude.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "JSUtil.h"
#include "KrollBindings.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

#define TAG "HermesRuntime"

namespace titanium {

std::unique_ptr<jsi::Runtime> TiRuntime::runtime;
std::unique_ptr<RuntimeState> TiRuntime::state;
jobject TiRuntime::javaInstance = NULL;
bool TiRuntime::debuggerEnabled = false;
bool TiRuntime::DBG = false;
std::thread::id TiRuntime::jsThread;

int RuntimeScope::depth = 0;

static std::atomic<int64_t> lastHandleId{0};

static jsi::Object evaluatePrelude(jsi::Runtime& rt)
{
	jsi::Value factory = JSUtil::executeString(rt, kHermesPreludeSource, kHermesPreludeName);
	return factory.getObject(rt).getFunction(rt).call(rt).getObject(rt);
}

// The members are initialized in the order of their declaration in TiRuntime.h.
RuntimeState::RuntimeState(jsi::Runtime& rt)
	: RuntimeState(rt, evaluatePrelude(rt))
{
}

RuntimeState::RuntimeState(jsi::Runtime& rt, const jsi::Object& prelude)
	: kroll(rt)
	, bindingCache(rt)
	, makeConstructor(prelude.getPropertyAsFunction(rt, "makeConstructor"))
	, setupPrototype(prelude.getPropertyAsFunction(rt, "setupPrototype"))
	, defineNativeAccessor(prelude.getPropertyAsFunction(rt, "defineNativeAccessor"))
	, defineConstant(prelude.getPropertyAsFunction(rt, "defineConstant"))
	, defineHidden(prelude.getPropertyAsFunction(rt, "defineHidden"))
	, linkBacking(prelude.getPropertyAsFunction(rt, "linkBacking"))
	, makeTrappedWrapper(prelude.getPropertyAsFunction(rt, "makeTrappedWrapper"))
	, hasOwn(prelude.getPropertyAsFunction(rt, "hasOwn"))
	, objectKeys(prelude.getPropertyAsFunction(rt, "objectKeys"))
	, isArguments(prelude.getPropertyAsFunction(rt, "isArguments"))
	, isDate(prelude.getPropertyAsFunction(rt, "isDate"))
	, constructorName(prelude.getPropertyAsFunction(rt, "constructorName"))
	, applyCreationProperties(prelude.getPropertyAsFunction(rt, "applyCreationProperties"))
	, defineDynamicProperty(prelude.getPropertyAsFunction(rt, "defineDynamicProperty"))
	, makeDeferred(prelude.getPropertyAsFunction(rt, "makeDeferred"))
	, currentSourceUrl(prelude.getPropertyAsFunction(rt, "currentSourceUrl"))
	, jsonStringify(prelude.getPropertyAsFunction(rt, "jsonStringify"))
	, dateConstructor(rt.global().getPropertyAsFunction(rt, "Date"))
	, errorConstructor(rt.global().getPropertyAsFunction(rt, "Error"))
	, backingProp(jsi::PropNameID::forSymbol(rt, prelude.getProperty(rt, "backingKey").getSymbol(rt)))
	, propertiesProp(jsi::PropNameID::forAscii(rt, "_properties"))
	, getPropertyProp(jsi::PropNameID::forAscii(rt, "getProperty"))
	, setPropertyProp(jsi::PropNameID::forAscii(rt, "setProperty"))
	, emitProp(jsi::PropNameID::forAscii(rt, "emit"))
	, lengthProp(jsi::PropNameID::forAscii(rt, "length"))
	, nativeProp(jsi::PropNameID::forAscii(rt, "$native"))
	, prototypeProp(jsi::PropNameID::forAscii(rt, "prototype"))
	, dontIntercept(rt)
{
}

bool TiRuntime::isJsThread()
{
	return std::this_thread::get_id() == jsThread;
}

int64_t TiRuntime::nextHandleId()
{
	// Java code assumes that 0 is a null pointer, so the first id is 1.
	return ++lastHandleId;
}

static std::mutex releaseMutex;
static std::vector<int64_t> pendingFunctionReleases;
static std::vector<int64_t> pendingResolverReleases;

void TiRuntime::drainPending()
{
	Proxy::drainPending();

	std::vector<int64_t> functionIds;
	std::vector<int64_t> resolverIds;
	{
		std::lock_guard<std::mutex> lock(releaseMutex);
		functionIds.swap(pendingFunctionReleases);
		resolverIds.swap(pendingResolverReleases);
	}
	if (!isAlive()) {
		return;
	}
	for (int64_t id : functionIds) {
		state->functions.erase(id);
	}
	for (int64_t id : resolverIds) {
		state->resolvers.erase(id);
	}
}

void TiRuntime::releaseFunction(int64_t id)
{
	if (isAlive() && isJsThread()) {
		state->functions.erase(id);
		return;
	}
	std::lock_guard<std::mutex> lock(releaseMutex);
	pendingFunctionReleases.push_back(id);
}

void TiRuntime::releaseResolver(int64_t id)
{
	if (isAlive() && isJsThread()) {
		state->resolvers.erase(id);
		return;
	}
	std::lock_guard<std::mutex> lock(releaseMutex);
	pendingResolverReleases.push_back(id);
}

RuntimeScope::RuntimeScope()
	: valid_(TiRuntime::isAlive() && TiRuntime::isJsThread())
{
	if (!valid_) {
		if (TiRuntime::isAlive()) {
			LOGE(TAG, "The Hermes runtime was called from a thread that is not the JS thread. The call is ignored.");
		}
		return;
	}
	if (depth++ == 0) {
		TiRuntime::drainPending();
	}
}

RuntimeScope::~RuntimeScope()
{
	if (!valid_) {
		return;
	}
	if (--depth == 0 && TiRuntime::isAlive()) {
		// Hermes does not run promise jobs by itself. Run them before control returns to Java.
		jsi::Runtime& rt = TiRuntime::rt();
		try {
			rt.drainMicrotasks();
		} catch (const jsi::JSError& error) {
			JSUtil::handleUncaught(rt, error);
		} catch (const std::exception& error) {
			JSUtil::reportException(error);
		}
	}
}

// Minimalistic logging function for internal JS
static jsi::Value krollLog(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	if (count < 2) {
		JSException::Error(rt, "log: missing required tag and message arguments");
	}
	std::string tag = JSUtil::toUtf8(rt, args[0]);
	std::string message = JSUtil::toUtf8(rt, args[1]);
	for (size_t i = 2; i < count; ++i) {
		message += " ";
		message += JSUtil::toUtf8(rt, args[i]);
	}
	__android_log_print(ANDROID_LOG_DEBUG, tag.c_str(), "%s", message.c_str());
	return jsi::Value::undefined();
}

/* static */
void TiRuntime::bootstrap(jsi::Runtime& rt)
{
	Proxy::initBaseClasses(rt);

	jsi::Object& kroll = state->kroll;
	KrollBindings::initFunctions(rt, kroll);
	JSUtil::setMethod(rt, kroll, "log", 2, krollLog);
	kroll.setProperty(rt, "EventEmitter", *state->eventEmitterConstructor);
	kroll.setProperty(rt, "runtime", jsi::String::createFromAscii(rt, "hermes"));
	kroll.setProperty(rt, "DBG", TiRuntime::DBG);

	LOG_TIMER(TAG, "Executing kroll.js");

	jsi::Value result = JSUtil::executeString(rt, KrollBindings::getMainSource(), "ti:/kroll.js");
	if (!result.isObject() || !result.getObject(rt).isFunction(rt)) {
		LOGF(TAG, "kroll.js result is not a function");
		return;
	}

	// Add a reference to the global object
	jsi::Object global = rt.global();

	// Set the __dirname and __filename for the app.js.
	// For other files, it will be injected via the `NativeModule` JavaScript class
	global.setProperty(rt, "__filename", jsi::String::createFromAscii(rt, "/app.js"));
	global.setProperty(rt, "__dirname", jsi::String::createFromAscii(rt, "/"));

	jsi::Function mainFunction = result.getObject(rt).getFunction(rt);
	mainFunction.callWithThis(rt, global, global, kroll);
}

// Looks up Module.runModule the first time that a script runs.
static bool findRunModule(jsi::Runtime& rt)
{
	RuntimeState& state = *TiRuntime::state;
	if (state.runModuleFunction) {
		return true;
	}
	jsi::Value moduleValue = rt.global().getProperty(rt, "Module");
	if (!moduleValue.isObject()) {
		LOGE(TAG, "The global 'Module' object is missing.");
		return false;
	}
	jsi::Object module = moduleValue.getObject(rt);
	jsi::Value runModule = module.getProperty(rt, "runModule");
	if (!runModule.isObject() || !runModule.getObject(rt).isFunction(rt)) {
		LOGE(TAG, "Module.runModule is not a function.");
		return false;
	}
	state.runModuleFunction.emplace(runModule.getObject(rt).getFunction(rt));
	state.moduleObject.emplace(std::move(module));
	return true;
}

static void runModule(JNIEnv* env, jsi::Value (*convertSource)(jsi::Runtime&, JNIEnv*, jobject), jobject source,
	jstring filename, jobject activityProxy)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return;
	}
	titanium::JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();

	try {
		if (!findRunModule(rt)) {
			return;
		}
		jsi::Value jsSource = convertSource(rt, env, source);
		jsi::Value jsFilename = TypeConverter::javaStringToJsString(rt, env, filename);
		jsi::Value jsActivity = TypeConverter::javaObjectToJsValue(rt, env, activityProxy);

		TiRuntime::state->runModuleFunction->callWithThis(rt, *TiRuntime::state->moduleObject,
			jsSource, jsFilename, jsActivity);
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
}

} // namespace titanium

extern "C" {

using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_hermes_HermesRuntime
 * Method:    nativeInit
 * Signature: (Lorg/appcelerator/kroll/runtime/hermes/JSDebugger;ZZ)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesRuntime_nativeInit
	(JNIEnv *env, jobject self, jobject debugger, jboolean DBG, jboolean profilerEnabled)
{
	titanium::JNIScope jniScope(env);

	TiRuntime::DBG = DBG;
	TiRuntime::jsThread = std::this_thread::get_id();
	TiRuntime::javaInstance = env->NewGlobalRef(self);
	JNIUtil::initCache();

	// TODO(hermes): connect the debugger and the sampling profiler in Phase 7.
	TiRuntime::debuggerEnabled = false;
	if (debugger != NULL) {
		LOGW(TAG, "The Hermes runtime does not support the debugger yet.");
	}
	if (profilerEnabled) {
		LOGW(TAG, "The Hermes runtime does not support the profiler yet.");
	}

	// The microtask queue is off by default. Without it, no promise callback runs.
	auto config = ::hermes::vm::RuntimeConfig::Builder()
		.withMicrotaskQueue(true)
		.build();
	TiRuntime::runtime = facebook::hermes::makeHermesRuntime(config);
	jsi::Runtime& rt = TiRuntime::rt();

	try {
		TiRuntime::state.reset(new RuntimeState(rt));
		RuntimeScope scope;
		TiRuntime::bootstrap(rt);
	} catch (const jsi::JSError& error) {
		JSUtil::reportException(rt, error);
		LOGE(TAG, "Caught exception while bootstrapping Kroll");
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
		LOGE(TAG, "Caught exception while bootstrapping Kroll");
	}
}

static jsi::Value bytesToSource(jsi::Runtime& rt, JNIEnv* env, jobject source)
{
	return TypeConverter::javaBytesToJsString(rt, env, (jbyteArray) source);
}

static jsi::Value stringToSource(jsi::Runtime& rt, JNIEnv* env, jobject source)
{
	return TypeConverter::javaStringToJsString(rt, env, (jstring) source);
}

/*
 * Class:     org_appcelerator_kroll_runtime_hermes_HermesRuntime
 * Method:    nativeRunModuleBytes
 * Signature: ([BLjava/lang/String;Lorg/appcelerator/kroll/KrollProxySupport;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesRuntime_nativeRunModuleBytes
	(JNIEnv *env, jobject self, jbyteArray source, jstring filename, jobject activityProxy)
{
	runModule(env, bytesToSource, source, filename, activityProxy);
}

/*
 * Class:     org_appcelerator_kroll_runtime_hermes_HermesRuntime
 * Method:    nativeRunModule
 * Signature: (Ljava/lang/String;Ljava/lang/String;Lorg/appcelerator/kroll/KrollProxySupport;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesRuntime_nativeRunModule
	(JNIEnv *env, jobject self, jstring source, jstring filename, jobject activityProxy)
{
	runModule(env, stringToSource, source, filename, activityProxy);
}

JNIEXPORT jobject JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesRuntime_nativeEvalString
	(JNIEnv *env, jobject self, jstring source, jstring filename)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return NULL;
	}
	titanium::JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();

	if (!source) {
		LOGE(TAG, "Error converting Javascript string, aborting evalString");
		return NULL;
	}

	try {
		const char* sourceChars = env->GetStringUTFChars(source, NULL);
		std::string jsSource(sourceChars ? sourceChars : "");
		env->ReleaseStringUTFChars(source, sourceChars);

		std::string jsFilename = "evalString";
		if (filename) {
			const char* filenameChars = env->GetStringUTFChars(filename, NULL);
			jsFilename = filenameChars ? filenameChars : "";
			env->ReleaseStringUTFChars(filename, filenameChars);
		}

		jsi::Value result = JSUtil::executeString(rt, jsSource, jsFilename);
		return TypeConverter::jsValueToJavaObject(rt, env, result);
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
	return NULL;
}

JNIEXPORT jboolean JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesRuntime_nativeIdle
	(JNIEnv *env, jobject self)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return JNI_TRUE;
	}
	titanium::JNIScope jniScope(env);

	// Suggest a full garbage collection, like the V8 runtime does with LowMemoryNotification().
	TiRuntime::rt().instrumentation().collectGarbage("idle");
	// The collection can end the life of proxy objects. Apply that now and not at the next call.
	TiRuntime::drainPending();
	return JNI_TRUE;
}

/*
 * Called by HermesRuntime.java, this passes a KrollSourceCodeProvider Java class instance
 * to KrollBindings, where it's stored and later used to retrieve an external CommonJS module's
 * Javascript code when require(moduleName) occurs in Javascript.
 * "External" CommonJS modules are CommonJS modules stored in external modules.
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesRuntime_nativeAddExternalCommonJsModule
	(JNIEnv *env, jobject self, jstring moduleName, jobject sourceProvider)
{
	const char* mName = env->GetStringUTFChars(moduleName, NULL);
	jclass cls = env->GetObjectClass(sourceProvider);

	if (!cls) {
		LOGE(TAG, "Could not find source code provider class for module: %s", mName);
		env->ReleaseStringUTFChars(moduleName, mName);
		return;
	}

	jmethodID method = env->GetMethodID(cls, "getSourceCode", "(Ljava/lang/String;)Ljava/lang/String;");
	env->DeleteLocalRef(cls);
	if (!method) {
		LOGE(TAG, "Could not find getSourceCode method in source code provider class for module: %s", mName);
		env->ReleaseStringUTFChars(moduleName, mName);
		return;
	}

	KrollBindings::addExternalCommonJsModule(mName, env->NewGlobalRef(sourceProvider), method);
	env->ReleaseStringUTFChars(moduleName, mName);
}

// Disposes of all native resources of the runtime when the application destroyed all activities.
// Unlike V8, Hermes can create a new runtime later, so everything is deleted here.
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesRuntime_nativeDispose
	(JNIEnv *env, jobject runtime)
{
	titanium::JNIScope jniScope(env);

	if (TiRuntime::runtime) {
		jsi::Runtime& rt = TiRuntime::rt();
		try {
			KrollBindings::dispose(rt);
		} catch (const std::exception& error) {
			JSUtil::reportException(error);
		}
		ProxyFactory::dispose();
		// Every JS handle must go before the runtime goes.
		Proxy::destroyAll();
		TiRuntime::state.reset();
		TiRuntime::runtime.reset();
	}
	// The destruction of the runtime collected all JS objects. Drop their notices.
	Proxy::destroyAll();

	// Removes the retained global reference to the HermesRuntime
	if (TiRuntime::javaInstance) {
		env->DeleteGlobalRef(TiRuntime::javaInstance);
		TiRuntime::javaInstance = NULL;
	}
}

jint JNI_OnLoad(JavaVM *vm, void *reserved)
{
	JNIUtil::javaVm = vm;
	return JNI_VERSION_1_4;
}

} // extern "C"
