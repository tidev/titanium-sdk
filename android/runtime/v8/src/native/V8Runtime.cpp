/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>
#include <string.h>
#include "V8Runtime.h"

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "JNIUtil.h"
#include "V8Util.h"
#include "KrollJavaScript.h"
#include "KrollProxy.h"
#include "TypeConverter.h"
#include "APIModule.h"
#include "ScriptsModule.h"

#define TAG "V8Runtime"

namespace titanium {
/* static */
void V8Runtime::collectWeakRef(Persistent<Value> ref, void *parameter)
{
	jobject v8Object = (jobject) parameter;

	ref.Dispose();
	JNIUtil::getJNIEnv()->DeleteGlobalRef(v8Object);
}

/* static */
jobject V8Runtime::newObject(Handle<Object> object)
{
	HandleScope scope;
	LOGI(TAG, "Creating new object...");

	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!env) return NULL;

	jlong ptr = reinterpret_cast<jlong>(*Persistent<Object>::New(object));jobject
	v8Object = env->NewGlobalRef(env->NewObject(JNIUtil::v8ObjectClass, JNIUtil::v8ObjectInitMethod, ptr));

	// make a 2nd persistent weakref so we can be informed of GC
	Persistent<Object> weakRef = Persistent<Object>::New(object);
	weakRef.MakeWeak(reinterpret_cast<void*>(v8Object), V8Runtime::collectWeakRef);
	return v8Object;
}

static Persistent<Object> global;

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
	} else if (!strcmp(*module_v, "natives")) {
		exports = Object::New();
		KrollJavaScript::DefineNatives(exports);
		binding_cache->Set(module, exports);
	} else if (!strcmp(*module_v, "evals")) {
		exports = Object::New();
		ScriptsModule::Initialize(exports);
		binding_cache->Set(module, exports);
	} else {
		return ThrowException(Exception::Error(String::New("No such module")));
	}
	return scope.Close(exports);
}

/* static */
void V8Runtime::bootstrap()
{
	Local<FunctionTemplate> global_template = FunctionTemplate::New();
	EventEmitter::Initialize(global_template);

	global = Persistent<Object>::New(global_template->GetFunction()->NewInstance());
	global->Set(String::NewSymbol("binding"), FunctionTemplate::New(binding)->GetFunction());
	global->Set(String::NewSymbol("EventEmitter"), EventEmitter::constructorTemplate->GetFunction());
	global->Set(String::NewSymbol("API"), APIModule::init());

	TryCatch try_catch;
	Handle<Value> result = ExecuteString(KrollJavaScript::MainSource(), IMMUTABLE_STRING_LITERAL("kroll.js"));
	if (try_catch.HasCaught()) {
		ReportException(try_catch, true);
		JNIUtil::terminateVM();
	}
	if (!result->IsFunction()) {
		LOGF(TAG, "kroll.js result is not a function");
		ReportException(try_catch, true);
		JNIUtil::terminateVM();
	}
	Handle<Function> mainFunction = Handle<Function>::Cast(result);
	Local<Object> global = v8::Context::GetCurrent()->Global();
	Local<Value> args[] = { Local<Value>::New(global) };
	mainFunction->Call(global, 1, args);
	if (try_catch.HasCaught()) {
		ReportException(try_catch, true);
		JNIUtil::terminateVM();
	}
}

}

static jobject jruntime;
static Persistent<Context> context;

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    init
 * Signature: (Lorg/appcelerator/kroll/runtime/v8/V8Runtime;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_init(JNIEnv *env, jclass clazz, jobject self)
{
	jruntime = env->NewGlobalRef(self);
	titanium::JNIUtil::initCache(env);

	V8::Initialize();
	HandleScope scope;

	context = Context::New();
	Context::Scope context_scope(context);

	titanium::V8Runtime::bootstrap();
	titanium::initKrollProxy();
}

JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_evalData(JNIEnv *env, jclass clazz, jcharArray buffer, jstring filename)
{
	HandleScope scope;

	if (!buffer) {
		// TODO throw exception
		return;
	}

	jint len = env->GetArrayLength(buffer);
	jchar *pchars = (jchar*) env->GetPrimitiveArrayCritical(buffer, 0);
	if (!pchars) {
		// TODO throw exception
		return;
	}

	Handle<String> jsFilename = titanium::TypeConverter::javaStringToJsString(filename);
	ScriptOrigin origin(jsFilename);

	v8::Handle<v8::String> jsString = v8::String::New(pchars, len);
	v8::Handle<v8::Script> script = Script::New(jsString, &origin);
	env->ReleasePrimitiveArrayCritical(buffer, pchars, 0);

	script->Run();
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Runtime
 * Method:    dispose
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Runtime_dispose(JNIEnv *env, jclass clazz)
{
	context.Dispose();
	V8::Dispose();
	env->DeleteGlobalRef(jruntime);
	jruntime = NULL;
}

jint JNI_OnLoad(JavaVM *vm, void *reserved)
{
	titanium::JNIUtil::javaVm = vm;
	return JNI_VERSION_1_4;
}

#ifdef __cplusplus
}
#endif
