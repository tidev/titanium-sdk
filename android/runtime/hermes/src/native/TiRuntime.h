/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef TI_RUNTIME_H
#define TI_RUNTIME_H

#include <deque>
#include <jni.h>
#include <map>
#include <memory>
#include <optional>
#include <thread>
#include <unordered_map>

#include <jsi/jsi.h>

namespace titanium {

using namespace facebook;

struct ProxyClass;

// A promise that Java can settle. See HermesPromise.cpp.
struct Deferred {
	jsi::Object promise;
	std::optional<jsi::Function> resolve;
	std::optional<jsi::Function> reject;
};

// Holds every JS handle that the runtime keeps between calls.
// A jsi handle must not outlive its runtime, so nativeDispose deletes this object first.
struct RuntimeState {
	explicit RuntimeState(jsi::Runtime& rt);
	RuntimeState(jsi::Runtime& rt, const jsi::Object& prelude);

	// The "kroll" object that kroll.js receives.
	jsi::Object kroll;
	// Results of kroll.binding(name), by name.
	jsi::Object bindingCache;
	std::optional<jsi::Object> moduleObject;
	std::optional<jsi::Function> runModuleFunction;

	// Helper functions from HermesPrelude.h.
	jsi::Function makeConstructor;
	jsi::Function setupPrototype;
	jsi::Function makeStateRoot;
	jsi::Function defineNativeAccessor;
	jsi::Function defineConstant;
	jsi::Function defineOwn;
	jsi::Function defineHidden;
	jsi::Function linkBacking;
	jsi::Function makeTrappedWrapper;
	jsi::Function hasOwn;
	jsi::Function objectKeys;
	jsi::Function isArguments;
	jsi::Function isDate;
	jsi::Function constructorName;
	jsi::Function applyCreationProperties;
	jsi::Function defineDynamicProperty;
	jsi::Function makeDeferred;
	jsi::Function currentSourceUrl;
	jsi::Function jsonStringify;

	jsi::Function dateConstructor;
	jsi::Function errorConstructor;

	// Property names that the bridge reads on hot paths.
	jsi::PropNameID backingProp;
	jsi::PropNameID propertiesProp;
	jsi::PropNameID getPropertyProp;
	jsi::PropNameID setPropertyProp;
	jsi::PropNameID emitProp;
	jsi::PropNameID lengthProp;
	jsi::PropNameID nativeProp;
	jsi::PropNameID prototypeProp;

	// Returned by an interceptor that does not handle a property name.
	jsi::Object dontIntercept;

	// Trap functions for makeTrappedWrapper. Created on first use.
	std::optional<jsi::Function> getIndexedTrap;
	std::optional<jsi::Function> setIndexedTrap;
	std::optional<jsi::Function> interceptTrap;

	// The EventEmitter and Proxy base classes.
	std::optional<jsi::Function> eventEmitterConstructor;
	std::optional<jsi::Function> proxyConstructor;

	// Constructor and module instance of each generated proxy class.
	std::unordered_map<const ProxyClass*, jsi::Function> classConstructors;
	std::unordered_map<const ProxyClass*, jsi::Value> moduleInstances;

	// The name of each native accessor as a JS string. The accessor functions hold pointers
	// into this list, so that a property read or write builds no new string. A deque keeps
	// its elements in place when it grows.
	std::deque<jsi::String> accessorNames;

	// JS functions and promises that Java holds, by the id in the Java object.
	std::map<int64_t, jsi::Function> functions;
	std::map<int64_t, Deferred> resolvers;
};

class TiRuntime
{
public:
	static std::unique_ptr<jsi::Runtime> runtime;
	static std::unique_ptr<RuntimeState> state;
	static jobject javaInstance;
	static bool debuggerEnabled;
	static bool DBG;

	// True after the app ran a script that is Hermes bytecode. A production build stores each
	// JS file as bytecode, so the module loader then looks for bytecode before it reads source.
	static bool bytecodeEnabled;

	// True if the data starts with the file header of Hermes bytecode.
	static bool isHermesBytecode(const uint8_t* data, size_t length);

	// The runtime of the current app session. Call this on the JS thread only.
	static jsi::Runtime& rt()
	{
		return *runtime;
	}

	static bool isAlive()
	{
		return runtime != nullptr && state != nullptr;
	}

	static bool isJsThread();

	// Ids for Java-held functions and promises. They are never reused, also not after a restart.
	static int64_t nextHandleId();

	static void bootstrap(jsi::Runtime& rt);

	// Applies the work that other threads queued. See Proxy::drainPending().
	static void drainPending();

	// Drops a JS function or promise that Java held. Java can call this on its finalizer thread.
	// A JS handle must be destroyed on the JS thread, so another thread only queues the id.
	static void releaseFunction(int64_t id);
	static void releaseResolver(int64_t id);

	// The thread that created the runtime. Set by nativeInit.
	static std::thread::id jsThread;
};

// Put one RuntimeScope at the start of every JNI function that enters the JS runtime.
// Hermes is not thread-safe and does not run promise jobs by itself. The scope applies queued
// work on entry. When the outermost scope ends, it runs the promise jobs.
class RuntimeScope
{
public:
	RuntimeScope();
	~RuntimeScope();

	// False if the runtime is gone or if the caller is not on the JS thread.
	bool valid() const
	{
		return valid_;
	}

private:
	RuntimeScope(const RuntimeScope&) = delete;
	void operator=(const RuntimeScope&) = delete;

	bool valid_;
	static int depth;
};

} // namespace titanium

#endif
