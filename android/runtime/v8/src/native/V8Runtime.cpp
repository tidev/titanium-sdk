/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>
#include <string.h>

#include "AndroidUtil.h"
#include "TitaniumGlobal.h"
#include "Assets.h"
#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "KrollJavaScript.h"
#include "ScriptsModule.h"
#include "TypeConverter.h"
#include "V8Util.h"

#include "V8Runtime.h"


#define TAG "V8Runtime"

namespace titanium {

Persistent<Context> V8Runtime::globalContext;

/* static */
void V8Runtime::collectWeakRef(Persistent<Value> ref, void *parameter)
{
	jobject v8Object = (jobject) parameter;
	ref.Dispose();
	JNIScope::getEnv()->DeleteGlobalRef(v8Object);
}

static Handle<Value> binding(const Arguments& args)
{
	static Persistent<Object> binding_cache;

	HandleScope scope;
	Local<String> module = args[0]->ToString();
	String::Utf8Value module_v(module);
	if (binding_cache.IsEmpty()) {
		binding_cache = Persistent<Object>::New(Object::New());
	}

	Local<Object> exports;
	if (binding_cache->Has(module)) {
		exports = binding_cache->Get(module)->ToObject();
	} else if (strcmp(*module_v, "natives") == 0) {
		exports = Object::New();
		KrollJavaScript::DefineNatives(exports);
		binding_cache->Set(module, exports);
	} else if (strcmp(*module_v, "evals") == 0) {
		exports = Object::New();
		ScriptsModule::Initialize(exports);
		binding_cache->Set(module, exports);
	} else if (strcmp(*module_v, "titanium") == 0) {
		exports = Object::New();
		TitaniumGlobal::Initialize(exports);
		binding_cache->Set(module, exports);
	} else {
		return ThrowException(Exception::Error(String::New("No such module")));
	}
	return scope.Close(exports);
}

/* static */
void V8Runtime::bootstrap(Local<Object> global)
{
	DEFINE_METHOD(global, "binding", binding);

	TryCatch tryCatch;
	Handle<Value> result = ExecuteString(KrollJavaScript::MainSource(), IMMUTABLE_STRING_LITERAL("kroll.js"));

	if (tryCatch.HasCaught()) {
		ReportException(tryCatch, true);
		JNIUtil::terminateVM();
	}
	if (!result->IsFunction()) {
		LOGF(TAG, "kroll.js result is not a function");
		ReportException(tryCatch, true);
		JNIUtil::terminateVM();
	}

	Handle<Function> mainFunction = Handle<Function>::Cast(result);
	Local<Value> args[] = { global };
	mainFunction->Call(global, 1, args);

	if (tryCatch.HasCaught()) {
		ReportException(tryCatch, true);
		LOGE(TAG, "has caught!!");
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
	HandleScope scope;

	LOGD(TAG, "V8Runtime_nativeInit");
	titanium::JavaObject::useGlobalRefs = useGlobalRefs;
	titanium::jruntime = env->NewGlobalRef(self);
	titanium::JNIUtil::initCache();

	Persistent<Context> context = Persistent<Context>::New(Context::New());
	context->Enter();
	titanium::V8Runtime::globalContext = context;

	Local<Object> global = context->Global();

	// TODO - these will be generated
	titanium::KrollJavaScript::initBaseTypes(global);
	titanium::V8Runtime::bootstrap(global);

	titanium::V8Runtime::globalContext = context;

	Persistent<Object> wrappedContext(titanium::ScriptsModule::WrapContext(context));
	return (jlong) *wrappedContext;
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeDispose
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeDispose(JNIEnv *env, jclass clazz)
{
	titanium::JNIScope jniScope(env);
	LOGD(TAG, "disposing global context");
	titanium::V8Runtime::globalContext->Exit();

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
