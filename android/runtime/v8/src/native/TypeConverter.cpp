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
#include "TypeConverter.h"
#include "JNIUtil.h"
#include "JavaObject.h"
#include "ProxyFactory.h"
#include "V8Runtime.h"

#define TAG "TypeConverter"

using namespace titanium;

/****************************** public methods ******************************/
jshort TypeConverter::jsNumberToJavaShort(v8::Handle<v8::Number> jsNumber)
{
	return ((jshort) jsNumber->Value());
}

v8::Handle<v8::Number> TypeConverter::javaShortToJsNumber(jshort javaShort)
{
	return v8::Number::New((double) javaShort);
}

jint TypeConverter::jsNumberToJavaInt(v8::Handle<v8::Number> jsNumber)
{
	return ((jint) jsNumber->Value());
}

v8::Handle<v8::Number> TypeConverter::javaIntToJsNumber(jint javaInt)
{
	return v8::Number::New((double) javaInt);
}

jlong TypeConverter::jsNumberToJavaLong(v8::Handle<v8::Number> jsNumber)
{
	return ((jlong) jsNumber->Value());
}

v8::Handle<v8::Number> TypeConverter::javaLongToJsNumber(jlong javaLong)
{
	return v8::Number::New((double) javaLong);
}

jfloat TypeConverter::jsNumberToJavaFloat(v8::Handle<v8::Number> jsNumber)
{
	return ((jfloat) jsNumber->Value());
}

v8::Handle<v8::Number> TypeConverter::javaFloatToJsNumber(jfloat javaFloat)
{
	return v8::Number::New((double) javaFloat);
}

jdouble TypeConverter::jsNumberToJavaDouble(v8::Handle<v8::Number> jsNumber)
{
	return ((jdouble) jsNumber->Value());
}

v8::Handle<v8::Number> TypeConverter::javaDoubleToJsNumber(jdouble javaDouble)
{
	return v8::Number::New(javaDouble);
}

jboolean TypeConverter::jsBooleanToJavaBoolean(v8::Handle<v8::Boolean> jsBoolean)
{
	return (jsBoolean->Value()) == JNI_TRUE;
}

v8::Handle<v8::Boolean> TypeConverter::javaBooleanToJsBoolean(jboolean javaBoolean)
{
	return v8::Boolean::New((bool) javaBoolean);
}

jstring TypeConverter::jsStringToJavaString(v8::Handle<v8::String> jsString)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

	v8::String::Value javaString(jsString);
	return env->NewString(*javaString, javaString.length());
}

jstring TypeConverter::jsValueToJavaString(v8::Handle<v8::Value> jsValue)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

	v8::Local<v8::String> jsString = jsValue->ToString();
	v8::String::Value javaString(jsString);
	return env->NewString(*javaString, javaString.length());
}

v8::Handle<v8::String> TypeConverter::javaStringToJsString(jstring javaString)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::String>();
	}

	const char *nativeString = env->GetStringUTFChars(javaString, 0);
	int nativeStringLength = env->GetStringUTFLength(javaString);

	v8::Handle<v8::String> jsString = v8::String::New(nativeString, nativeStringLength);
	env->ReleaseStringUTFChars(javaString, nativeString);

	return jsString;
}

jobject TypeConverter::jsDateToJavaDate(v8::Handle<v8::Date> jsDate)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

	return env->NewObject(JNIUtil::dateClass, JNIUtil::dateInitMethod, (jlong) jsDate->NumberValue());
}

jlong TypeConverter::jsDateToJavaLong(v8::Handle<v8::Date> jsDate)
{
	return (jlong) jsDate->NumberValue();
}

v8::Handle<v8::Date> TypeConverter::javaDateToJsDate(jobject javaDate)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Date>();
	}

	jlong epochTime = env->CallLongMethod(javaDate, JNIUtil::dateGetTimeMethod);
	return v8::Handle<v8::Date>::Cast(v8::Date::New((double) epochTime));
}

v8::Handle<v8::Date> TypeConverter::javaLongToJsDate(jlong javaLong)
{
	return v8::Handle<v8::Date>::Cast(v8::Date::New((double) javaLong));
}

jobject TypeConverter::jsObjectToJavaFunction(v8::Handle<v8::Object> jsObject)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return NULL;
	}

	jlong pointer = (jlong) *Persistent<Object>::New(jsObject);
	return env->NewObject(JNIUtil::v8FunctionClass, JNIUtil::v8FunctionInitMethod, pointer);
}

jobjectArray TypeConverter::jsArgumentsToJavaArray(const Arguments& args)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return NULL;
	}

	HandleScope scope;
	int argCount = args.Length();
	jobjectArray javaArgs = env->NewObjectArray(argCount, JNIUtil::objectClass, NULL);

	for (int i = 0; i < argCount; ++i)
	{
		Local<Value> v8Arg = args[i];
		jobject javaArg = jsValueToJavaObject(v8Arg);
		env->SetObjectArrayElement(javaArgs, i, javaArg);
		env->DeleteLocalRef(javaArg);
	}

	return javaArgs;
}

jarray TypeConverter::jsArrayToJavaArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

	int arrayLength = jsArray->Length();
	jobjectArray javaArray = env->NewObjectArray(arrayLength, JNIUtil::objectClass, NULL);

	for (int i = 0; i < arrayLength; i++) {
		v8::Local<v8::Value> element = jsArray->Get(i);
		jobject javaObject = jsValueToJavaObject(element);
		env->SetObjectArrayElement(javaArray, i, javaObject);
		env->DeleteLocalRef(javaObject);
	}

	return javaArray;
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jbooleanArray javaBooleanArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}

	int arrayLength = env->GetArrayLength(javaBooleanArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	jboolean *arrayElements = env->GetBooleanArrayElements(javaBooleanArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Boolean::New(arrayElements[i]));
	}

	return jsArray;
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jshortArray javaShortArray)
{
	return javaDoubleArrayToJsNumberArray((jdoubleArray) javaShortArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jintArray javaIntArray)
{
	return javaDoubleArrayToJsNumberArray((jdoubleArray) javaIntArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jlongArray javaLongArray)
{
	return javaDoubleArrayToJsNumberArray((jdoubleArray) javaLongArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jfloatArray javaFloatArray)
{
	return javaDoubleArrayToJsNumberArray((jdoubleArray) javaFloatArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jdoubleArray javaDoubleArray)
{
	return javaDoubleArrayToJsNumberArray((jdoubleArray) javaDoubleArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jobjectArray javaObjectArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}

	int arrayLength = env->GetArrayLength(javaObjectArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	for (int i = 0; i < arrayLength; i++) {
		jobject javaArrayElement = env->GetObjectArrayElement(javaObjectArray, i);
		v8::Handle<v8::Value> jsArrayElement = TypeConverter::javaObjectToJsValue(javaArrayElement);
		jsArray->Set((uint32_t) i, jsArrayElement);
		env->DeleteLocalRef(javaArrayElement);
	}

	return jsArray;
}

// converts js value to java object and recursively converts sub objects if this
// object is a container type
jobject TypeConverter::jsValueToJavaObject(v8::Local<v8::Value> jsValue)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

	if (jsValue->IsNumber()) {
		jdouble javaDouble = TypeConverter::jsNumberToJavaDouble(jsValue->ToNumber());
		return env->NewObject(JNIUtil::doubleClass, JNIUtil::doubleInitMethod, javaDouble);

	} else if (jsValue->IsBoolean()) {
		jboolean javaBoolean = TypeConverter::jsBooleanToJavaBoolean(jsValue->ToBoolean());
		return env->NewObject(JNIUtil::booleanClass, JNIUtil::booleanInitMethod, javaBoolean);

	} else if (jsValue->IsString()) {
		return TypeConverter::jsStringToJavaString(jsValue->ToString());

	} else if (jsValue->IsDate()) {
		jlong javaLong = TypeConverter::jsDateToJavaLong(v8::Handle<v8::Date>::Cast(jsValue));
		return env->NewObject(JNIUtil::longClass, JNIUtil::longInitMethod, javaLong);

	} else if (jsValue->IsArray()) {
		return TypeConverter::jsArrayToJavaArray(v8::Handle<v8::Array>::Cast(jsValue));

	} else if (jsValue->IsFunction()) {
		return TypeConverter::jsObjectToJavaFunction(jsValue->ToObject());

	} else if (jsValue->IsObject()) {
		v8::Handle<v8::Object> jsObject = jsValue->ToObject();

		if (JavaObject::isJavaObject(jsObject)) {
			JavaObject *javaObject = JavaObject::Unwrap<JavaObject>(jsObject);
			return javaObject->getJavaObject();
		} else {
			v8::Handle<v8::Array> objectKeys = jsObject->GetOwnPropertyNames();
			int numKeys = objectKeys->Length();

			jobject javaHashMap = env->NewObject(JNIUtil::hashMapClass, JNIUtil::hashMapInitMethod, numKeys);

			for (int i = 0; i < numKeys; i++) {
				v8::Local<v8::Value> jsObjectPropertyKey = objectKeys->Get((uint32_t) i);
				jobject javaObjectPropertyKey = TypeConverter::jsValueToJavaObject(jsObjectPropertyKey);
				v8::Local<v8::Value> jsObjectPropertyValue = jsObject->Get(jsObjectPropertyKey);
				jobject javaObjectPropertyValue = TypeConverter::jsValueToJavaObject(jsObjectPropertyValue);

				env->CallObjectMethod(javaHashMap, JNIUtil::hashMapPutMethod, javaObjectPropertyKey,
					javaObjectPropertyValue);

				env->DeleteLocalRef(javaObjectPropertyKey);
				env->DeleteLocalRef(javaObjectPropertyValue);
			}

			return javaHashMap;
		}
	}
	return NULL;
}

// converts java object to js value and recursively converts sub objects if this
// object is a container type
v8::Handle<v8::Value> TypeConverter::javaObjectToJsValue(jobject javaObject)
{
	if (javaObject == NULL) {
		return v8::Null();
	}

	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Value>();
	}

	if (env->IsInstanceOf(javaObject, JNIUtil::numberClass)) {
		jdouble javaDouble = env->CallDoubleMethod(javaObject, JNIUtil::numberDoubleValueMethod);
		return v8::Number::New((double) javaDouble);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::stringClass)) {
		return v8::String::New(env->GetStringChars((jstring) javaObject, 0));

	} else if (env->IsInstanceOf(javaObject, JNIUtil::dateClass)) {
		return TypeConverter::javaDateToJsDate(javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::hashMapClass)) {
		v8::Handle<v8::Object> jsObject = v8::Object::New();

		jobject hashMapSet = env->CallObjectMethod(javaObject, JNIUtil::hashMapKeySetMethod);

		jobjectArray hashMapKeys = (jobjectArray) env->CallObjectMethod(hashMapSet, JNIUtil::setToArrayMethod);
		env->DeleteLocalRef(hashMapSet);
		int hashMapKeysLength = env->GetArrayLength(hashMapKeys);

		for (int i = 0; i < hashMapKeysLength; i++) {
			jobject javaPairKey = env->GetObjectArrayElement(hashMapKeys, i);
			v8::Handle<v8::Value> jsPairKey = TypeConverter::javaObjectToJsValue(javaPairKey);

			jobject javaPairValue = env->CallObjectMethod(javaObject, JNIUtil::hashMapGetMethod, javaPairKey);
			env->DeleteLocalRef(javaPairKey);

			jsObject->Set(jsPairKey, TypeConverter::javaObjectToJsValue(javaPairValue));
			env->DeleteLocalRef(javaPairValue);
		}

		env->DeleteLocalRef(hashMapKeys);

		return jsObject;
	} else if (env->IsInstanceOf(javaObject, JNIUtil::managedV8ReferenceClass)) {
		jlong v8ObjectPointer = env->GetLongField(javaObject, JNIUtil::managedV8ReferencePtrField);
		if (v8ObjectPointer != 0) {
			return Persistent<Object>((Object *) v8ObjectPointer);
		} else {
			jclass javaObjectClass = env->GetObjectClass(javaObject);
			v8::Handle<v8::Object> proxyHandle = ProxyFactory::createV8Proxy(javaObjectClass, javaObject);
			env->DeleteLocalRef(javaObjectClass);
			return proxyHandle;
		}
	}

	return v8::Handle<v8::Value>();
}

/****************************** private methods ******************************/

// used mainly by the array conversion methods when converting java numeric types 
// arrays to to the generic js number type 
v8::Handle<v8::Array> TypeConverter::javaDoubleArrayToJsNumberArray(jdoubleArray javaDoubleArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}

	int arrayLength = env->GetArrayLength(javaDoubleArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	jdouble *arrayElements = env->GetDoubleArrayElements(javaDoubleArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Number::New(arrayElements[i]));
	}

	return jsArray;
}


