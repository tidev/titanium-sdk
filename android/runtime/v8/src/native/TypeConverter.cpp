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

	v8::String::Value javaString(jsString);
	return env->NewString(*javaString, javaString.length());
}

jstring TypeConverter::jsValueToJavaString(v8::Handle<v8::Value> jsValue)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

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

	if (!javaString) {
		return v8::Null();
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

	jlong v8ObjectPointer = env->GetLongField(javaObject, JNIUtil::v8ObjectPtrField);
	return v8::Handle<v8::Function>(reinterpret_cast<v8::Function*>(v8ObjectPointer));
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

jintArray TypeConverter::jsArrayToJavaIntArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

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

v8::Handle<v8::Array> TypeConverter::javaArrayToJsArray(jfloatArray javaFloatArray)
{
	return javaFloatArrayToJsNumberArray(javaFloatArray);
}

jdoubleArray TypeConverter::jsArrayToJavaDoubleArray(v8::Handle<v8::Array> jsArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return NULL;
	}

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
		return TypeConverter::jsStringToJavaString(jsValue->ToString());

	} else if (jsValue->IsDate()) {
		Local<Date> date = Local<Date>::Cast<Value>(jsValue);
		return TypeConverter::jsDateToJavaDate(date);

	} else if (jsValue->IsArray()) {
		*isNew = true;
		return TypeConverter::jsArrayToJavaArray(v8::Handle<v8::Array>::Cast(jsValue));

	} else if (jsValue->IsFunction()) {
		*isNew = true;
		return TypeConverter::jsObjectToJavaFunction(jsValue->ToObject());

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
				jobject javaObjectPropertyKey = TypeConverter::jsValueToJavaObject(jsObjectPropertyKey, &keyIsNew);
				v8::Local<v8::Value> jsObjectPropertyValue = jsObject->Get(jsObjectPropertyKey);
				jobject javaObjectPropertyValue = TypeConverter::jsValueToJavaObject(jsObjectPropertyValue, &valueIsNew);

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

	if (env->IsInstanceOf(javaObject, JNIUtil::booleanClass)) {
		jboolean javaBoolean = env->CallBooleanMethod(javaObject, JNIUtil::booleanBooleanValueMethod);
		return javaBoolean ? v8::True() : v8::False();

	} else if (env->IsInstanceOf(javaObject, JNIUtil::numberClass)) {
		jdouble javaDouble = env->CallDoubleMethod(javaObject, JNIUtil::numberDoubleValueMethod);
		return v8::Number::New((double) javaDouble);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::stringClass)) {
		return TypeConverter::javaStringToJsString((jstring) javaObject);

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
	} else if (env->IsInstanceOf(javaObject, JNIUtil::krollProxyClass)) {
		jobject krollObject = env->GetObjectField(javaObject, JNIUtil::krollProxyKrollObjectField);
		if (krollObject) {
			jlong v8ObjectPointer = env->GetLongField(krollObject, JNIUtil::v8ObjectPtrField);
			env->DeleteLocalRef(krollObject);

			if (v8ObjectPointer != 0) {
				Persistent<Object> v8Object = Persistent<Object>((Object *) v8ObjectPointer);
				JavaObject *jo = NativeObject::Unwrap<JavaObject>(v8Object);
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

	int arrayLength = env->GetArrayLength(javaDoubleArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);

	jdouble *arrayElements = env->GetDoubleArrayElements(javaDoubleArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Number::New(arrayElements[i]));
	}
	return jsArray;
}

v8::Handle<v8::Array> TypeConverter::javaLongArrayToJsNumberArray(jlongArray javaLongArray)
{
	JNIEnv *env = JNIScope::getEnv();
	if (env == NULL) {
		return v8::Handle<v8::Array>();
	}
    
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
    
	int arrayLength = env->GetArrayLength(javaFloatArray);
	v8::Handle<v8::Array> jsArray = v8::Array::New(arrayLength);
    
	jfloat *arrayElements = env->GetFloatArrayElements(javaFloatArray, 0);
	for (int i = 0; i < arrayLength; i++) {
		jsArray->Set((uint32_t) i, v8::Number::New(arrayElements[i]));
	}
	return jsArray;
}


