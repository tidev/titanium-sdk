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

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "KrollBindings.h"
#include "ScriptsModule.h"
#include "TypeConverter.h"
#include "V8Util.h"

#include "V8Runtime.h"

#define TAG "V8Runtime"

namespace titanium {

Persistent<Context> V8Runtime::globalContext;
static Persistent<Object> krollGlobalObject;

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

static jobject jruntime;

} // namespace titanium

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeInit
 * Signature: (Lorg/appcelerator/kroll/runtime/v8/V8Runtime;)J
 */
JNIEXPORT jlong JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeInit(JNIEnv *env, jobject self, jboolean useGlobalRefs)
{
	titanium::JNIScope jniScope(env);
	Locker locker;
	HandleScope scope;

	LOGD(TAG, "nativeInit");
	titanium::JavaObject::useGlobalRefs = useGlobalRefs;
	titanium::jruntime = env->NewGlobalRef(self);
	titanium::JNIUtil::initCache();

	Persistent<Context> context = Persistent<Context>::New(Context::New());
	Context::Scope contextScope(context);

	titanium::V8Runtime::globalContext = context;
	titanium::V8Runtime::bootstrap(context->Global());

	Persistent<Object> wrappedContext(titanium::ScriptsModule::WrapContext(context));
	LOG_HEAP_STATS(TAG);

	return (jlong) *wrappedContext;
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeRunModule
 * Signature: (Ljava/lang/String;Ljava/lang/String;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeRunModule(JNIEnv *env, jobject self, jstring source, jstring filename)
{
	ENTER_V8(titanium::V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<String> jsSource = titanium::TypeConverter::javaStringToJsString(source);
	Handle<String> jsFilename = titanium::TypeConverter::javaStringToJsString(filename);
	Handle<Object> module = titanium::krollGlobalObject->Get(String::New("Module"))->ToObject();
	Handle<Function> runMainModule = Handle<Function>::Cast(module->Get(String::New("runMainModule")));

	Handle<Value> args[] = { jsSource, jsFilename };
	runMainModule->Call(module, 2, args);
}


/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeDispose
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeDispose(JNIEnv *env, jclass clazz)
{
	titanium::JNIScope jniScope(env);
	Locker locker;

	LOGD(TAG, "disposing global context");
	titanium::V8Runtime::globalContext.Dispose();
	V8::Dispose();

	env->DeleteGlobalRef(titanium::jruntime);
	titanium::jruntime = NULL;
}

jint JNI_OnLoad(JavaVM *vm, void *reserved)
{
	titanium::JNIUtil::javaVm = vm;
	return JNI_VERSION_1_4;
}

#ifdef __cplusplus
}
#endif
