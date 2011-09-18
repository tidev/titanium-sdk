/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>
#include <string.h>

#include "AndroidUtil.h"
#include "APIModule.h"
#include "Assets.h"
#include "EventEmitter.h"
#include "JNIUtil.h"
#include "KrollJavaScript.h"
#include "KrollProxy.h"
#include "ScriptsModule.h"
#include "TypeConverter.h"
#include "V8Util.h"

#include "V8Runtime.h"

#define TAG "V8Runtime"

namespace titanium {
/* static */
void V8Runtime::collectWeakRef(Persistent<Value> ref, void *parameter)
{
	LOGD("collectWeakRef", "-------1");
	jobject v8Object = (jobject) parameter;
	LOGD("collectWeakRef", "-------2");
	ref.Dispose();
	LOGD("collectWeakRef", "-------3");
	JNIUtil::getJNIEnv()->DeleteGlobalRef(v8Object);
	LOGD("collectWeakRef", "-------4");
}

/* static */
jobject V8Runtime::newObject(Handle<Object> object)
{
	HandleScope scope;
	LOGI(TAG, "Creating new object...");

	JNIEnv *env = JNIUtil::getJNIEnv();
	LOGD("newObject", "-------1");
	if (!env) return NULL;

	LOGD("newObject", "-------2");
	jlong ptr = reinterpret_cast<jlong>(*Persistent<Object>::New(object));

	LOGD("newObject", "-------3");
	jobject v8Object = env->NewGlobalRef(env->NewObject(JNIUtil::v8ObjectClass, JNIUtil::v8ObjectInitMethod, ptr));

	LOGD("newObject", "-------4");
	// make a 2nd persistent weakref so we can be informed of GC
	Persistent<Object> weakRef = Persistent<Object>::New(object);

	LOGD("newObject", "-------5");
	weakRef.MakeWeak(reinterpret_cast<void*>(v8Object), V8Runtime::collectWeakRef);

	LOGD("newObject", "-------6");
	return v8Object;
}

static Handle<Value> binding(const Arguments& args)
{
	static Persistent<Object> binding_cache;

	LOGD("binding", "-------1");
	HandleScope scope;
	LOGD("binding", "-------2");
	Local<String> module = args[0]->ToString();
	LOGD("binding", "-------3");
	String::Utf8Value module_v(module);
	LOGD("binding", "-------4");
	if (binding_cache.IsEmpty()) {
		LOGD("binding", "-------5");
		binding_cache = Persistent<Object>::New(Object::New());
		LOGD("binding", "-------6");
	}

	Local<Object> exports;
	LOGD("binding", "-------7");
	if (binding_cache->Has(module)) {
		LOGD("binding", "-------8");
		exports = binding_cache->Get(module)->ToObject();
		LOGD("binding", "-------9");
	} else if (!strcmp(*module_v, "natives")) {
		LOGD("binding", "-------10");
		exports = Object::New();
		LOGD("binding", "-------11");
		KrollJavaScript::DefineNatives(exports);
		LOGD("binding", "-------12");
		binding_cache->Set(module, exports);
		LOGD("binding", "-------13");
	} else if (!strcmp(*module_v, "evals")) {
		LOGD("binding", "-------14");
		exports = Object::New();
		LOGD("binding", "-------15");
		ScriptsModule::Initialize(exports);
		LOGD("binding", "-------16");
		binding_cache->Set(module, exports);
		LOGD("binding", "-------17");
	} else {
		LOGD("binding", "-------18");
		return ThrowException(Exception::Error(String::New("No such module")));
	}
	LOGD("binding", "-------19");
	return scope.Close(exports);
}

/* static */
void V8Runtime::bootstrap(Local<Object> global)
{
	EventEmitter::Initialize();

	global->Set(String::NewSymbol("binding"), FunctionTemplate::New(binding)->GetFunction());
	global->Set(String::NewSymbol("EventEmitter"), EventEmitter::constructorTemplate->GetFunction());
	global->Set(String::NewSymbol("API"), APIModule::init());

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
	Local<Value> args[] = { Local<Value>::New(global) };
	mainFunction->Call(global, 1, args);

	if (tryCatch.HasCaught()) {
		ReportException(tryCatch, true);
		JNIUtil::terminateVM();
	}
}

static jobject jruntime;
static Persistent<Context> context;

} // namespace titanium


#ifdef __cplusplus
extern "C" {
#endif

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    nativeInit
 * Signature: (Lorg/appcelerator/kroll/runtime/v8/V8Runtime;)J
 */
JNIEXPORT jlong JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeInit(JNIEnv *env, jclass clazz, jobject self)
{
	HandleScope scope;

	titanium::jruntime = env->NewGlobalRef(self);
	titanium::JNIUtil::initCache(env);

	if (!V8::Initialize()) {
		LOGE(TAG, "V8 failed to initialize");
		return 0;
	}

	titanium::context = Context::New();
	Context::Scope contextScope(titanium::context);

	Local<Object> global = titanium::context->Global();
	titanium::V8Runtime::bootstrap(global);

	LOGD(TAG, "initKrollProxy");
	titanium::initKrollProxy(global, env);

	LOGD(TAG, "return casted context ptr");
	return reinterpret_cast<long>(*titanium::context);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    dispose
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_dispose(JNIEnv *env, jclass clazz)
{
	titanium::context.Dispose();
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
