/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <stdio.h>
#include <string.h>
#include <v8.h>
#ifdef V8_DEBUGGER
# include <v8-debug.h>
#endif

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "KrollBindings.h"
#include "ScriptsModule.h"
#include "TypeConverter.h"
#include "V8Util.h"

#include "V8Runtime.h"

#include "org_appcelerator_kroll_runtime_v8_V8Runtime.h"

#define TAG "V8Runtime"

namespace titanium {

Persistent<Context> V8Runtime::globalContext;
Persistent<Object> V8Runtime::krollGlobalObject;
jobject V8Runtime::javaInstance;

/* static */
void V8Runtime::collectWeakRef(Persistent<Value> ref, void *parameter)
{
	jobject v8Object = (jobject) parameter;
	ref.Dispose();
	JNIScope::getEnv()->DeleteGlobalRef(v8Object);
}

// Minimalistic log function for debugging in kroll.js
static Handle<Value> jsLog(const Arguments& args)
{
	HandleScope scope;
	if (args.Length() == 0) return Undefined();

	String::Utf8Value msg(args[0]);
	LOGD(TAG, *msg);

	return Undefined();
}

/* static */
void V8Runtime::bootstrap(Local<Object> global)
{
	EventEmitter::Initialize();
	krollGlobalObject = Persistent<Object>::New(Object::New());

	DEFINE_METHOD(krollGlobalObject, "log", jsLog);
	DEFINE_METHOD(krollGlobalObject, "binding", KrollBindings::getBinding);
	DEFINE_TEMPLATE(krollGlobalObject, "EventEmitter", EventEmitter::constructorTemplate);

	LOG_TIMER(TAG, "Executing kroll.js");

	TryCatch tryCatch;
	Handle<Value> result = V8Util::executeString(KrollBindings::getMainSource(), String::New("kroll.js"));

	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
		JNIUtil::terminateVM();
	}
	if (!result->IsFunction()) {
		LOGF(TAG, "kroll.js result is not a function");
		V8Util::reportException(tryCatch, true);
		JNIUtil::terminateVM();
	}

	Handle<Function> mainFunction = Handle<Function>::Cast(result);
	Local<Value> args[] = { Local<Value>::New(krollGlobalObject) };
	mainFunction->Call(global, 1, args);

	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
		LOGE(TAG, "Caught exception while bootstrapping Kroll");
		JNIUtil::terminateVM();
	}
}

static void logV8Exception(Handle<Message> msg, Handle<Value> data)
{
	HandleScope scope;

	// Log reason and location of the error.
	LOGD(TAG, *String::Utf8Value(msg->Get()));
	LOGD(TAG, "%s @ %d >>> %s",
		*String::Utf8Value(msg->GetScriptResourceName()),
		msg->GetLineNumber(),
		*String::Utf8Value(msg->GetSourceLine()));
}

#ifdef V8_DEBUGGER
static jmethodID dispatchDebugMessage = NULL;

static void dispatchHandler()
{
	static JNIEnv *env = NULL;
	if (!env) {
		titanium::JNIUtil::javaVm->AttachCurrentThread(&env, NULL);
	}

	env->CallVoidMethod(V8Runtime::javaInstance, dispatchDebugMessage);
}
#endif

} // namespace titanium

#ifdef __cplusplus
extern "C" {
#endif

using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeInit
 * Signature: (Lorg/appcelerator/kroll/runtime/v8/V8Runtime;)J
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeInit(JNIEnv *env, jobject self, jboolean useGlobalRefs)
{
	HandleScope scope;
	titanium::JNIScope jniScope(env);

	// Log all uncaught V8 exceptions.
	V8::AddMessageListener(logV8Exception);
	V8::SetCaptureStackTraceForUncaughtExceptions(true);

	LOGD(TAG, "nativeInit");
	JavaObject::useGlobalRefs = useGlobalRefs;

	V8Runtime::javaInstance = env->NewGlobalRef(self);
	JNIUtil::initCache();

	Persistent<Context> context = Persistent<Context>::New(Context::New());
	context->Enter();

#ifdef V8_DEBUGGER
	jclass v8RuntimeClass = env->FindClass("org/appcelerator/kroll/runtime/v8/V8Runtime");
	dispatchDebugMessage = env->GetMethodID(v8RuntimeClass, "dispatchDebugMessages", "()V");

	Debug::SetDebugMessageDispatchHandler(dispatchHandler);
	Debug::EnableAgent("titanium", 9999, true);
#endif

	V8Runtime::globalContext = context;
	V8Runtime::bootstrap(context->Global());

	LOG_HEAP_STATS(TAG);
}

static Persistent<Object> moduleObject;
static Persistent<Function> runMainModuleFunction;

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeRunModule
 * Signature: (Ljava/lang/String;Ljava/lang/String;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeRunModule(JNIEnv *env, jobject self, jstring source, jstring filename)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	if (moduleObject.IsEmpty()) {
		moduleObject = Persistent<Object>::New(
			V8Runtime::krollGlobalObject->Get(String::New("Module"))->ToObject());

		runMainModuleFunction = Persistent<Function>::New(
			Handle<Function>::Cast(moduleObject->Get(String::New("runMainModule"))));
	}

	Handle<String> jsSource = TypeConverter::javaStringToJsString(source);
	Handle<String> jsFilename = TypeConverter::javaStringToJsString(filename);

	Handle<Value> args[] = { jsSource, jsFilename };
	runMainModuleFunction->Call(moduleObject, 2, args);
}

JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeProcessDebugMessages(JNIEnv *env, jobject self)
{
#ifdef V8_DEBUGGER
	v8::Debug::ProcessDebugMessages();
#endif
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeDispose
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeDispose(JNIEnv *env, jobject runtime)
{
	JNIScope jniScope(env);

	LOGE(TAG, "Disposing global context");
	V8Runtime::globalContext.Dispose();
	V8::Dispose();

	env->DeleteGlobalRef(V8Runtime::javaInstance);
	V8Runtime::javaInstance = NULL;
}

jint JNI_OnLoad(JavaVM *vm, void *reserved)
{
	JNIUtil::javaVm = vm;
	return JNI_VERSION_1_4;
}

#ifdef __cplusplus
}
#endif
