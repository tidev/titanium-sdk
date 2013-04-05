/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
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
	return TypeConverter::jsStringToJavaString(env, jsString);
}

jstring TypeConverter::jsStringToJavaString(JNIEnv *env, v8::Handle<v8::String> jsString)
{
	v8::String::Value javaString(jsString);
	return env->NewString(*javaString, javaString.length());
}

jstring TypeConverter::jsValueToJavaString(v8::Handle<v8::Value> jsValue)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}
	return TypeConverter::jsValueToJavaString(env, jsValue);
}

jstring TypeConverter::jsValueToJavaString(JNIEnv *env, v8::Handle<v8::Value> jsValue)
{
	if (jsValue->IsNull()) {
		return NULL;
	}

	v8::Local<v8::String> jsString = jsValue->ToString();
	v8::String::Value javaString(jsString);
	return env->NewString(*javaString, javaString.length());
}

v8::Handle<v8::Value> TypeConverter::javaStringToJsString(jstring javaString)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::String>();
	}
	return TypeConverter::javaStringToJsString(env, javaString);
}

v8::Handle<v8::Value> TypeConverter::javaStringToJsString(JNIEnv *env, jstring javaString)
{
	if (!javaString) {
		return v8::Null();
	}

	int nativeStringLength = env->GetStringLength(javaString);
	const jchar *nativeString = env->GetStringChars(javaString, NULL);
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
	return TypeConverter::jsDateToJavaDate(env, jsDate);
}

jobject TypeConverter::jsDateToJavaDate(JNIEnv *env, v8::Handle<v8::Date> jsDate)
{
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
	return TypeConverter::javaDateToJsDate(env, javaDate);
}

v8::Handle<v8::Date> TypeConverter::javaDateToJsDate(JNIEnv *env, jobject javaDate)
{
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
	return TypeConverter::jsObjectToJavaFunction(env, jsObject);
}

jobject TypeConverter::jsObjectToJavaFunction(JNIEnv *env, v8::Handle<v8::Object> jsObject)
{
	Persistent<Function> jsFunction = Persistent<Function>::New(Handle<Function>::Cast(jsObject));
	jsFunction.MarkIndependent();

	jlong ptr = (jlong) *jsFunction;
	return env->NewObject(JNIUtil::v8FunctionClass, JNIUtil::v8FunctionInitMethod, ptr);
}

v8::Handle<v8::Function> TypeConverter::javaObjectToJsFunction(jobject javaObject)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return v8::Handle<v8::Function>();
	}
	return TypeConverter::javaObjectToJsFunction(env, javaObject);
}

v8::Handle<v8::Function> TypeConverter::javaObjectToJsFunction(JNIEnv *env, jobject javaObject)
{
	jlong v8ObjectPointer = env->GetLongField(javaObject, JNIUtil::v8ObjectPtrField);
	return v8::Handle<v8::Function>(reinterpret_cast<v8::Function*>(v8ObjectPointer));
}

jobjectArray TypeConverter::jsArgumentsToJavaArray(const Arguments& args)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return NULL;
	}
	return TypeConverter::jsArgumentsToJavaArray(env, args);
}

jobjectArray TypeConverter::jsArgumentsToJavaArray(JNIEnv *env, const Arguments& args)
{
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
	return TypeConverter::javaObjectArrayToJsArguments(env, javaObjectArray, length);
}

v8::Handle<v8::Value> * TypeConverter::javaObjectArrayToJsArguments(JNIEnv *env, jobjectArray javaObjectArray, int *length)
{
	jsize javaArrayLength = env->GetArrayLength(javaObjectArray);
	v8::Handle<v8::Value> *jsArguments = new v8::Handle<v8::Value>[javaArrayLength];
	for (int i = 0; i < javaArrayLength; i++)
	{
		jobject arrayElement = env->GetObjectArrayElement(javaObjectArray, i);
		jsArguments[i] = TypeConverter::javaObjectToJsValue(env, arrayElement);
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
	return TypeConverter::jsArrayToJavaArray(env, jsArray);
}

jarray TypeConverter::jsArrayToJavaArray(JNIEnv *env, v8::Handle<v8::Array> jsArray)
{
	int arrayLength = jsArray->Length();
	jobjectArray javaArray = env->NewObjectArray(arrayLength, JNIUtil::objectClass, NULL);
	if (javaArray == NULL) {
		LOGE(TAG, "unable to create new jobjectArray");
		return NULL;
	}

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
	return TypeConverter::javaArrayToJsArray(env, javaBooleanArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(JNIEnv *env, jbooleanArray javaBooleanArray)
{
	int arrayLength = env->GetArrayLength(javaBooleanArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	jboolean *arrayElements = env->GetBooleanArrayElements(javaBooleanArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Boolean::New(arrayElements[i]));
	}

	return jsArray;
}

jshortArray TypeConverter::jsArrayToJavaShortArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}
	return TypeConverter::jsArrayToJavaShortArray(env, jsArray);
}

jshortArray TypeConverter::jsArrayToJavaShortArray(JNIEnv *env, v8::Handle<v8::Array> jsArray)
{
	int arrayLength = jsArray->Length();
	jshortArray javaShortArray = env->NewShortArray(arrayLength);
	if (javaShortArray == NULL) {
		LOGE(TAG, "unable to create new jshortArray");
		return NULL;
	}

	jshort* shortBuffer = new jshort[arrayLength];
	for (int i = 0; i < arrayLength; i++) {
		v8::Local<v8::Value> element = jsArray->Get(i);
		shortBuffer[i] = TypeConverter::jsNumberToJavaShort(element->ToNumber());
	}
	env->SetShortArrayRegion(javaShortArray, 0, arrayLength, shortBuffer);

	return javaShortArray;
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jshortArray javaShortArray)
{
	return javaDoubleArrayToJsNumberArray((jdoubleArray) javaShortArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(JNIEnv *env, jshortArray javaShortArray)
{
	return javaDoubleArrayToJsNumberArray(env, (jdoubleArray) javaShortArray);
}


jintArray TypeConverter::jsArrayToJavaIntArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}
	return TypeConverter::jsArrayToJavaIntArray(env, jsArray);
}

jintArray TypeConverter::jsArrayToJavaIntArray(JNIEnv *env, v8::Handle<v8::Array> jsArray)
{
	int arrayLength = jsArray->Length();
	jintArray javaIntArray = env->NewIntArray(arrayLength);
	if (javaIntArray == NULL) {
		LOGE(TAG, "unable to create new jintArray");
		return NULL;
	}

	jint* intBuffer = new jint[arrayLength];
	for (int i = 0; i < arrayLength; i++) {
		v8::Local<v8::Value> element = jsArray->Get(i);
		intBuffer[i] = TypeConverter::jsNumberToJavaInt(element->ToNumber());
	}
	env->SetIntArrayRegion(javaIntArray, 0, arrayLength, intBuffer);

	return javaIntArray;
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jintArray javaIntArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}
	return TypeConverter::javaArrayToJsArray(env, javaIntArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(JNIEnv *env, jintArray javaIntArray)
{
	int arrayLength = env->GetArrayLength(javaIntArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	jint *arrayElements = env->GetIntArrayElements(javaIntArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Integer::New(arrayElements[i]));
	}

	return jsArray;
}

jlongArray TypeConverter::jsArrayToJavaLongArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}
	return TypeConverter::jsArrayToJavaLongArray(env, jsArray);
}

jlongArray TypeConverter::jsArrayToJavaLongArray(JNIEnv *env, v8::Handle<v8::Array> jsArray)
{
	int arrayLength = jsArray->Length();
	jlongArray javaLongArray = env->NewLongArray(arrayLength);
	if (javaLongArray == NULL) {
		LOGE(TAG, "unable to create new jlongArray");
		return NULL;
	}

	jlong* longBuffer = new jlong[arrayLength];
	for (int i = 0; i < arrayLength; i++) {
		v8::Local<v8::Value> element = jsArray->Get(i);
		longBuffer[i] = TypeConverter::jsNumberToJavaLong(element->ToNumber());
	}
	env->SetLongArrayRegion(javaLongArray, 0, arrayLength, longBuffer);

	return javaLongArray;
}

jfloatArray TypeConverter::jsArrayToJavaFloatArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}
    return TypeConverter::jsArrayToJavaFloatArray(env, jsArray);
}
  
jfloatArray TypeConverter::jsArrayToJavaFloatArray(JNIEnv *env, v8::Handle<v8::Array> jsArray)
{
	int arrayLength = jsArray->Length();
	jfloatArray javaFloatArray = env->NewFloatArray(arrayLength);
	if (javaFloatArray == NULL) {
		LOGE(TAG, "unable to create new jfloatArray");
		return NULL;
	}
    
	jfloat* floatBuffer = new jfloat[arrayLength];
	for (int i = 0; i < arrayLength; i++) {
		v8::Local<v8::Value> element = jsArray->Get(i);
		floatBuffer[i] = TypeConverter::jsNumberToJavaFloat(element->ToNumber());
	}
	env->SetFloatArrayRegion(javaFloatArray, 0, arrayLength, floatBuffer);
    
	return javaFloatArray;
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jlongArray javaLongArray)
{
	return javaLongArrayToJsNumberArray(javaLongArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(JNIEnv *env, jlongArray javaLongArray)
{
	return javaLongArrayToJsNumberArray(env, javaLongArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jfloatArray javaFloatArray)
{
	return javaFloatArrayToJsNumberArray(javaFloatArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(JNIEnv *env, jfloatArray javaFloatArray)
{
	return javaFloatArrayToJsNumberArray(env, javaFloatArray);
}

jdoubleArray TypeConverter::jsArrayToJavaDoubleArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}
	return TypeConverter::jsArrayToJavaDoubleArray(env,jsArray);
}

jdoubleArray TypeConverter::jsArrayToJavaDoubleArray(JNIEnv *env, v8::Handle<v8::Array> jsArray)
{
	int arrayLength = jsArray->Length();
	jdoubleArray javaDoubleArray = env->NewDoubleArray(arrayLength);
	if (javaDoubleArray == NULL) {
		LOGE(TAG, "unable to create new jdoubleArray");
		return NULL;
	}

	jdouble* doubleBuffer = new jdouble[arrayLength];
	for (int i = 0; i < arrayLength; i++) {
		v8::Local<v8::Value> element = jsArray->Get(i);
		doubleBuffer[i] = TypeConverter::jsNumberToJavaDouble(element->ToNumber());
	}
	env->SetDoubleArrayRegion(javaDoubleArray, 0, arrayLength, doubleBuffer);

	return javaDoubleArray;
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jdoubleArray javaDoubleArray)
{
	return javaDoubleArrayToJsNumberArray(javaDoubleArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(JNIEnv *env, jdoubleArray javaDoubleArray)
{
	return javaDoubleArrayToJsNumberArray(env, javaDoubleArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jobjectArray javaObjectArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}
	return TypeConverter::javaArrayToJsArray(env, javaObjectArray);
}

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(JNIEnv *env, jobjectArray javaObjectArray)
{
	int arrayLength = env->GetArrayLength(javaObjectArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	for (int i = 0; i < arrayLength; i++) {
		jobject javaArrayElement = env->GetObjectArrayElement(javaObjectArray, i);
		v8::Handle<v8::Value> jsArrayElement = TypeConverter::javaObjectToJsValue(env, javaArrayElement);
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
	return TypeConverter::jsValueToJavaObject(env,jsValue,isNew);
}

jobject TypeConverter::jsValueToJavaObject(JNIEnv *env, v8::Local<v8::Value> jsValue, bool *isNew)
{
	if (jsValue->IsNumber()) {
		*isNew = true;
		if (jsValue->IsInt32()) {
			jint javaInt = TypeConverter::jsNumberToJavaInt(jsValue->ToNumber());
			return env->NewObject(JNIUtil::integerClass, JNIUtil::integerInitMethod, javaInt);
		}
		jdouble javaDouble = TypeConverter::jsNumberToJavaDouble(jsValue->ToNumber());
		return env->NewObject(JNIUtil::doubleClass, JNIUtil::doubleInitMethod, javaDouble);

	} else if (jsValue->IsBoolean()) {
		jboolean javaBoolean = TypeConverter::jsBooleanToJavaBoolean(jsValue->ToBoolean());
		*isNew = true;
		return env->NewObject(JNIUtil::booleanClass, JNIUtil::booleanInitMethod, javaBoolean);

	} else if (jsValue->IsString()) {
		*isNew = true;
		return TypeConverter::jsStringToJavaString(env, jsValue->ToString());

	} else if (jsValue->IsDate()) {
		Local<Date> date = Local<Date>::Cast<Value>(jsValue);
		return TypeConverter::jsDateToJavaDate(env, date);

	} else if (jsValue->IsArray()) {
		*isNew = true;
		return TypeConverter::jsArrayToJavaArray(env, v8::Handle<v8::Array>::Cast(jsValue));

	} else if (jsValue->IsFunction()) {
		*isNew = true;
		return TypeConverter::jsObjectToJavaFunction(env, jsValue->ToObject());

	} else if (jsValue->IsObject()) {
		v8::Handle<v8::Object> jsObject = jsValue->ToObject();

		if (JavaObject::isJavaObject(jsObject)) {
			*isNew = JavaObject::useGlobalRefs ? false : true;
			JavaObject *javaObject = JavaObject::Unwrap<JavaObject>(jsObject);
			return javaObject->getJavaObject();
		} else {
			v8::Handle<v8::Array> objectKeys = jsObject->GetOwnPropertyNames();
			int numKeys = objectKeys->Length();
			*isNew = true;
			jobject javaHashMap = env->NewObject(JNIUtil::hashMapClass, JNIUtil::hashMapInitMethod, numKeys);

			for (int i = 0; i < numKeys; i++) {
				v8::Local<v8::Value> jsObjectPropertyKey = objectKeys->Get((uint32_t) i);
				bool keyIsNew, valueIsNew;
				jobject javaObjectPropertyKey = TypeConverter::jsValueToJavaObject(env, jsObjectPropertyKey, &keyIsNew);
				v8::Local<v8::Value> jsObjectPropertyValue = jsObject->Get(jsObjectPropertyKey);
				jobject javaObjectPropertyValue = TypeConverter::jsValueToJavaObject(env, jsObjectPropertyValue, &valueIsNew);

				jobject result = env->CallObjectMethod(javaHashMap,
				                                       JNIUtil::hashMapPutMethod,
				                                       javaObjectPropertyKey,
				                                       javaObjectPropertyValue);
				env->DeleteLocalRef(result);

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

	if (!jsValue->IsNull() && !jsValue->IsUndefined()) {
		LOGW(TAG, "jsValueToJavaObject returning null.");
	}
	return NULL;
}

// converts js value to java error
jobject TypeConverter::jsValueToJavaError(v8::Local<v8::Value> jsValue, bool* isNew)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}
	return TypeConverter::jsValueToJavaError(env,jsValue,isNew);
}

jobject TypeConverter::jsValueToJavaError(JNIEnv *env, v8::Local<v8::Value> jsValue, bool* isNew)
{
	if (jsValue->IsObject()) {
		v8::Handle<v8::Object> jsObject = jsValue->ToObject();

		// If it's a java object, we just return null for now.
		if (!JavaObject::isJavaObject(jsObject)) {

			Handle<String> stackString = String::New("stack"), messageString = String::New("message");
			if (jsObject->HasOwnProperty(stackString) || jsObject->HasOwnProperty(messageString)) {
				bool keyIsNew, valueIsNew;
				*isNew = true;
				v8::Local<v8::Value> jsObjectMessageProperty = jsObject->GetRealNamedProperty(messageString);
				v8::Local<v8::Value> jsObjectStackProperty = jsObject->GetRealNamedProperty(stackString);

				return env->NewObject(JNIUtil::krollExceptionClass, JNIUtil::krollExceptionInitMethod,
							TypeConverter::jsValueToJavaString(env, jsObjectMessageProperty), TypeConverter::jsValueToJavaString(env, jsObjectStackProperty));
			}
		}

	} else  {
		*isNew = true;
		return env->NewObject(JNIUtil::krollExceptionClass, JNIUtil::krollExceptionInitMethod,
			TypeConverter::jsValueToJavaString(env, jsValue), NULL);
	} 

	if (!jsValue->IsNull() && !jsValue->IsUndefined()) {
		LOGW(TAG, "jsValueToJavaObject returning null.");
	}
	return NULL;
}

// converts java hashmap to js value and recursively converts sub objects if this
// object is a container type. If javaObject is NULL, an empty object is created.
v8::Handle<v8::Object> TypeConverter::javaHashMapToJsValue(JNIEnv *env, jobject javaObject)
{
	v8::Handle<v8::Object> jsObject = v8::Object::New();
	if (!javaObject || !env) {
		return jsObject;
	}

	jobject hashMapSet = env->CallObjectMethod(javaObject, JNIUtil::hashMapKeySetMethod);
	jobjectArray hashMapKeys = (jobjectArray) env->CallObjectMethod(hashMapSet, JNIUtil::setToArrayMethod);
	env->DeleteLocalRef(hashMapSet);

	int hashMapKeysLength = env->GetArrayLength(hashMapKeys);
	bool isStringHashMap = env->IsInstanceOf(hashMapKeys, JNIUtil::stringArrayClass);

	for (int i = 0; i < hashMapKeysLength; i++) {
		jobject javaPairKey = env->GetObjectArrayElement(hashMapKeys, i);
		v8::Handle<v8::Value> jsPairKey;
		if (isStringHashMap) {
			jstring javaString = (jstring)javaPairKey;
			int nativeStringLength = env->GetStringLength(javaString);
			const jchar *nativeString = env->GetStringChars(javaString, NULL);
			jsPairKey = v8::String::New(nativeString, nativeStringLength);
			env->ReleaseStringChars(javaString, nativeString);
		} else {
			jsPairKey = TypeConverter::javaObjectToJsValue(env, javaPairKey);
		}

		jobject javaPairValue = env->CallObjectMethod(javaObject, JNIUtil::hashMapGetMethod, javaPairKey);
		env->DeleteLocalRef(javaPairKey);

		jsObject->Set(jsPairKey, TypeConverter::javaObjectToJsValue(env, javaPairValue));
		env->DeleteLocalRef(javaPairValue);
	}

	env->DeleteLocalRef(hashMapKeys);

	return jsObject;
}

// converts java object to js value and recursively converts sub objects if this
// object is a container type
v8::Handle<v8::Value> TypeConverter::javaObjectToJsValue(jobject javaObject)
{
	if (!javaObject) {
		return v8::Null();
	}

	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return v8::Handle<v8::Value>();
	}
	return TypeConverter::javaObjectToJsValue(env,javaObject);
}

v8::Handle<v8::Value> TypeConverter::javaObjectToJsValue(JNIEnv *env, jobject javaObject)
{
	if (!javaObject) {
		return v8::Null();
	}

	if (env->IsInstanceOf(javaObject, JNIUtil::booleanClass)) {
		jboolean javaBoolean = env->CallBooleanMethod(javaObject, JNIUtil::booleanBooleanValueMethod);
		return javaBoolean ? v8::True() : v8::False();

	} else if (env->IsInstanceOf(javaObject, JNIUtil::numberClass)) {
		jdouble javaDouble = env->CallDoubleMethod(javaObject, JNIUtil::numberDoubleValueMethod);
		return v8::Number::New((double) javaDouble);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::stringClass)) {
		return TypeConverter::javaStringToJsString(env, (jstring) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::dateClass)) {
		return TypeConverter::javaDateToJsDate(env, javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::hashMapClass)) {
		return TypeConverter::javaHashMapToJsValue(env, javaObject);
	} else if (env->IsInstanceOf(javaObject, JNIUtil::krollProxyClass)) {
		jobject krollObject = env->GetObjectField(javaObject, JNIUtil::krollProxyKrollObjectField);
		if (krollObject) {
			jlong v8ObjectPointer = env->GetLongField(krollObject, JNIUtil::v8ObjectPtrField);
			env->DeleteLocalRef(krollObject);

			if (v8ObjectPointer != 0) {
				Persistent<Object> v8Object = Persistent<Object>((Object *) v8ObjectPointer);
				JavaObject *jo = NativeObject::Unwrap<JavaObject>(v8Object);
				jo->getJavaObject();
				return v8Object;
			}
		}

		jclass javaObjectClass = env->GetObjectClass(javaObject);
		v8::Handle<v8::Object> proxyHandle = ProxyFactory::createV8Proxy(javaObjectClass, javaObject);
		env->DeleteLocalRef(javaObjectClass);
		return proxyHandle;

	} else if (env->IsInstanceOf(javaObject, JNIUtil::v8FunctionClass)) {
		return javaObjectToJsFunction(javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::objectArrayClass)) {
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

	} else if (env->IsSameObject(JNIUtil::undefinedObject, javaObject)) {
		return v8::Undefined();
	}

	JNIUtil::logClassName("!!! Unable to convert unknown Java object class '%s' to Js value !!!",
	                      env->GetObjectClass(javaObject),
	                      true);
	return v8::Handle<v8::Value>();
}

jobjectArray TypeConverter::jsObjectIndexPropsToJavaArray(v8::Handle<v8::Object> jsObject, int start, int length)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return NULL;
	}
	return TypeConverter::jsObjectIndexPropsToJavaArray(env, jsObject, start, length);
}

jobjectArray TypeConverter::jsObjectIndexPropsToJavaArray(JNIEnv *env, v8::Handle<v8::Object> jsObject, int start, int length)
{
	HandleScope scope;

	int arrayLength = length == 0 ? 0 : length - start;
	jobjectArray javaArray = env->NewObjectArray(arrayLength, JNIUtil::objectClass, NULL);
	int index = 0;

	for (int index = start; index < length; ++index) {
		v8::Local<Value> prop = jsObject->Get(index);
		bool isNew;

		jobject javaObject = jsValueToJavaObject(prop, &isNew);
		env->SetObjectArrayElement(javaArray, index - start, javaObject);

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
	return TypeConverter::javaDoubleArrayToJsNumberArray(env, javaDoubleArray);
}

v8::Handle<v8::Array> TypeConverter::javaDoubleArrayToJsNumberArray(JNIEnv *env, jdoubleArray javaDoubleArray)
{
	int arrayLength = env->GetArrayLength(javaDoubleArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	jdouble *arrayElements = env->GetDoubleArrayElements(javaDoubleArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Number::New(arrayElements[i]));
	}
	env->ReleaseDoubleArrayElements(javaDoubleArray, arrayElements, JNI_ABORT);
	//Since we were only reading, there is no need to copy back. Thus, Abort.
	return jsArray;
}

v8::Handle<v8::Array> TypeConverter::javaLongArrayToJsNumberArray(jlongArray javaLongArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}
	return TypeConverter::javaLongArrayToJsNumberArray(env, javaLongArray);
}

v8::Handle<v8::Array> TypeConverter::javaLongArrayToJsNumberArray(JNIEnv *env, jlongArray javaLongArray)
{    
	int arrayLength = env->GetArrayLength(javaLongArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);
    
	jlong *arrayElements = env->GetLongArrayElements(javaLongArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Number::New(arrayElements[i]));
	}
	return jsArray;
}

v8::Handle<v8::Array> TypeConverter::javaFloatArrayToJsNumberArray(jfloatArray javaFloatArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}
	return TypeConverter::javaFloatArrayToJsNumberArray(env, javaFloatArray);
}

v8::Handle<v8::Array> TypeConverter::javaFloatArrayToJsNumberArray(JNIEnv *env, jfloatArray javaFloatArray)
{
	int arrayLength = env->GetArrayLength(javaFloatArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);
    
	jfloat *arrayElements = env->GetFloatArrayElements(javaFloatArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Number::New(arrayElements[i]));
	}
	return jsArray;
}


