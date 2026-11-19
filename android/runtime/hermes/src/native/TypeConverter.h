/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef TYPE_CONVERTER_H
#define TYPE_CONVERTER_H

#include <jni.h>
#include <vector>

#include <jsi/jsi.h>

#define MAX_STACK 10

namespace titanium {

using namespace facebook;

// Converts values between JS and Java. The function names match the V8 runtime where the job
// is the same. JS values are passed as jsi::Value, because JSI has no handle type per JS type.
// A function that returns a jobject returns a new local reference unless "isNew" says otherwise.
class TypeConverter
{
public:
	// --- Numbers and booleans. The caller makes sure that the value has the right type. ---
	static jshort jsNumberToJavaShort(jsi::Runtime& rt, const jsi::Value& jsNumber);
	static jint jsNumberToJavaInt(jsi::Runtime& rt, const jsi::Value& jsNumber);
	static jlong jsNumberToJavaLong(jsi::Runtime& rt, const jsi::Value& jsNumber);
	static jfloat jsNumberToJavaFloat(jsi::Runtime& rt, const jsi::Value& jsNumber);
	static jdouble jsNumberToJavaDouble(jsi::Runtime& rt, const jsi::Value& jsNumber);
	static jboolean jsBooleanToJavaBoolean(jsi::Runtime& rt, const jsi::Value& jsBoolean);

	static jsi::Value javaShortToJsNumber(jsi::Runtime& rt, JNIEnv* env, jshort value);
	static jsi::Value javaIntToJsNumber(jsi::Runtime& rt, JNIEnv* env, jint value);
	static jsi::Value javaLongToJsNumber(jsi::Runtime& rt, JNIEnv* env, jlong value);
	static jsi::Value javaFloatToJsNumber(jsi::Runtime& rt, JNIEnv* env, jfloat value);
	static jsi::Value javaDoubleToJsNumber(jsi::Runtime& rt, JNIEnv* env, jdouble value);
	static jsi::Value javaBooleanToJsBoolean(jsi::Runtime& rt, JNIEnv* env, jboolean value);

	// --- Strings ---
	static jstring jsStringToJavaString(jsi::Runtime& rt, JNIEnv* env, const jsi::String& jsString);
	// Returns NULL for null and undefined. Converts every other value with String(value).
	static jstring jsValueToJavaString(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue);
	// Returns null for a NULL string.
	static jsi::Value javaStringToJsString(jsi::Runtime& rt, JNIEnv* env, jstring javaString);
	// Reads the bytes as UTF-8. Returns null for a NULL array.
	static jsi::Value javaBytesToJsString(jsi::Runtime& rt, JNIEnv* env, jbyteArray javaBytes);

	// --- Dates ---
	static bool isDate(jsi::Runtime& rt, const jsi::Value& jsValue);
	static jobject jsDateToJavaDate(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsDate);
	static jlong jsDateToJavaLong(jsi::Runtime& rt, const jsi::Value& jsDate);
	static jsi::Value javaDateToJsDate(jsi::Runtime& rt, JNIEnv* env, jobject javaDate);
	static jsi::Value javaLongToJsDate(jsi::Runtime& rt, JNIEnv* env, jlong epochTime);

	// --- Functions and promises. Java gets an id for a handle that the runtime keeps. ---
	static jobject jsObjectToJavaFunction(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsFunction);
	static jsi::Value javaObjectToJsFunction(jsi::Runtime& rt, JNIEnv* env, jobject javaObject);
	static jobject jsObjectToJavaPromise(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsPromise);
	static jsi::Value javaObjectToJsPromise(jsi::Runtime& rt, JNIEnv* env, jobject javaObject);

	// --- Arrays ---
	static jobjectArray jsArgumentsToJavaArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value* args, size_t count,
		size_t start = 0);
	static std::vector<jsi::Value> javaObjectArrayToJsArguments(jsi::Runtime& rt, JNIEnv* env,
		jobjectArray javaObjectArray);

	static jarray jsArrayToJavaArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray);
	static jobjectArray jsArrayToJavaStringArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray);
	static jshortArray jsArrayToJavaShortArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray);
	static jintArray jsArrayToJavaIntArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray);
	static jlongArray jsArrayToJavaLongArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray);
	static jfloatArray jsArrayToJavaFloatArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray);
	static jdoubleArray jsArrayToJavaDoubleArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray);
	static jbyteArray jsArrayBufferToJavaByteArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArrayBuffer);

	static jsi::Value javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jbooleanArray javaArray);
	static jsi::Value javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jshortArray javaArray);
	static jsi::Value javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jintArray javaArray);
	static jsi::Value javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jlongArray javaArray);
	static jsi::Value javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jfloatArray javaArray);
	static jsi::Value javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jdoubleArray javaArray);
	static jsi::Value javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jobjectArray javaArray);
	static jsi::Value javaByteArrayToJsArrayBuffer(jsi::Runtime& rt, JNIEnv* env, jbyteArray javaByteArray);

	// Converts the index properties [start, length) of an object, for example of "arguments".
	static jobjectArray jsObjectIndexPropsToJavaArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Object& jsObject,
		int start, int length);

	// --- Errors ---
	static jsi::Object javaThrowableToJSError(jsi::Runtime& rt, JNIEnv* env, jthrowable javaException);
	static jobject jsValueToJavaError(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue, bool* isNew);

	// --- Generic values ---
	static jobject jsValueToJavaObject(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue, bool* isNew);
	static inline jobject jsValueToJavaObject(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue)
	{
		bool isNew;
		return jsValueToJavaObject(rt, env, jsValue, &isNew);
	}
	static jobject jsObjectToJavaKrollDict(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue, bool* isNew);

	static jsi::Value javaObjectToJsValue(jsi::Runtime& rt, JNIEnv* env, jobject javaObject);
	static jsi::Object javaHashMapToJsValue(jsi::Runtime& rt, JNIEnv* env, jobject javaObject);
};

} // namespace titanium

#endif
