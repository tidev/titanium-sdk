/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <stdio.h>
#include <cstring>

#include <v8-platform.h>
#include <libplatform/libplatform.h>

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "Proxy.h"
#include "JNIUtil.h"
#include "JSDebugger.h"
#include "JSException.h"
#include "KrollBindings.h"
#include "ProxyFactory.h"
#include "ScriptsModule.h"
#include "TypeConverter.h"
#include "V8Util.h"

#include "V8Runtime.h"
#include "V8Snapshots.h"

#define TAG "V8Runtime"

// The port number on which the V8 debugger will listen on.
#define V8_DEBUGGER_PORT 9999

namespace titanium {

Persistent<Context> V8Runtime::globalContext;
Persistent<Object> V8Runtime::krollGlobalObject;
Persistent<Object> V8Runtime::moduleObject;
Persistent<Function> V8Runtime::runModuleFunction;

jobject V8Runtime::javaInstance;
std::unique_ptr<v8::Platform> V8Runtime::platform;
Isolate* V8Runtime::v8_isolate = nullptr;
bool V8Runtime::debuggerEnabled = false;
bool V8Runtime::DBG = false;
bool V8Runtime::initialized = false;

typedef std::unique_ptr<v8::ArrayBuffer::Allocator> V8ArrayBufferAllocator;
V8ArrayBufferAllocator v8Allocator;

/* static */
void V8Runtime::collectWeakRef(Persistent<Value> ref, void *parameter)
{
	jobject v8Object = (jobject) parameter;
	ref.Reset();
	JNIScope::getEnv()->DeleteGlobalRef(v8Object);
}

Local<Object> V8Runtime::Global()
{
	// FIXME: This isn't the global, it's the global.kroll instance!
	return krollGlobalObject.Get(v8_isolate);
}

Local<Context> V8Runtime::GlobalContext()
{
	return globalContext.Get(v8_isolate);
}

Local<Object> V8Runtime::ModuleObject()
{
	return moduleObject.Get(v8_isolate);
}

Local<Function> V8Runtime::RunModuleFunction()
{
	return runModuleFunction.Get(v8_isolate);
}

// Minimalistic logging function for internal JS
static void krollLog(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	HandleScope scope(isolate);
	uint32_t len = args.Length();

	if (len < 2) {
		JSException::Error(isolate, "log: missing required tag and message arguments");
		return;
	}

	Local<String> tag = args[0].As<String>();
	Local<String> message = args[1].As<String>();
	Local<String> space = STRING_NEW(isolate, " ");
	for (uint32_t i = 2; i < len; ++i) {
		message = String::Concat(isolate, String::Concat(isolate, message, space), args[i].As<String>());
	}

	String::Utf8Value tagValue(isolate, tag);
	String::Utf8Value messageValue(isolate, message);
	__android_log_print(ANDROID_LOG_DEBUG, *tagValue, *messageValue);
}

/* static */
void V8Runtime::bootstrap(Local<Context> context)
{
	Isolate* isolate = context->GetIsolate();
	EventEmitter::initTemplate(context);

	Local<Object> kroll = Object::New(isolate);
	krollGlobalObject.Reset(isolate, kroll);

	KrollBindings::initFunctions(kroll, context);

	SetMethod(context, isolate, kroll, "log", krollLog);
	// Move this into the EventEmitter::initTemplate call?
	Local<FunctionTemplate> eect = Local<FunctionTemplate>::New(isolate, EventEmitter::constructorTemplate);
	{
		v8::TryCatch tryCatch(isolate);
		Local<Function> eventEmitterConstructor;
		MaybeLocal<Function> maybeEventEmitterConstructor = eect->GetFunction(context);
		if (!maybeEventEmitterConstructor.ToLocal(&eventEmitterConstructor)) {
			titanium::V8Util::fatalException(isolate, tryCatch);
			return;
		}
		kroll->Set(context, NEW_SYMBOL(isolate, "EventEmitter"), eventEmitterConstructor);
	}

	kroll->Set(context, NEW_SYMBOL(isolate, "runtime"), STRING_NEW(isolate, "v8"));
	kroll->Set(context, NEW_SYMBOL(isolate, "DBG"), v8::Boolean::New(isolate, V8Runtime::DBG));

	LOG_TIMER(TAG, "Executing kroll.js");

	TryCatch tryCatch(isolate);
	Local<Value> result = V8Util::executeString(isolate, KrollBindings::getMainSource(isolate), STRING_NEW(isolate, "ti:/kroll.js"));

	if (tryCatch.HasCaught()) {
		V8Util::reportException(isolate, tryCatch, true);
	}
	if (!result->IsFunction()) {
		LOGF(TAG, "kroll.js result is not a function");
		V8Util::reportException(isolate, tryCatch, true);
	}

	// Add a reference to the global object
	Local<Object> global = context->Global();

	// Set the __dirname and __filename for the app.js.
	// For other files, it will be injected via the `NativeModule` JavaScript class
	global->Set(context, NEW_SYMBOL(isolate, "__filename"), STRING_NEW(isolate, "/app.js"));
	global->Set(context, NEW_SYMBOL(isolate, "__dirname"), STRING_NEW(isolate, "/"));

	Local<Function> mainFunction = result.As<Function>();
	Local<Value> args[] = { global, kroll };
	mainFunction->Call(context, global, 2, args);

	if (tryCatch.HasCaught()) {
		V8Util::reportException(isolate, tryCatch, true);
		LOGE(TAG, "Caught exception while bootstrapping Kroll");
	}
}

static void logV8Exception(Local<Message> msg, Local<Value> data)
{
	HandleScope scope(V8Runtime::v8_isolate);
	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();

	// Log reason and location of the error.
	String::Utf8Value utf8Message(V8Runtime::v8_isolate, msg->Get());
	String::Utf8Value utf8ScriptName(V8Runtime::v8_isolate, msg->GetScriptResourceName());
	LOGD(TAG, *utf8Message);
	LOGD(TAG, "%s @ %d >>> %s",
		*utf8ScriptName,
		msg->GetLineNumber(context).FromMaybe(-1),
		msg->GetSourceLine(context).ToLocalChecked());
}

} // namespace titanium

extern "C" {

using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeInit
 * Signature: (Lorg/appcelerator/kroll/runtime/v8/V8Runtime;)J
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeInit(JNIEnv *env, jobject self, jobject debugger, jboolean DBG, jboolean profilerEnabled)
{
	if (!V8Runtime::initialized) {
		// Initialize V8.
		// TODO Enable this when we use snapshots?
		//V8::InitializeExternalStartupData(argv[0]);
		V8Runtime::platform = platform::NewDefaultPlatform();
		V8::InitializePlatform(V8Runtime::platform.get());
		V8::Initialize();
		V8Runtime::initialized = true;
	}

	titanium::JNIScope jniScope(env);

	V8Runtime::DBG = DBG;

	V8Runtime::javaInstance = env->NewGlobalRef(self);
	JNIUtil::initCache();

	Isolate* isolate;
	if (V8Runtime::v8_isolate == nullptr) {
		// Create a new Isolate and make it the current one.
		Isolate::CreateParams create_params;
		v8Allocator = V8ArrayBufferAllocator(v8::ArrayBuffer::Allocator::NewDefaultAllocator());
		create_params.array_buffer_allocator = v8Allocator.get();
#ifdef V8_SNAPSHOT_H
		create_params.snapshot_blob = &snapshot;
#endif
		isolate = Isolate::New(create_params);
		isolate->Enter();

		V8Runtime::v8_isolate = isolate;

		// Log all uncaught V8 exceptions.
		isolate->AddMessageListener(logV8Exception);
		// isolate->SetAbortOnUncaughtExceptionCallback(ShouldAbortOnUncaughtException);
		// isolate->SetAutorunMicrotasks(false);
		// isolate->SetFatalErrorHandler(OnFatalError);
		isolate->SetCaptureStackTraceForUncaughtExceptions(true, 10, v8::StackTrace::kOverview);
	} else {
		isolate = V8Runtime::v8_isolate;
		isolate->Enter();
	}

	HandleScope scope(isolate);
	Local<Context> context = Context::New(isolate);
	context->Enter();

	V8Runtime::globalContext.Reset(isolate, context);

	JSDebugger::init(env, debugger, context);
	if (debugger != nullptr) {
		V8Runtime::debuggerEnabled = true;
	}

	V8Runtime::bootstrap(context);

	LOG_HEAP_STATS(isolate, TAG);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeRunModule
 * Signature: (Ljava/lang/String;Ljava/lang/String;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeRunModuleBytes
	(JNIEnv *env, jobject self, jbyteArray source, jstring filename, jobject activityProxy)
{
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);
	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();

	if (V8Runtime::moduleObject.IsEmpty()) {
		Local<Object> module;
		{
			v8::TryCatch tryCatch(V8Runtime::v8_isolate);
			Local<Value> moduleValue;
			MaybeLocal<Value> maybeModule = context->Global()->Get(context, STRING_NEW(V8Runtime::v8_isolate, "Module"));
			if (!maybeModule.ToLocal(&moduleValue)) {
				titanium::V8Util::fatalException(V8Runtime::v8_isolate, tryCatch);
				return;
			}
			module = moduleValue.As<Object>();
			V8Runtime::moduleObject.Reset(V8Runtime::v8_isolate, module);
		}

		{
			v8::TryCatch tryCatch(V8Runtime::v8_isolate);
			Local<Value> runModule;
			MaybeLocal<Value> maybeRunModule = module->Get(context, STRING_NEW(V8Runtime::v8_isolate, "runModule"));
			if (!maybeRunModule.ToLocal(&runModule)) {
				titanium::V8Util::fatalException(V8Runtime::v8_isolate, tryCatch);
				return;
			}
			V8Runtime::runModuleFunction.Reset(V8Runtime::v8_isolate, runModule.As<Function>());
		}
	}

	Local<Value> jsSource = TypeConverter::javaBytesToJsString(V8Runtime::v8_isolate, env, source);
	Local<Value> jsFilename = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, filename);
	Local<Value> jsActivity = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, activityProxy);

	Local<Value> args[] = { jsSource, jsFilename, jsActivity };
	TryCatch tryCatch(V8Runtime::v8_isolate);
	V8Runtime::RunModuleFunction()->Call(context, V8Runtime::ModuleObject(), 3, args);

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch, true);
	}
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeRunModule
 * Signature: (Ljava/lang/String;Ljava/lang/String;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeRunModule
	(JNIEnv *env, jobject self, jstring source, jstring filename, jobject activityProxy)
{
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);
	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();

	if (V8Runtime::moduleObject.IsEmpty()) {
		Local<Object> module;
		{
			v8::TryCatch tryCatch(V8Runtime::v8_isolate);
			Local<Value> moduleValue;
			MaybeLocal<Value> maybeModule = context->Global()->Get(context, STRING_NEW(V8Runtime::v8_isolate, "Module"));
			if (!maybeModule.ToLocal(&moduleValue)) {
				titanium::V8Util::fatalException(V8Runtime::v8_isolate, tryCatch);
				return;
			}
			module = moduleValue.As<Object>();
			V8Runtime::moduleObject.Reset(V8Runtime::v8_isolate, module);
		}

		{
			v8::TryCatch tryCatch(V8Runtime::v8_isolate);
			Local<Value> runModule;
			MaybeLocal<Value> maybeRunModule = module->Get(context, STRING_NEW(V8Runtime::v8_isolate, "runModule"));
			if (!maybeRunModule.ToLocal(&runModule)) {
				titanium::V8Util::fatalException(V8Runtime::v8_isolate, tryCatch);
				return;
			}
			V8Runtime::runModuleFunction.Reset(V8Runtime::v8_isolate, runModule.As<Function>());
		}
	}

	Local<Value> jsSource = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, source);
	Local<Value> jsFilename = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, filename);
	Local<Value> jsActivity = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, activityProxy);

	Local<Value> args[] = { jsSource, jsFilename, jsActivity };
	TryCatch tryCatch(V8Runtime::v8_isolate);
	V8Runtime::RunModuleFunction()->Call(context, V8Runtime::ModuleObject(), 3, args);

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch, true);
	}
}

JNIEXPORT jobject JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeEvalString
	(JNIEnv *env, jobject self, jstring source, jstring filename)
{
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);

	Local<Value> jsSource = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, source);
	if (jsSource.IsEmpty() || !jsSource->IsString()) {
		LOGE(TAG, "Error converting Javascript string, aborting evalString");
		return NULL;
	}

	Local<Value> jsFilename = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, filename);

	TryCatch tryCatch(V8Runtime::v8_isolate);
	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();
	ScriptOrigin origin(jsFilename);
	MaybeLocal<Script> maybeScript = Script::Compile(context, jsSource.As<String>(), &origin);
	if (maybeScript.IsEmpty()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch, true);
		return NULL;
	}
	Local<Script> script = maybeScript.ToLocalChecked();
	MaybeLocal<Value> result = script->Run(context);
	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch, true);
		return NULL;
	}

	return TypeConverter::jsValueToJavaObject(V8Runtime::v8_isolate, env, result.ToLocalChecked());
}

JNIEXPORT jboolean JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeIdle(JNIEnv *env, jobject self)
{
	// If we're closing up shop, return true, which is equivalent to V8 GC saying there's no more work to do
	//if (V8Runtime::disposed) {
	//	return true;
	//}

	// TODO Pump the message loop/queues until it's empty?
	// while (v8::platform::PumpMessageLoop(V8Runtime::platform, V8Runtime:v8_isolate)) continue;
	// v8::platform::RunIdleTasks(g_platform, isolate, 50.0 / base::Time::kMillisecondsPerSecond);

	// notify V8 of low memory to suggest a full GC
	V8Runtime::v8_isolate->LowMemoryNotification();
	return true;

	// give GC time to perform cleanup (1 second)
	// double deadline_in_s = V8Runtime::platform->MonotonicallyIncreasingTime() + 1;
	// return V8Runtime::v8_isolate->IdleNotificationDeadline(deadline_in_s);
}

/*
 * Called by V8Runtime.java, this passes a KrollSourceCodeProvider java class instance
 * to KrollBindings, where it's stored and later used to retrieve an external CommonJS module's
 * Javascript code when require(moduleName) occurs in Javascript.
 * "External" CommonJS modules are CommonJS modules stored in external modules.
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeAddExternalCommonJsModule
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

// This method disposes of all native resources used by V8 when
// all activities have been destroyed by the application.
//
// When a Persistent handle is Dispose()'d in V8, the internal
// pointer is not changed, handle->IsEmpty() returns false.
// As a consequence, we have to explicitly reset the handle
// to an empty handle using Persistent<Type>()
//
// Since we use lazy initialization in a lot of our code,
// there's probably not an easier way (unless we use boolean flags)

JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeDispose(JNIEnv *env, jobject runtime)
{
	JNIScope jniScope(env);

	// We use a new scope here so any new handles we create
	// while disposing are cleaned up before our global context
	// is disposed below.
	{
		HandleScope scope(V8Runtime::v8_isolate);

		// KrollBindings
		KrollBindings::dispose(V8Runtime::v8_isolate);
		EventEmitter::dispose();

		V8Runtime::GlobalContext()->DetachGlobal();
	}

	// Dispose of each class' static cache / resources
	V8Util::dispose();
	ProxyFactory::dispose();

	V8Runtime::moduleObject.Reset();
	V8Runtime::runModuleFunction.Reset();
	V8Runtime::krollGlobalObject.Reset();

	{
		HandleScope scope(V8Runtime::v8_isolate);
		V8Runtime::GlobalContext()->Exit();
	}

	V8Runtime::globalContext.Reset();

	// Removes the retained global reference to the V8Runtime
	env->DeleteGlobalRef(V8Runtime::javaInstance);
	V8Runtime::javaInstance = NULL;

	// Whereas most calls to IdleNotification get kicked off via Java (the looper's
	// idle event in V8Runtime.java), we can't count on that running anymore at this point.
	// So as our last act, run IdleNotification until it returns true so we can clean up all
	// the stuff we just released references for above.
	while (!V8Runtime::v8_isolate->IdleNotificationDeadline(V8Runtime::platform->MonotonicallyIncreasingTime() + 1.0));

	// Typically in a V8 embedded app, we'd clean everything up here. But since
	// an app may just be closed/backgrounded but still alive, we can't do this
	// because we can't re-initialize once it's disposed.

	// Do final cleanup
	V8Runtime::v8_isolate->Exit();
	//V8Runtime::v8_isolate->Dispose();
	//V8::Dispose();
	//V8::ShutdownPlatform();
	//delete V8Runtime::platform;
}

jint JNI_OnLoad(JavaVM *vm, void *reserved)
{
	JNIUtil::javaVm = vm;
	return JNI_VERSION_1_4;
}

} // extern "C"
