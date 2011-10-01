/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <stdio.h>
#include <v8.h>

#include "AndroidUtil.h"
#include <JNIUtil.h>
#include <TypeConverter.h>
#include "V8Runtime.h"
#include "V8Util.h"

#define TAG "V8Object"

using namespace titanium;
using namespace v8;

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeCreateObject
 * Signature: ()J
 */
JNIEXPORT jlong JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeCreateObject(JNIEnv *env, jclass clazz)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	return (jlong) *(Persistent<Object>::New(Object::New()));
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_ManagedV8Reference
 * Method:    nativeRelease
 * Signature: (J)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_ManagedV8Reference_nativeRelease(JNIEnv *env,
	jclass clazz, jlong object_ptr)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	if (object_ptr) {
		Persistent<Data> handle((Data *) object_ptr);
		if (!handle.IsEmpty() && !handle.IsNearDeath()) {
			// TODO even with Isolate this causes problems
			handle.Dispose();
		}
	}
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Value
 * Method:    toDetailString
 * Signature: (J)Ljava/lang/String;
 */
JNIEXPORT jstring JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Value_toDetailString
  (JNIEnv *env, jclass clazz, jlong value_ptr)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<String> string;
	if (value_ptr) {
		string = Persistent<Value>((Object *) value_ptr)->ToDetailString();
	}
	return TypeConverter::jsStringToJavaString(string);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeGet
 * Signature: (JLjava/lang/String;)Ljava/lang/Object;
 */
JNIEXPORT jobject JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeGet(JNIEnv *env, jobject map, jlong ptr,
	jstring name)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	Local<Value> value = jsObject->Get(TypeConverter::javaStringToJsString(name));
	jobject result = TypeConverter::jsValueToJavaObject(value);

	return result;
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeGetIndex
 * Signature: (JI)Ljava/lang/Object;
 */
JNIEXPORT jobject JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeGetIndex(JNIEnv *env, jobject map,
	jlong ptr, jint index)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	Local<Value> value = jsObject->Get((uint32_t) index);
	return TypeConverter::jsValueToJavaObject(value);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeSetObject
 * Signature: (JLjava/lang/String;Ljava/lang/Object;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetObject(JNIEnv *env, jobject map,
	jlong ptr, jstring name, jobject value)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	jsObject->Set(TypeConverter::javaStringToJsString(name),
		TypeConverter::javaObjectToJsValue(value));

}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeSetNumber
 * Signature: (JLjava/lang/String;D)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetNumber(JNIEnv *env, jobject map,
	jlong ptr, jstring name, jdouble number)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	jsObject->Set(TypeConverter::javaStringToJsString(name), Number::New((double) number));
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeSetBoolean
 * Signature: (JLjava/lang/String;Z)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetBoolean(JNIEnv *env, jobject map,
	jlong ptr, jstring name, jboolean b)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	jsObject->Set(TypeConverter::javaStringToJsString(name), b ? True() : False());
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeForceSet
 * Signature: (JLjava/lang/String;Ljava/lang/Object;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeForceSet(JNIEnv *env, jobject map,
	jlong ptr, jstring name, jobject value)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	jsObject->ForceSet(
		TypeConverter::javaStringToJsString(name),
		TypeConverter::javaObjectToJsValue(value));
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeHas
 * Signature: (JLjava/lang/String;)Z
 */
JNIEXPORT jboolean JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeHas(JNIEnv *env, jobject map,
	jlong ptr, jstring name)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	return (jboolean) jsObject->Has(TypeConverter::javaStringToJsString(name));
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeKeys
 * Signature: (J)[Ljava/lang/Object;
 */
JNIEXPORT jobjectArray JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeKeys(JNIEnv *env, jobject map,
	jlong ptr)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	Handle<Object> jsObject((Object *) ptr);

	Handle<Array> names = jsObject->GetPropertyNames();
	int len = names->Length();
	jobjectArray keys = JNIUtil::newObjectArray(len);

	for (int i = 0; i < len; i++) {
		String::Value name(names->Get(i));
		env->SetObjectArrayElement(keys, (jint) i, env->NewString(*name, name.length()));
	}
	return keys;
}

#ifdef __cplusplus
}
#endif
