/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <v8.h>

#include <JNIUtil.h>
#include <TypeConverter.h>

//// JNI Methods

using namespace titanium;
using namespace v8;

extern "C" {

jobject Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeGet(JNIEnv *env, jobject map,
	jlong ptr, jstring name)
{
	HandleScope scope;
	Persistent<Object>* jsObject = reinterpret_cast<Persistent<Object>*>(ptr);

	const jchar *chars = env->GetStringChars(name, NULL);
	jint len = env->GetStringLength(name);

	Local<Value> value = (*jsObject)->Get(String::New(chars, len));
	jobject result = TypeConverter::jsValueToJavaObject(value);
	env->ReleaseStringChars(name, chars);

	return result;
}

jobject Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeGetIndex(JNIEnv *env, jobject map,
	jlong ptr, jint index)
{
	HandleScope scope;
	Persistent<Object>* jsObject = reinterpret_cast<Persistent<Object>*>(ptr);

	Local<Value> value = (*jsObject)->Get((uint32_t) index);
	return TypeConverter::jsValueToJavaObject(value);
}

void Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetObject(JNIEnv *env, jobject map, jlong ptr,
	jstring name, jobject value)
{
	HandleScope scope;
	Persistent<Object>* jsObject = reinterpret_cast<Persistent<Object>*>(ptr);

	const jchar *nameChars = env->GetStringChars(name, NULL);
	jint nameLen = env->GetStringLength(name);

	(*jsObject)->Set(String::New(nameChars, nameLen),
		TypeConverter::javaObjectToJsValue(value));

	env->ReleaseStringChars(name, nameChars);
}

void Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetNumber(JNIEnv *env, jobject map,
	jlong ptr, jstring name, jdouble number)
{
	HandleScope scope;
	Persistent<Object>* jsObject = reinterpret_cast<Persistent<Object>*>(ptr);

	const jchar *nameChars = env->GetStringChars(name, NULL);
	jint nameLen = env->GetStringLength(name);

	(*jsObject)->Set(String::New(nameChars, nameLen), Number::New((double)number));
	env->ReleaseStringChars(name, nameChars);
}

void Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetBoolean(JNIEnv *env, jobject map,
	jlong ptr, jstring name, jboolean b)
{
	HandleScope scope;
	Persistent<Object>* jsObject = reinterpret_cast<Persistent<Object>*>(ptr);

	const jchar *nameChars = env->GetStringChars(name, NULL);
	jint nameLen = env->GetStringLength(name);

	(*jsObject)->Set(String::New(nameChars, nameLen), b ? True() : False());
	env->ReleaseStringChars(name, nameChars);
}

jboolean Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeHas(JNIEnv *env, jobject map,
	jlong ptr, jstring name)
{
	HandleScope scope;
	Persistent<Object>* jsObject = reinterpret_cast<Persistent<Object>*>(ptr);

	const jchar *chars = env->GetStringChars(name, NULL);
	jint len = env->GetStringLength(name);

	bool hasProperty = (*jsObject)->Has(String::New(chars, len));
	env->ReleaseStringChars(name, chars);
	return (jboolean) hasProperty;
}

jobjectArray Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeKeys(JNIEnv *env, jobject map, jlong ptr)
{
	HandleScope scope;
	Persistent<Object>* jsObject = reinterpret_cast<Persistent<Object>*>(ptr);

	Handle<Array> names = (*jsObject)->GetPropertyNames();
	int len = names->Length();
	jobjectArray keys = JNIUtil::newObjectArray(len);

	for (int i = 0; i < len; i++) {
		String::Value name(names->Get(i));
		env->SetObjectArrayElement(keys, (jint) i,
			env->NewString(*name, name.length()));
	}
	return keys;
}

} // extern "C"
