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
#include "JNIUtil.h"
#include "TypeConverter.h"
#include "Proxy.h"
#include "V8Runtime.h"
#include "V8Util.h"

#include "org_appcelerator_kroll_runtime_v8_ManagedV8Reference.h"
#include "org_appcelerator_kroll_runtime_v8_V8Object.h"
#include "org_appcelerator_kroll_runtime_v8_V8Value.h"

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
JNIEXPORT jlong JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeCreateObject
	(JNIEnv *env, jclass clazz)
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
JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_ManagedV8Reference_nativeRelease
	(JNIEnv *env, jclass clazz, jlong refPointer)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);
	if (refPointer) {
		Persistent<Data> handle((Data *) refPointer);
		if (!handle.IsEmpty() && !handle.IsNearDeath()) {
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
	(JNIEnv *env, jclass clazz, jlong valuePointer)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<String> string;
	if (valuePointer) {
		string = ((Object *) valuePointer)->ToDetailString();
	}
	return TypeConverter::jsStringToJavaString(string);
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Object
 * Method:    nativeSetProperty
 * Signature: (JLjava/lang/String;Ljava/lang/Object;)V
 */
JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetProperty
	(JNIEnv *env, jobject object, jlong ptr, jstring name, jobject value)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<Object> jsObject;
	if (ptr != 0) {
		jsObject = Persistent<Object>((Object *) ptr);
	} else {
		jsObject = TypeConverter::javaObjectToJsValue(object)->ToObject();
	}

	Handle<Object> properties = jsObject->Get(Proxy::propertiesSymbol)->ToObject();
	Handle<String> jsName = TypeConverter::javaStringToJsString(name);

	Handle<Value> jsValue = TypeConverter::javaObjectToJsValue(value);
	properties->Set(jsName, jsValue);
}

#ifdef __cplusplus
}
#endif
