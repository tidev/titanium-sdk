/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <v8.h>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "TypeConverter.h"
#include "V8Runtime.h"
#include "V8Util.h"
#include "modules/ScriptsModule.h"

#define TAG "V8Script"

#ifdef __cplusplus
extern "C" {
#endif

using namespace v8;
using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Context
 * Method:    create
 * Signature: (J)J
 */
jlong Java_org_appcelerator_kroll_runtime_v8_V8Context_create(JNIEnv *env, jclass clazz,
	jlong object_ptr)
{
	titanium::JNIScope jniScope(env);
	HandleScope scope;
	Handle<Value> object = Undefined();
	if (object_ptr != 0) {
		object = Persistent<Object>((Object *) object_ptr);
	}
	Handle<Value> args[] = { object };
	Local<Function> function = v8::FunctionTemplate::New(WrappedScript::CreateContext)->GetFunction();

	TryCatch tryCatch;
	Local<Value> value = function->Call(function, 1, args);
	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
	}

	Local<Object> context = value->ToObject();
	return (jlong) *Persistent<Object>::New(context);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Script
 * Method:    compile
 * Signature: (Ljava/lang/String;)J
 */
jlong Java_org_appcelerator_kroll_runtime_v8_V8Script_compile(JNIEnv *env, jclass clazz,
	jstring string)
{
	titanium::JNIScope jniScope(env);
	HandleScope scope;
	Handle<Value> args[] = { TypeConverter::javaStringToJsString(string) };
	Handle<Object> wrappedScript = WrappedScript::constructor_template->GetFunction()->NewInstance(1, args);
	return (jlong) *Persistent<Object>::New(wrappedScript);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Script
 * Method:    runInContext
 * Signature: (JJ)J
 */
jlong Java_org_appcelerator_kroll_runtime_v8_V8Script_runInContext__JJ(JNIEnv *env, jclass clazz,
	jlong script_ptr, jlong context_ptr)
{
	titanium::JNIScope jniScope(env);
	HandleScope scope;
	Handle<Object> wrappedScript = Persistent<Object>((Object *) script_ptr);
	Handle<Object> wrappedContext = Persistent<Object>((Object *) context_ptr);

	Handle<Value> args[] = { wrappedContext };
	Local<Function> function = v8::FunctionTemplate::New(WrappedScript::RunInContext)->GetFunction();

	TryCatch tryCatch;
	Local<Value> value = function->Call(wrappedScript, 1, args);
	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
	}

	return (jlong) *Persistent<Value>::New(value);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Script
 * Method:    runInContext
 * Signature: (Ljava/lang/String;JLjava/lang/String;)J
 */
jlong Java_org_appcelerator_kroll_runtime_v8_V8Script_runInContext__Ljava_lang_String_2JLjava_lang_String_2(
	JNIEnv *env, jclass clazz, jstring source, jlong context_ptr, jstring filename)
{
	titanium::JNIScope jniScope(env);
	HandleScope scope;
	Handle<Object> wrappedContext = Persistent<Object>((Object *) context_ptr);

	Handle<Value> args[] = { TypeConverter::javaStringToJsString(source), wrappedContext,
		TypeConverter::javaStringToJsString(filename) };
	Local<Function> function = v8::FunctionTemplate::New(WrappedScript::CompileRunInContext)->GetFunction();

	TryCatch tryCatch;
	Local<Value> value = function->Call(function, 3, args);
	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
	}

	return (jlong) *Persistent<Value>::New(value);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Script
 * Method:    runInNewContext
 * Signature: (JJ)J
 */
jlong Java_org_appcelerator_kroll_runtime_v8_V8Script_runInNewContext__JJ(JNIEnv *env, jclass clazz,
	jlong script_ptr, jlong object_ptr)
{
	titanium::JNIScope jniScope(env);
	HandleScope scope;
	Handle<Object> warppedScript = Persistent<Object>((Object *) script_ptr);
	Handle<Value> object = Undefined();
	if (object_ptr != 0) {
		object = Persistent<Object>((Object *) object_ptr);
	}

	Handle<Value> args[] = { warppedScript, object };
	Local<Function> function = v8::FunctionTemplate::New(WrappedScript::RunInNewContext)->GetFunction();

	TryCatch tryCatch;
	Local<Value> value = function->Call(function, 2, args);
	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
	}

	return (jlong) *Persistent<Value>::New(value);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Script
 * Method:    runInNewContext
 * Signature: (Ljava/lang/String;JLjava/lang/String;)J
 */
jlong Java_org_appcelerator_kroll_runtime_v8_V8Script_runInNewContext__Ljava_lang_String_2JLjava_lang_String_2(
	JNIEnv *env, jclass clazz, jstring source, jlong object_ptr, jstring filename)
{
	titanium::JNIScope jniScope(env);
	HandleScope scope;
	Handle<Value> object = Undefined();
	if (object_ptr != 0) {
		object = Persistent<Object>((Object *) object_ptr);
	}

	Handle<Value> args[] = { TypeConverter::javaStringToJsString(source), object, TypeConverter::javaStringToJsString(
		filename) };
	Local<Function> function = v8::FunctionTemplate::New(WrappedScript::CompileRunInNewContext)->GetFunction();

	TryCatch tryCatch;
	Local<Value> value = function->Call(function, 3, args);

	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
	}

	return (jlong) *Persistent<Value>::New(value);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Script
 * Method:    runInContextNoResult
 * Signature: (Ljava/lang/String;JLjava/lang/String;)V
 */
void Java_org_appcelerator_kroll_runtime_v8_V8Script_runInContextNoResult(JNIEnv *env, jclass clazz, jstring source,
	jlong context_ptr, jstring filename)
{
	titanium::JNIScope jniScope(env);
	HandleScope scope;

	Handle<Object> wrappedContext = Persistent<Object>((Object *) context_ptr);
	Handle<Value> args[] = { TypeConverter::javaStringToJsString(source),
		wrappedContext, TypeConverter::javaStringToJsString(filename) };
	Local<Function> function = v8::FunctionTemplate::New(WrappedScript::CompileRunInThisContext)->GetFunction();

	TryCatch tryCatch;
	function->Call(function, 3, args);

	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
	}
}

void Java_org_appcelerator_kroll_runtime_v8_V8Script_nativeRunInThisContextNoResult(JNIEnv *env, jclass clazz, jstring source, jstring filename)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<String> jsSource = TypeConverter::javaStringToJsString(source);
	Handle<String> jsFilename = TypeConverter::javaStringToJsString(filename);

	Handle<Value> args[] = { jsSource, jsFilename };

	Local<Function> function = v8::FunctionTemplate::New(WrappedScript::CompileRunInThisContext)->GetFunction();

	TryCatch tryCatch;

	Handle<String> message = String::Concat(String::New("Executing code: "), jsFilename);
	String::Utf8Value timerMsg(message);
	LOG_TIMER(TAG, *timerMsg);

	function->Call(function, 2, args);

	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch, true);
	}
	LOG_HEAP_STATS(TAG);
}

#ifdef __cplusplus
}
#endif
