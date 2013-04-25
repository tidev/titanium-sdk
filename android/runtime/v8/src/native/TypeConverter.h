/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TYPE_CONVERTER_H
#define TYPE_CONVERTER_H

#include <jni.h>
#include <v8.h>

namespace titanium {
class TypeConverter
{
public:
	// short convert methods
	static jshort jsNumberToJavaShort(v8::Handle<v8::Number> jsNumber);
	static v8::Handle<v8::Number> javaShortToJsNumber(jshort javaShort);
	
	static inline jshort jsNumberToJavaShort(JNIEnv *env, v8::Handle<v8::Number> jsNumber) {
		return jsNumberToJavaShort(jsNumber);
	}
	static inline v8::Handle<v8::Number> javaShortToJsNumber(JNIEnv *env, jshort javaShort) {
		return javaShortToJsNumber(javaShort);
	}

	// int convert methods
	static jint jsNumberToJavaInt(v8::Handle<v8::Number> jsNumber);
	static v8::Handle<v8::Number> javaIntToJsNumber(jint javaInt);

	static inline jint jsNumberToJavaInt(JNIEnv *env, v8::Handle<v8::Number> jsNumber) {
		return jsNumberToJavaInt(jsNumber);
	}
	static inline v8::Handle<v8::Number> javaIntToJsNumber(JNIEnv *env, jint javaInt) {
		return javaIntToJsNumber(javaInt);
	}

	// long convert methods
	static jlong jsNumberToJavaLong(v8::Handle<v8::Number> jsNumber);
	static v8::Handle<v8::Number> javaLongToJsNumber(jlong javaLong);

	static inline jlong jsNumberToJavaLong(JNIEnv *env, v8::Handle<v8::Number> jsNumber) {
		return jsNumberToJavaLong(jsNumber);
	}
	static inline v8::Handle<v8::Number> javaLongToJsNumber(JNIEnv *env, jlong javaLong) {
		return javaLongToJsNumber(javaLong);
	}

	// float convert methods
	static jfloat jsNumberToJavaFloat(v8::Handle<v8::Number> jsNumber);
	static v8::Handle<v8::Number> javaFloatToJsNumber(jfloat javaFloat);

	static inline jfloat jsNumberToJavaFloat(JNIEnv *env, v8::Handle<v8::Number> jsNumber) {
		return jsNumberToJavaFloat(jsNumber);
	}
	static inline v8::Handle<v8::Number> javaFloatToJsNumber(JNIEnv *env, jfloat javaFloat) {
		return javaFloatToJsNumber(javaFloat);
	}

	// double convert methods
	static jdouble jsNumberToJavaDouble(v8::Handle<v8::Number> jsNumber);
	static v8::Handle<v8::Number> javaDoubleToJsNumber(jdouble javaDouble);

	static inline jdouble jsNumberToJavaDouble(JNIEnv *env, v8::Handle<v8::Number> jsNumber) {
		return jsNumberToJavaDouble(jsNumber);
	}
	static inline v8::Handle<v8::Number> javaDoubleToJsNumber(JNIEnv *env, jdouble javaDouble) {
		return javaDoubleToJsNumber(javaDouble);
	}

	// boolean convert methods
	static jboolean jsBooleanToJavaBoolean(v8::Handle<v8::Boolean> jsBoolean);
	static v8::Handle<v8::Boolean> javaBooleanToJsBoolean(jboolean javaBoolean);

	static inline jboolean jsBooleanToJavaBoolean(JNIEnv *env, v8::Handle<v8::Boolean> jsBoolean) {
		return jsBooleanToJavaBoolean(jsBoolean);
	}
	static inline v8::Handle<v8::Boolean> javaBooleanToJsBoolean(JNIEnv *env, jboolean javaBoolean) {
		return javaBooleanToJsBoolean(javaBoolean);
	}

	// string convert methods
	static jstring jsStringToJavaString(v8::Handle<v8::String> jsString);
	static jstring jsValueToJavaString(v8::Handle<v8::Value> jsValue);
	static v8::Handle<v8::Value> javaStringToJsString(jstring javaString);

	static jstring jsStringToJavaString(JNIEnv *env, v8::Handle<v8::String> jsString);
	static jstring jsValueToJavaString(JNIEnv *env, v8::Handle<v8::Value> jsValue);
	static v8::Handle<v8::Value> javaStringToJsString(JNIEnv *env, jstring javaString);

	// date convert methods
	static jobject jsDateToJavaDate(v8::Handle<v8::Date> jsDate);
	static jlong jsDateToJavaLong(v8::Handle<v8::Date> jsDate);
	static v8::Handle<v8::Date> javaDateToJsDate(jobject);
	static v8::Handle<v8::Date> javaLongToJsDate(jlong);

	static jobject jsDateToJavaDate(JNIEnv *env, v8::Handle<v8::Date> jsDate);
	static v8::Handle<v8::Date> javaDateToJsDate(JNIEnv *env, jobject);
	static inline jlong jsDateToJavaLong(JNIEnv *env, v8::Handle<v8::Date> jsDate) {
		return jsDateToJavaLong(jsDate);
	}
	static inline v8::Handle<v8::Date> javaLongToJsDate(JNIEnv *env, jlong javaLong) {
		return javaLongToJsDate(javaLong);
	}

	// function convert methods
	static jobject jsObjectToJavaFunction(v8::Handle<v8::Object> jsObject);
	static v8::Handle<v8::Function> javaObjectToJsFunction(jobject javaObject);

	static jobject jsObjectToJavaFunction(JNIEnv *env, v8::Handle<v8::Object> jsObject);
	static v8::Handle<v8::Function> javaObjectToJsFunction(JNIEnv *env, jobject javaObject);

	// arguments conversion
	static jobjectArray jsArgumentsToJavaArray(const v8::Arguments& args);

	// BIG FUCKING WARNING!!  make sure you call "delete" on the return value otherwise the
	// you have introduced a memory leak and the world will end.  plzkthksbye
	static v8::Handle<v8::Value> * javaObjectArrayToJsArguments(jobjectArray javaObjectArray, int *length);

	static jobjectArray jsArgumentsToJavaArray(JNIEnv *env, const v8::Arguments& args);
	static v8::Handle<v8::Value> * javaObjectArrayToJsArguments(JNIEnv *env, jobjectArray javaObjectArray, int *length);


	// array convert methods
	static jarray jsArrayToJavaArray(v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(jbooleanArray javaBooleanArray);
	static jshortArray jsArrayToJavaShortArray(v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(jshortArray javaShortArray);
	static jintArray jsArrayToJavaIntArray(v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(jintArray javaIntArray);
	static jlongArray jsArrayToJavaLongArray(v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(jlongArray javaLongArray);
	static jfloatArray jsArrayToJavaFloatArray(v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(jfloatArray javaFloatArray);
	static jdoubleArray jsArrayToJavaDoubleArray(v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(jdoubleArray javaDoubleArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(jobjectArray javaObjectArray);

	static jarray jsArrayToJavaArray(JNIEnv *env, v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(JNIEnv *env, jbooleanArray javaBooleanArray);
	static jshortArray jsArrayToJavaShortArray(JNIEnv *env, v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(JNIEnv *env, jshortArray javaShortArray);
	static jintArray jsArrayToJavaIntArray(JNIEnv *env, v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(JNIEnv *env, jintArray javaIntArray);
	static jlongArray jsArrayToJavaLongArray(JNIEnv *env, v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(JNIEnv *env, jlongArray javaLongArray);
	static jfloatArray jsArrayToJavaFloatArray(JNIEnv *env, v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(JNIEnv *env, jfloatArray javaFloatArray);
	static jdoubleArray jsArrayToJavaDoubleArray(JNIEnv *env, v8::Handle<v8::Array> jsArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(JNIEnv *env, jdoubleArray javaDoubleArray);
	static v8::Handle<v8::Array> javaArrayToJsArray(JNIEnv *env, jobjectArray javaObjectArray);

	// object convert methods
	static inline jobject jsValueToJavaObject(v8::Local<v8::Value> jsValue) {
		bool isNew;
		return jsValueToJavaObject(jsValue, &isNew);
	}

	static inline jobject jsValueToJavaObject(JNIEnv *env, v8::Local<v8::Value> jsValue) {
		bool isNew;
		return jsValueToJavaObject(env, jsValue, &isNew);
	}
	
	static jobject jsValueToJavaError(v8::Local<v8::Value> jsValue, bool *isNew);
	static jobject jsValueToJavaObject(v8::Local<v8::Value> jsValue, bool *isNew);
	static v8::Handle<v8::Value> javaObjectToJsValue(jobject javaObject);

	static jobject jsValueToJavaError(JNIEnv *env, v8::Local<v8::Value> jsValue, bool *isNew);
	static jobject jsValueToJavaObject(JNIEnv *env, v8::Local<v8::Value> jsValue, bool *isNew);
	static v8::Handle<v8::Object> javaHashMapToJsValue(JNIEnv *env, jobject javaObject);
	static v8::Handle<v8::Value> javaObjectToJsValue(JNIEnv *env, jobject javaObject);

	// Convert a JS object's indexed properties to a Java object array.
	// Starts at index zero and continues until length is reached.
	static jobjectArray jsObjectIndexPropsToJavaArray(v8::Handle<v8::Object> jsObject, int start, int length);

	static jobjectArray jsObjectIndexPropsToJavaArray(JNIEnv *env, v8::Handle<v8::Object> jsObject, int start, int length);

private:
	// utility methods
	static v8::Handle<v8::Array> javaDoubleArrayToJsNumberArray(jdoubleArray javaDoubleArray);
	static v8::Handle<v8::Array> javaLongArrayToJsNumberArray(jlongArray javaLongArray);
	static v8::Handle<v8::Array> javaFloatArrayToJsNumberArray(jfloatArray javaFloatArray);

	static v8::Handle<v8::Array> javaDoubleArrayToJsNumberArray(JNIEnv *env, jdoubleArray javaDoubleArray);
	static v8::Handle<v8::Array> javaLongArrayToJsNumberArray(JNIEnv *env, jlongArray javaLongArray);
	static v8::Handle<v8::Array> javaFloatArrayToJsNumberArray(JNIEnv *env, jfloatArray javaFloatArray);

};
}

#endif

