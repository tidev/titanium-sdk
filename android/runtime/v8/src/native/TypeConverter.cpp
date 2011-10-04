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

	const jchar *nativeString = env->GetStringChars(javaString, NULL);
	int nativeStringLength = env->GetStringLength(javaString);

	v8::Handle<v8::String> jsString = v8::String::New(nativeString, nativeStringLength);
	env->ReleaseStringChars(javaString, nativeString);

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

	jlong pointer = (jlong) *Persistent<Function>::New(Handle<Function>::Cast(jsObject));
	return env->NewObject(JNIUtil::v8CallbackClass, JNIUtil::v8CallbackInitMethod, pointer);
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
		bool isNew;
		jobject javaArg = jsValueToJavaObject(v8Arg, &isNew);
		env->SetObjectArrayElement(javaArgs, i, javaArg);

		if (isNew) {
			env->DeleteLocalRef(javaArg);
		}
	}

	return javaArgs;
}

// call "delete" on the return value otherwise the memory will never be released
v8::Handle<v8::Value> * TypeConverter::javaObjectArrayToJsArguments(jobjectArray javaObjectArray, int *length)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return NULL;
	}

	jsize javaArrayLength = env->GetArrayLength(javaObjectArray);
	v8::Handle<v8::Value> *jsArguments = new v8::Handle<v8::Value>[javaArrayLength];
	for (int i = 0; i < javaArrayLength; i++)
	{
		jobject arrayElement = env->GetObjectArrayElement(javaObjectArray, i);
		jsArguments[i] = TypeConverter::javaObjectToJsValue(arrayElement);
		env->DeleteLocalRef(arrayElement);
	}

	*length = javaArrayLength;
	return jsArguments;
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
		bool isNew;

		jobject javaObject = jsValueToJavaObject(element, &isNew);
		env->SetObjectArrayElement(javaArray, i, javaObject);

		if (isNew) {
			env->DeleteLocalRef(javaObject);
		}
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
jobject TypeConverter::jsValueToJavaObject(v8::Local<v8::Value> jsValue, bool *isNew)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

	if (jsValue->IsNumber()) {
		jdouble javaDouble = TypeConverter::jsNumberToJavaDouble(jsValue->ToNumber());
		*isNew = true;
		return env->NewObject(JNIUtil::doubleClass, JNIUtil::doubleInitMethod, javaDouble);

	} else if (jsValue->IsBoolean()) {
		jboolean javaBoolean = TypeConverter::jsBooleanToJavaBoolean(jsValue->ToBoolean());
		*isNew = true;
		return env->NewObject(JNIUtil::booleanClass, JNIUtil::booleanInitMethod, javaBoolean);

	} else if (jsValue->IsString()) {
		*isNew = true;
		return TypeConverter::jsStringToJavaString(jsValue->ToString());

	} else if (jsValue->IsDate()) {
		jlong javaLong = TypeConverter::jsDateToJavaLong(v8::Handle<v8::Date>::Cast(jsValue));
		*isNew = true;
		return env->NewObject(JNIUtil::longClass, JNIUtil::longInitMethod, javaLong);

	} else if (jsValue->IsArray()) {
		*isNew = true;
		return TypeConverter::jsArrayToJavaArray(v8::Handle<v8::Array>::Cast(jsValue));

	} else if (jsValue->IsFunction()) {
		*isNew = true;
		return TypeConverter::jsObjectToJavaFunction(jsValue->ToObject());

	} else if (jsValue->IsObject()) {
		v8::Handle<v8::Object> jsObject = jsValue->ToObject();

		if (JavaObject::isJavaObject(jsObject)) {
			JavaObject *javaObject = JavaObject::Unwrap<JavaObject>(jsObject);
			*isNew = false;
			return javaObject->getJavaObject();
		} else {
			v8::Handle<v8::Array> objectKeys = jsObject->GetOwnPropertyNames();
			int numKeys = objectKeys->Length();
			*isNew = true;
			jobject javaHashMap = env->NewObject(JNIUtil::hashMapClass, JNIUtil::hashMapInitMethod, numKeys);

			for (int i = 0; i < numKeys; i++) {
				v8::Local<v8::Value> jsObjectPropertyKey = objectKeys->Get((uint32_t) i);
				bool keyIsNew, valueIsNew;
				jobject javaObjectPropertyKey = TypeConverter::jsValueToJavaObject(jsObjectPropertyKey, &keyIsNew);
				v8::Local<v8::Value> jsObjectPropertyValue = jsObject->Get(jsObjectPropertyKey);
				jobject javaObjectPropertyValue = TypeConverter::jsValueToJavaObject(jsObjectPropertyValue, &valueIsNew);

				env->CallObjectMethod(javaHashMap, JNIUtil::hashMapPutMethod, javaObjectPropertyKey,
					javaObjectPropertyValue);

				if (keyIsNew) {
					env->DeleteLocalRef(javaObjectPropertyKey);
				}
				if (valueIsNew) {
					env->DeleteLocalRef(javaObjectPropertyValue);
				}
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
	LOGV(TAG, "javaObjectToJsValue");
	if (!javaObject) {
		LOGV(TAG, "returning null");
		Handle<Value> n = v8::Null();
		LOGV(TAG, "null is empty? %d", n.IsEmpty());
		return n;
	}

	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return v8::Handle<v8::Value>();
	}

	if (env->IsInstanceOf(javaObject, JNIUtil::booleanClass)) {
		LOGV(TAG, "boolean");
		jboolean javaBoolean = env->CallBooleanMethod(javaObject, JNIUtil::booleanBooleanValueMethod);
		return javaBoolean ? v8::True() : v8::False();

	} else if (env->IsInstanceOf(javaObject, JNIUtil::numberClass)) {
		LOGV(TAG, "number");
		jdouble javaDouble = env->CallDoubleMethod(javaObject, JNIUtil::numberDoubleValueMethod);
		return v8::Number::New((double) javaDouble);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::stringClass)) {
		LOGV(TAG, "string");
		return TypeConverter::javaStringToJsString((jstring) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::dateClass)) {
		LOGV(TAG, "date");
		return TypeConverter::javaDateToJsDate(javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::hashMapClass)) {
		LOGV(TAG, "hashmap");
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
		LOGV(TAG, "ManagedV8Reference");
		jlong v8ObjectPointer = env->GetLongField(javaObject, JNIUtil::managedV8ReferencePtrField);
		LOGV(TAG, "ptr = %d", v8ObjectPointer);
		if (v8ObjectPointer != 0) {
			LOGV(TAG, "casting");
			return Persistent<Object>((Object *) v8ObjectPointer);
		} else {
			LOGV(TAG, "get object class");
			jclass javaObjectClass = env->GetObjectClass(javaObject);
			LOGV(TAG, "create v8 proxy");
			v8::Handle<v8::Object> proxyHandle = ProxyFactory::createV8Proxy(javaObjectClass, javaObject);
			LOGV(TAG, "delete local ref");
			env->DeleteLocalRef(javaObjectClass);
			LOGV(TAG, "return proxy handle");
			return proxyHandle;
		}

	} else if (env->IsInstanceOf(javaObject, JNIUtil::objectArrayClass)) {
		LOGV(TAG, "Object[]");
		return javaArrayToJsArray((jobjectArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::shortArrayClass)) {
		return javaArrayToJsArray((jshortArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::intArrayClass)) {
		return javaArrayToJsArray((jintArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::longArrayClass)) {
		return javaArrayToJsArray((jlongArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::floatArrayClass)) {
		return javaArrayToJsArray((jfloatArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::doubleArrayClass)) {
		return javaArrayToJsArray((jdoubleArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::booleanArrayClass)) {
		return javaArrayToJsArray((jbooleanArray) javaObject);
	}

	return v8::Handle<v8::Value>();
}

jobjectArray TypeConverter::jsObjectIndexPropsToJavaArray(v8::Handle<v8::Object> jsObject, int length)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) return NULL;

	HandleScope scope;

	jobjectArray javaArray = env->NewObjectArray(length, JNIUtil::objectClass, NULL);
	int index = 0;

	for (int index = 0; index < length; ++index) {
		v8::Local<Value> prop = jsObject->Get(index);
		bool isNew;

		jobject javaObject = jsValueToJavaObject(prop, &isNew);
		env->SetObjectArrayElement(javaArray, index, javaObject);

		if (isNew) {
			env->DeleteLocalRef(javaObject);
		}
	}

	return javaArray;
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


