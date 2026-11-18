/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef PROXY_H
#define PROXY_H

#include <atomic>
#include <jni.h>
#include <memory>
#include <string>

#include <jsi/jsi.h>

#include "JSUtil.h"

namespace titanium {

using namespace facebook;

class Proxy;
class ClassBuilder;

// Signatures of the functions that generated binding code supplies.
typedef jsi::Value (*ProxyMethod)(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count);
typedef jsi::Value (*ProxyGetter)(jsi::Runtime& rt, const jsi::Value& thisVal);
typedef void (*ProxySetter)(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value& value);
// Returns RuntimeState::dontIntercept if the proxy does not handle the property name.
typedef jsi::Value (*ProxyInterceptor)(jsi::Runtime& rt, Proxy* proxy, const jsi::String& name);

// Describes one proxy class. Generated binding code holds one static instance per class.
struct ProxyClass {
	// The JS class name, for example "View".
	const char* name;
	// The JNI name of the Java class, for example "ti/modules/titanium/ui/ViewProxy".
	// NULL for a class without a Java object.
	const char* javaClassName;
	// The parent class. NULL means titanium::Proxy, the base class of all proxies.
	ProxyClass* (*parent)();
	// Adds the methods, accessors and constants of the class. Can be NULL.
	void (*install)(ClassBuilder& builder);
	// A module is bound as one instance, not as a constructor.
	bool isModule;
	// The Java class implements getIndexedProperty() and setIndexedProperty().
	bool indexed;
	// Set for a Java class with a @Kroll.interceptor method. Can be NULL.
	ProxyInterceptor interceptor;
	// Global reference to the Java class. The runtime fills it on first use.
	jclass javaClass;
};

// Passed to ProxyClass::install. This replaces the V8 function templates.
class ClassBuilder
{
public:
	ClassBuilder(jsi::Runtime& rt, const jsi::Function& constructor, const jsi::Object& prototype)
		: rt(rt), constructor(constructor), prototype(prototype)
	{
	}

	// Adds a method to the prototype.
	void method(const char* name, ProxyMethod function, unsigned int argCount = 0);

	// Adds a property to the prototype.
	// A NULL getter reads the value that JS stored in "_properties".
	// A NULL setter reports the change to the Java proxy with onPropertyChanged().
	// A read-only property has no setter at all.
	void accessor(const char* name, ProxyGetter getter, ProxySetter setter, bool readOnly = false);

	// Adds a read-only value to the prototype.
	void constant(const char* name, jsi::Value value);
	// Adds a read-only value to the constructor.
	void staticConstant(const char* name, jsi::Value value);

	jsi::Runtime& rt;
	const jsi::Function& constructor;
	const jsi::Object& prototype;
};

// The native part of one proxy pair. It connects a JS object with a Java proxy and decides
// how long each of them lives.
//
// The pair must live as long as JS code or Java code can reach it. No garbage collector sees
// the two heaps together, so exactly one side holds the other with a strong reference at a time:
//
// - JS_DECIDES: The Java reference is strong. This class holds the JS object with a weak handle.
//   When Hermes collects the JS object, the pair is deleted. If Java code still holds the Java
//   proxy, the proxy gets a new JS object when Java uses it again.
// - JAVA_DECIDES: This class holds the JS object with a strong handle. The Java ReferenceTable
//   holds the Java proxy with a weak reference and a "canary" object. When Java code drops the
//   proxy, the finalizer of the canary puts the proxy back into the table with a strong reference
//   and reports it with nativeJavaUnreachable().
//
// JAVA_DECIDES has a cost. The garbage collector must see the Java proxy as dead before the
// canary can revive it. In that same pass, it runs the finalizers of all objects that only the
// proxy holds (a database, a stream, a TLS context) and clears the weak references to them.
// So a proxy uses JAVA_DECIDES only if its JS object has state that a new JS object cannot get
// back from Java: an event listener or a custom property. See markStateful(). All other proxies
// stay in JS_DECIDES, and their Java objects are never revived.
//
// A stateful proxy goes back to JAVA_DECIDES when it crosses to Java again, because Java can
// keep it then. A module is the exception: it lives as long as the runtime, and both references
// stay strong.
//
// The V8 runtime does the same job from the other side. V8 can revive a JS object in a weak
// callback, and Hermes cannot. A Java finalizer can revive a Java object, so the roles are swapped.
class Proxy
{
public:
	enum Owner {
		// No Java object is attached yet.
		NONE,
		JAVA_DECIDES,
		JS_DECIDES
	};

	// Creates the native part for a new JS object and registers it. "jsObject" is the real
	// object. It gets the native state.
	Proxy(jsi::Runtime& rt, const jsi::Object& jsObject, const ProxyClass* proxyClass);
	~Proxy();

	// The key that the Java HermesObject stores in its "ptr" field. It is not a memory address.
	// A key is never used twice, also not after a restart of the runtime.
	jlong id() const
	{
		return id_;
	}

	const ProxyClass* proxyClass() const
	{
		return class_;
	}

	Owner owner() const
	{
		return owner_;
	}

	// Finds the proxy for an id. Returns NULL if it was deleted. JS thread only.
	static Proxy* fromId(jlong id);

	// Finds the proxy behind "this" of a host function. Returns NULL if the value is not a proxy.
	static Proxy* unwrap(jsi::Runtime& rt, const jsi::Value& value);

	// Like unwrap(), but falls back to the module instance of the class. JS code can call
	// a module method without a receiver, for example after "const { info } = Ti.API;".
	static Proxy* unwrap(jsi::Runtime& rt, const jsi::Value& value, const ProxyClass& proxyClass);

	// The object that JS code holds. Returns undefined if Hermes collected it. The caller must
	// make a new JS object for the Java proxy then.
	// Use this when Java passes the proxy to JS: Java holds the proxy at that time, so a
	// stateful proxy goes back to JAVA_DECIDES.
	jsi::Value jsObject(jsi::Runtime& rt);

	// Attaches the Java proxy. Call this once. Both references are strong until arm() runs.
	// Pass "arm" as false if the Java proxy does not have its HermesObject yet, and call arm()
	// when it does. The canary lives in the HermesObject.
	void attach(jobject javaObject, bool arm = true);
	// Selects the owner: JAVA_DECIDES with a canary for a stateful proxy, JS_DECIDES for all others.
	void arm();

	// Called when the JS object got an event listener or a property that only JS knows.
	// From then on, the JS object must live as long as Java holds the proxy.
	void markStateful(jsi::Runtime& rt);

	// True if the JS object was made for a Java proxy that existed already. The JS object has
	// no copy of the properties then, and a read falls back to KrollProxy.getProperty().
	bool isJavaFirst() const
	{
		return javaFirst_;
	}

	// Returns a local reference to the Java proxy, or NULL if it is gone.
	// Pair each call with unreferenceJavaObject().
	jobject getJavaObject();
	void unreferenceJavaObject(jobject ref);

	// Kept for parity with the V8 runtime. True if no Java object is attached.
	bool isDetached() const
	{
		return owner_ == NONE;
	}

	// Called on any thread when the canary of the Java proxy ran its finalizer.
	static void notifyJavaUnreachable(jlong id);

	// Called on any thread when Hermes collected the JS object of a proxy.
	static void notifyJsCollected(jlong id);

	// Applies the notices that other threads queued. JS thread only.
	static void drainPending();

	// Deletes the proxy for the id. JS thread only.
	static void destroy(jlong id);

	// Deletes all proxies. Called when the runtime shuts down.
	static void destroyAll();

	// --- Class setup -------------------------------------------------------------------------

	// Creates the EventEmitter and Proxy base classes. Called once per runtime, at startup.
	static void initBaseClasses(jsi::Runtime& rt);

	// Returns the constructor of a class. Builds the class and its parents on first use.
	static jsi::Function getConstructor(jsi::Runtime& rt, ProxyClass& proxyClass);

	// Binds a class to the exports object of kroll.binding(): the instance for a module,
	// the constructor for every other class.
	static void bindClass(jsi::Runtime& rt, const jsi::Object& exports, ProxyClass& proxyClass);

	// Sets the public object for a class that needs an ES Proxy. Called by the constructor.
	void setPublicObject(jsi::Runtime& rt, const jsi::Object& object);

	// Drops the cached constructor and module instance of a class.
	static void disposeClass(jsi::Runtime& rt, ProxyClass& proxyClass);

	// Exports the Proxy base class as "Proxy". Used by the "Titanium" binding.
	static void bindProxy(jsi::Runtime& rt, const jsi::Object& exports);

	// --- Property helpers for generated code --------------------------------------------------

	// Reads a value from "_properties" through Proxy.prototype.getProperty.
	static jsi::Value getProperty(jsi::Runtime& rt, const jsi::Value& thisVal, const std::string& name);

	// Stores a value in "_properties" through Proxy.prototype.setProperty.
	static void setProperty(jsi::Runtime& rt, const jsi::Value& thisVal, const std::string& name,
		const jsi::Value& value);

	// Reports a new value to KrollProxy.onPropertyChanged() and stores it in "_properties".
	static void onPropertyChanged(jsi::Runtime& rt, const jsi::Value& thisVal, const std::string& name,
		const jsi::Value& value);

	static jsi::Value getIndexedProperty(jsi::Runtime& rt, Proxy* proxy, uint32_t index);
	static void setIndexedProperty(jsi::Runtime& rt, Proxy* proxy, uint32_t index, const jsi::Value& value);

	// Logs a deprecation warning with the JS stack of the caller.
	static void logDeprecation(jsi::Runtime& rt, const char* message);

	// Used by ProxyFactory when Java creates the proxy first. The next constructor call
	// attaches this Java object and does not create a new one.
	static jobject pendingJavaProxy;

private:
	Proxy(const Proxy&) = delete;
	void operator=(const Proxy&) = delete;

	void javaDecides(jsi::Runtime& rt);
	void jsDecides(jsi::Runtime& rt);
	void onJavaUnreachable(jsi::Runtime& rt);
	void unlinkJavaObject();

	static jsi::Function buildClass(jsi::Runtime& rt, ProxyClass& proxyClass);
	static jsi::Value construct(jsi::Runtime& rt, ProxyClass& proxyClass, const jsi::Value* args, size_t count);

	jlong id_;
	const ProxyClass* class_;
	Owner owner_;
	// The object that JS code holds: the real object, or the ES Proxy in front of it for a class
	// with indexed properties or an interceptor. Exactly one of the two handles is set.
	std::unique_ptr<jsi::Object> strong_;
	std::unique_ptr<jsi::WeakObject> weak_;
	// Key of the Java proxy in the Java ReferenceTable. 0 means no Java object.
	jlong refTableKey_;
	// The link that this object shares with the native state of the real JS object.
	std::shared_ptr<void> state_;
	// True if the proxy crossed to Java after the Java reference became weak. Java can hold the
	// proxy then, so a notice from the canary is not proof that Java dropped it.
	bool usedSinceArm_;
	bool stateful_;
	bool javaFirst_;
};

} // namespace titanium

#endif
