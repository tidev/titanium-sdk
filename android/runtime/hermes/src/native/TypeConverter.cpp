/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cstring>
#include <sstream>
#include <string>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "JSUtil.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

#define TAG "TypeConverter"

namespace titanium {

// The memory of an ArrayBuffer that native code created.
class ByteBuffer : public jsi::MutableBuffer
{
public:
	explicit ByteBuffer(size_t size)
		: bytes_(size)
	{
	}

	size_t size() const override
	{
		return bytes_.size();
	}

	uint8_t* data() override
	{
		return bytes_.data();
	}

private:
	std::vector<uint8_t> bytes_;
};

static double toNumber(jsi::Runtime& rt, const jsi::Value& value)
{
	if (value.isNumber()) {
		return value.getNumber();
	}
	if (value.isBool()) {
		return value.getBool() ? 1 : 0;
	}
	if (value.isNull() || value.isUndefined()) {
		return 0;
	}
	// Number(value) for strings and objects.
	jsi::Value result = rt.global().getPropertyAsFunction(rt, "Number").call(rt, value);
	return result.isNumber() ? result.getNumber() : 0;
}

static bool isArray(jsi::Runtime& rt, const jsi::Value& value)
{
	return value.isObject() && value.getObject(rt).isArray(rt);
}

/****************************** numbers and booleans ******************************/

jshort TypeConverter::jsNumberToJavaShort(jsi::Runtime& rt, const jsi::Value& jsNumber)
{
	return (jshort) toNumber(rt, jsNumber);
}

jint TypeConverter::jsNumberToJavaInt(jsi::Runtime& rt, const jsi::Value& jsNumber)
{
	return (jint) toNumber(rt, jsNumber);
}

jlong TypeConverter::jsNumberToJavaLong(jsi::Runtime& rt, const jsi::Value& jsNumber)
{
	return (jlong) toNumber(rt, jsNumber);
}

jfloat TypeConverter::jsNumberToJavaFloat(jsi::Runtime& rt, const jsi::Value& jsNumber)
{
	return (jfloat) toNumber(rt, jsNumber);
}

jdouble TypeConverter::jsNumberToJavaDouble(jsi::Runtime& rt, const jsi::Value& jsNumber)
{
	return (jdouble) toNumber(rt, jsNumber);
}

jboolean TypeConverter::jsBooleanToJavaBoolean(jsi::Runtime& rt, const jsi::Value& jsBoolean)
{
	if (jsBoolean.isBool()) {
		return jsBoolean.getBool() ? JNI_TRUE : JNI_FALSE;
	}
	if (jsBoolean.isNull() || jsBoolean.isUndefined()) {
		return JNI_FALSE;
	}
	if (jsBoolean.isNumber()) {
		double number = jsBoolean.getNumber();
		return (number != 0 && number == number) ? JNI_TRUE : JNI_FALSE;
	}
	if (jsBoolean.isString()) {
		return jsBoolean.getString(rt).utf8(rt).empty() ? JNI_FALSE : JNI_TRUE;
	}
	return JNI_TRUE;
}

jsi::Value TypeConverter::javaShortToJsNumber(jsi::Runtime& rt, JNIEnv* env, jshort value)
{
	return jsi::Value((double) value);
}

jsi::Value TypeConverter::javaIntToJsNumber(jsi::Runtime& rt, JNIEnv* env, jint value)
{
	return jsi::Value((double) value);
}

jsi::Value TypeConverter::javaLongToJsNumber(jsi::Runtime& rt, JNIEnv* env, jlong value)
{
	return jsi::Value((double) value);
}

jsi::Value TypeConverter::javaFloatToJsNumber(jsi::Runtime& rt, JNIEnv* env, jfloat value)
{
	return jsi::Value((double) value);
}

jsi::Value TypeConverter::javaDoubleToJsNumber(jsi::Runtime& rt, JNIEnv* env, jdouble value)
{
	return jsi::Value((double) value);
}

jsi::Value TypeConverter::javaBooleanToJsBoolean(jsi::Runtime& rt, JNIEnv* env, jboolean value)
{
	return jsi::Value((bool) value);
}

/****************************** strings ******************************/

jstring TypeConverter::jsStringToJavaString(jsi::Runtime& rt, JNIEnv* env, const jsi::String& jsString)
{
	// Java and JS strings are both UTF-16, so no character is changed.
	std::u16string chars = jsString.utf16(rt);
	return env->NewString(reinterpret_cast<const jchar*>(chars.data()), (jsize) chars.length());
}

jstring TypeConverter::jsValueToJavaString(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue)
{
	if (jsValue.isNull() || jsValue.isUndefined()) {
		return NULL;
	}
	if (jsValue.isString()) {
		return jsStringToJavaString(rt, env, jsValue.getString(rt));
	}
	return jsStringToJavaString(rt, env, jsValue.toString(rt));
}

jsi::Value TypeConverter::javaStringToJsString(jsi::Runtime& rt, JNIEnv* env, jstring javaString)
{
	if (!javaString) {
		return jsi::Value::null();
	}
	jsize length = env->GetStringLength(javaString);
	const jchar* chars = env->GetStringChars(javaString, NULL);
	jsi::String jsString = jsi::String::createFromUtf16(rt, reinterpret_cast<const char16_t*>(chars), (size_t) length);
	env->ReleaseStringChars(javaString, chars);
	return jsString;
}

jsi::Value TypeConverter::javaBytesToJsString(jsi::Runtime& rt, JNIEnv* env, jbyteArray javaBytes)
{
	if (!javaBytes) {
		return jsi::Value::null();
	}
	jsize length = env->GetArrayLength(javaBytes);
	jbyte* bytes = env->GetByteArrayElements(javaBytes, NULL);
	jsi::String jsString = jsi::String::createFromUtf8(rt, reinterpret_cast<const uint8_t*>(bytes), (size_t) length);
	env->ReleaseByteArrayElements(javaBytes, bytes, JNI_ABORT);
	return jsString;
}

/****************************** dates ******************************/

bool TypeConverter::isDate(jsi::Runtime& rt, const jsi::Value& jsValue)
{
	return jsValue.isObject() && jsValue.getObject(rt).instanceOf(rt, TiRuntime::state->dateConstructor);
}

jlong TypeConverter::jsDateToJavaLong(jsi::Runtime& rt, const jsi::Value& jsDate)
{
	jsi::Object date = jsDate.getObject(rt);
	jsi::Value time = date.getPropertyAsFunction(rt, "getTime").callWithThis(rt, date);
	return time.isNumber() ? (jlong) time.getNumber() : 0;
}

jobject TypeConverter::jsDateToJavaDate(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsDate)
{
	return env->NewObject(JNIUtil::dateClass, JNIUtil::dateInitMethod, jsDateToJavaLong(rt, jsDate));
}

jsi::Value TypeConverter::javaDateToJsDate(jsi::Runtime& rt, JNIEnv* env, jobject javaDate)
{
	jlong epochTime = env->CallLongMethod(javaDate, JNIUtil::dateGetTimeMethod);
	return javaLongToJsDate(rt, env, epochTime);
}

jsi::Value TypeConverter::javaLongToJsDate(jsi::Runtime& rt, JNIEnv* env, jlong epochTime)
{
	return TiRuntime::state->dateConstructor.callAsConstructor(rt, (double) epochTime);
}

/****************************** functions and promises ******************************/

jobject TypeConverter::jsObjectToJavaFunction(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsFunction)
{
	// Java cannot hold a JS handle. The runtime keeps the function in a table,
	// and the Java HermesFunction holds the key.
	int64_t id = TiRuntime::nextHandleId();
	TiRuntime::state->functions.emplace(id, jsFunction.getObject(rt).getFunction(rt));
	return env->NewObject(JNIUtil::jsFunctionClass, JNIUtil::jsFunctionInitMethod, (jlong) id);
}

jsi::Value TypeConverter::javaObjectToJsFunction(jsi::Runtime& rt, JNIEnv* env, jobject javaObject)
{
	jlong id = env->GetLongField(javaObject, JNIUtil::jsObjectPtrField);
	auto it = TiRuntime::state->functions.find(id);
	if (it == TiRuntime::state->functions.end()) {
		LOGE(TAG, "Received a HermesFunction with an unknown id, returning undefined.");
		return jsi::Value::undefined();
	}
	return jsi::Value(rt, it->second);
}

jobject TypeConverter::jsObjectToJavaPromise(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsPromise)
{
	// Java gets a handle to a promise that JS code made. JSI cannot settle such a promise
	// from outside, so the entry has no resolve and no reject function.
	int64_t id = TiRuntime::nextHandleId();
	Deferred deferred{ jsPromise.getObject(rt), std::nullopt, std::nullopt };
	TiRuntime::state->resolvers.emplace(id, std::move(deferred));
	return env->NewObject(JNIUtil::jsPromiseClass, JNIUtil::jsPromiseInitMethod, (jlong) id);
}

jsi::Value TypeConverter::javaObjectToJsPromise(jsi::Runtime& rt, JNIEnv* env, jobject javaObject)
{
	jlong id = env->GetLongField(javaObject, JNIUtil::jsObjectPtrField);
	auto it = TiRuntime::state->resolvers.find(id);
	if (it == TiRuntime::state->resolvers.end()) {
		LOGE(TAG, "Received a HermesPromise with an unknown id, returning undefined.");
		return jsi::Value::undefined();
	}
	return jsi::Value(rt, it->second.promise);
}

/****************************** arrays ******************************/

jobjectArray TypeConverter::jsArgumentsToJavaArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value* args, size_t count,
	size_t start)
{
	size_t length = count > start ? count - start : 0;
	jobjectArray javaArgs = env->NewObjectArray((jsize) length, JNIUtil::objectClass, NULL);
	for (size_t i = 0; i < length; ++i) {
		bool isNew = false;
		jobject javaArg = jsValueToJavaObject(rt, env, args[start + i], &isNew);
		env->SetObjectArrayElement(javaArgs, (jsize) i, javaArg);
		if (isNew) {
			env->DeleteLocalRef(javaArg);
		}
	}
	return javaArgs;
}

std::vector<jsi::Value> TypeConverter::javaObjectArrayToJsArguments(jsi::Runtime& rt, JNIEnv* env,
	jobjectArray javaObjectArray)
{
	std::vector<jsi::Value> jsArguments;
	if (!javaObjectArray) {
		return jsArguments;
	}
	jsize length = env->GetArrayLength(javaObjectArray);
	jsArguments.reserve(length);
	for (jsize i = 0; i < length; i++) {
		jobject element = env->GetObjectArrayElement(javaObjectArray, i);
		jsArguments.push_back(javaObjectToJsValue(rt, env, element));
		env->DeleteLocalRef(element);
	}
	return jsArguments;
}

jarray TypeConverter::jsArrayToJavaArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray)
{
	if (!isArray(rt, jsArray)) {
		return NULL;
	}
	jsi::Array array = jsArray.getObject(rt).getArray(rt);
	size_t length = array.size(rt);
	jobjectArray javaArray = env->NewObjectArray((jsize) length, JNIUtil::objectClass, NULL);
	if (javaArray == NULL) {
		LOGE(TAG, "unable to create new jobjectArray");
		return NULL;
	}
	for (size_t i = 0; i < length; i++) {
		bool isNew = false;
		jobject javaObject = jsValueToJavaObject(rt, env, array.getValueAtIndex(rt, i), &isNew);
		env->SetObjectArrayElement(javaArray, (jsize) i, javaObject);
		if (isNew) {
			env->DeleteLocalRef(javaObject);
		}
	}
	return javaArray;
}

jobjectArray TypeConverter::jsArrayToJavaStringArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray)
{
	if (!isArray(rt, jsArray)) {
		return NULL;
	}
	jsi::Array array = jsArray.getObject(rt).getArray(rt);
	size_t length = array.size(rt);
	jobjectArray javaArray = env->NewObjectArray((jsize) length, JNIUtil::stringClass, NULL);
	if (javaArray == NULL) {
		LOGE(TAG, "unable to create new jobjectArray");
		return NULL;
	}
	for (size_t i = 0; i < length; i++) {
		jstring javaString = jsStringToJavaString(rt, env, array.getValueAtIndex(rt, i).toString(rt));
		env->SetObjectArrayElement(javaArray, (jsize) i, javaString);
		env->DeleteLocalRef(javaString);
	}
	return javaArray;
}

// Copies a JS array of numbers into a new Java array of a primitive type.
template <typename JavaArray, typename JavaElement>
static JavaArray jsArrayToJavaNumberArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray,
	JavaArray (JNIEnv::*newArray)(jsize),
	void (JNIEnv::*setRegion)(JavaArray, jsize, jsize, const JavaElement*))
{
	if (!isArray(rt, jsArray)) {
		return NULL;
	}
	jsi::Array array = jsArray.getObject(rt).getArray(rt);
	size_t length = array.size(rt);
	JavaArray javaArray = (env->*newArray)((jsize) length);
	if (javaArray == NULL) {
		LOGE(TAG, "unable to create new Java array");
		return NULL;
	}
	std::vector<JavaElement> buffer(length);
	for (size_t i = 0; i < length; i++) {
		buffer[i] = (JavaElement) toNumber(rt, array.getValueAtIndex(rt, i));
	}
	(env->*setRegion)(javaArray, 0, (jsize) length, buffer.data());
	return javaArray;
}

jshortArray TypeConverter::jsArrayToJavaShortArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray)
{
	return jsArrayToJavaNumberArray<jshortArray, jshort>(rt, env, jsArray, &JNIEnv::NewShortArray, &JNIEnv::SetShortArrayRegion);
}

jintArray TypeConverter::jsArrayToJavaIntArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray)
{
	return jsArrayToJavaNumberArray<jintArray, jint>(rt, env, jsArray, &JNIEnv::NewIntArray, &JNIEnv::SetIntArrayRegion);
}

jlongArray TypeConverter::jsArrayToJavaLongArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray)
{
	return jsArrayToJavaNumberArray<jlongArray, jlong>(rt, env, jsArray, &JNIEnv::NewLongArray, &JNIEnv::SetLongArrayRegion);
}

jfloatArray TypeConverter::jsArrayToJavaFloatArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray)
{
	return jsArrayToJavaNumberArray<jfloatArray, jfloat>(rt, env, jsArray, &JNIEnv::NewFloatArray, &JNIEnv::SetFloatArrayRegion);
}

jdoubleArray TypeConverter::jsArrayToJavaDoubleArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArray)
{
	return jsArrayToJavaNumberArray<jdoubleArray, jdouble>(rt, env, jsArray, &JNIEnv::NewDoubleArray, &JNIEnv::SetDoubleArrayRegion);
}

jbyteArray TypeConverter::jsArrayBufferToJavaByteArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsArrayBuffer)
{
	if (!jsArrayBuffer.isObject() || !jsArrayBuffer.getObject(rt).isArrayBuffer(rt)) {
		return NULL;
	}
	jsi::ArrayBuffer buffer = jsArrayBuffer.getObject(rt).getArrayBuffer(rt);
	size_t length = buffer.size(rt);
	jbyteArray javaArray = env->NewByteArray((jsize) length);
	if (javaArray == NULL) {
		LOGE(TAG, "unable to create new jbyteArray");
		return NULL;
	}
	if (length > 0) {
		env->SetByteArrayRegion(javaArray, 0, (jsize) length, reinterpret_cast<const jbyte*>(buffer.data(rt)));
	}
	return javaArray;
}

// Copies a Java array of a primitive type into a new JS array.
template <typename JavaArray, typename JavaElement>
static jsi::Value javaNumberArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, JavaArray javaArray,
	JavaElement* (JNIEnv::*getElements)(JavaArray, jboolean*),
	void (JNIEnv::*releaseElements)(JavaArray, JavaElement*, jint),
	bool asBoolean = false)
{
	jsize length = env->GetArrayLength(javaArray);
	jsi::Array jsArray(rt, (size_t) length);
	JavaElement* elements = (env->*getElements)(javaArray, NULL);
	for (jsize i = 0; i < length; i++) {
		if (asBoolean) {
			jsArray.setValueAtIndex(rt, (size_t) i, jsi::Value((bool) elements[i]));
		} else {
			jsArray.setValueAtIndex(rt, (size_t) i, jsi::Value((double) elements[i]));
		}
	}
	(env->*releaseElements)(javaArray, elements, JNI_ABORT);
	return jsArray;
}

jsi::Value TypeConverter::javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jbooleanArray javaArray)
{
	return javaNumberArrayToJsArray<jbooleanArray, jboolean>(rt, env, javaArray,
		&JNIEnv::GetBooleanArrayElements, &JNIEnv::ReleaseBooleanArrayElements, true);
}

jsi::Value TypeConverter::javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jshortArray javaArray)
{
	return javaNumberArrayToJsArray<jshortArray, jshort>(rt, env, javaArray,
		&JNIEnv::GetShortArrayElements, &JNIEnv::ReleaseShortArrayElements);
}

jsi::Value TypeConverter::javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jintArray javaArray)
{
	return javaNumberArrayToJsArray<jintArray, jint>(rt, env, javaArray,
		&JNIEnv::GetIntArrayElements, &JNIEnv::ReleaseIntArrayElements);
}

jsi::Value TypeConverter::javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jlongArray javaArray)
{
	return javaNumberArrayToJsArray<jlongArray, jlong>(rt, env, javaArray,
		&JNIEnv::GetLongArrayElements, &JNIEnv::ReleaseLongArrayElements);
}

jsi::Value TypeConverter::javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jfloatArray javaArray)
{
	return javaNumberArrayToJsArray<jfloatArray, jfloat>(rt, env, javaArray,
		&JNIEnv::GetFloatArrayElements, &JNIEnv::ReleaseFloatArrayElements);
}

jsi::Value TypeConverter::javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jdoubleArray javaArray)
{
	return javaNumberArrayToJsArray<jdoubleArray, jdouble>(rt, env, javaArray,
		&JNIEnv::GetDoubleArrayElements, &JNIEnv::ReleaseDoubleArrayElements);
}

jsi::Value TypeConverter::javaArrayToJsArray(jsi::Runtime& rt, JNIEnv* env, jobjectArray javaArray)
{
	jsize length = env->GetArrayLength(javaArray);
	jsi::Array jsArray(rt, (size_t) length);
	for (jsize i = 0; i < length; i++) {
		jobject element = env->GetObjectArrayElement(javaArray, i);
		jsArray.setValueAtIndex(rt, (size_t) i, javaObjectToJsValue(rt, env, element));
		env->DeleteLocalRef(element);
	}
	return jsArray;
}

jsi::Value TypeConverter::javaByteArrayToJsArrayBuffer(jsi::Runtime& rt, JNIEnv* env, jbyteArray javaByteArray)
{
	size_t byteCount = (size_t) env->GetArrayLength(javaByteArray);
	std::shared_ptr<ByteBuffer> buffer = std::make_shared<ByteBuffer>(byteCount);
	if (byteCount > 0) {
		env->GetByteArrayRegion(javaByteArray, 0, (jsize) byteCount, reinterpret_cast<jbyte*>(buffer->data()));
	}
	return jsi::ArrayBuffer(rt, buffer);
}

jobjectArray TypeConverter::jsObjectIndexPropsToJavaArray(jsi::Runtime& rt, JNIEnv* env, const jsi::Object& jsObject,
	int start, int length)
{
	int arrayLength = length <= start ? 0 : length - start;
	jobjectArray javaArray = env->NewObjectArray(arrayLength, JNIUtil::objectClass, NULL);
	for (int index = start; index < length; ++index) {
		jsi::Value element = jsObject.getProperty(rt, jsi::PropNameID::forAscii(rt, std::to_string(index)));
		bool isNew = false;
		jobject javaObject = jsValueToJavaObject(rt, env, element, &isNew);
		env->SetObjectArrayElement(javaArray, index - start, javaObject);
		if (isNew) {
			env->DeleteLocalRef(javaObject);
		}
	}
	return javaArray;
}

/****************************** errors ******************************/

jsi::Object TypeConverter::javaThrowableToJSError(jsi::Runtime& rt, JNIEnv* env, jthrowable javaException)
{
	jstring javaMessage = (jstring) env->CallObjectMethod(javaException, JNIUtil::throwableGetMessageMethod);
	jsi::Value message;
	if (!javaMessage) {
		message = jsi::String::createFromAscii(rt, "Unknown Java Exception occurred");
	} else {
		message = javaStringToJsString(rt, env, javaMessage);
		env->DeleteLocalRef(javaMessage);
	}
	jsi::Object error = TiRuntime::state->errorConstructor.callAsConstructor(rt, message).getObject(rt);

	std::stringstream stackStream;
	jobjectArray frames = (jobjectArray) env->CallObjectMethod(javaException, JNIUtil::throwableGetStackTraceMethod);
	jsize framesLength = frames ? env->GetArrayLength(frames) : 0;
	for (jsize i = 0; i < (framesLength > MAX_STACK ? MAX_STACK : framesLength); i++) {
		jobject frame = env->GetObjectArrayElement(frames, i);
		jstring javaStack = (jstring) env->CallObjectMethod(frame, JNIUtil::stackTraceElementToStringMethod);
		const char* stackPtr = env->GetStringUTFChars(javaStack, NULL);
		stackStream << std::endl << "    " << stackPtr;
		env->ReleaseStringUTFChars(javaStack, stackPtr);
		env->DeleteLocalRef(javaStack);
		env->DeleteLocalRef(frame);
	}
	if (frames) {
		env->DeleteLocalRef(frames);
	}
	stackStream << std::endl;

	// attach 'nativeStack' to the error
	error.setProperty(rt, "nativeStack", jsi::String::createFromUtf8(rt, stackStream.str()));

	// If we're using our custom error interface, the Java code can define any additional properties.
	if (env->IsInstanceOf(javaException, JNIUtil::jsErrorClass)) {
		jobject customProps = env->CallObjectMethod(javaException, JNIUtil::getJSPropertiesMethod);
		if (customProps) {
			jsi::Object props = javaHashMapToJsValue(rt, env, customProps);
			env->DeleteLocalRef(customProps);
			jsi::Array keys = props.getPropertyNames(rt);
			size_t keyCount = keys.size(rt);
			for (size_t i = 0; i < keyCount; i++) {
				jsi::PropNameID key = jsi::PropNameID::forString(rt, keys.getValueAtIndex(rt, i).toString(rt));
				error.setProperty(rt, key, props.getProperty(rt, key));
			}
		}
	}
	return error;
}

jobject TypeConverter::jsValueToJavaError(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue, bool* isNew)
{
	if (jsValue.isObject()) {
		if (Proxy::unwrap(rt, jsValue) == nullptr) {
			RuntimeState& state = *TiRuntime::state;
			jsi::Object jsObject = jsValue.getObject(rt);
			jsi::Value hasStack = state.hasOwn.call(rt, jsObject, jsi::String::createFromAscii(rt, "stack"));
			jsi::Value hasMessage = state.hasOwn.call(rt, jsObject, jsi::String::createFromAscii(rt, "message"));
			if ((hasStack.isBool() && hasStack.getBool()) || (hasMessage.isBool() && hasMessage.getBool())) {
				*isNew = true;
				jstring message = jsValueToJavaString(rt, env, jsObject.getProperty(rt, "message"));
				jstring stack = jsValueToJavaString(rt, env, jsObject.getProperty(rt, "stack"));
				jobject result = env->NewObject(JNIUtil::krollExceptionClass, JNIUtil::krollExceptionInitMethod, message, stack);
				if (message) {
					env->DeleteLocalRef(message);
				}
				if (stack) {
					env->DeleteLocalRef(stack);
				}
				return result;
			}
		}
	} else {
		*isNew = true;
		jstring message = jsValueToJavaString(rt, env, jsValue);
		jobject result = env->NewObject(JNIUtil::krollExceptionClass, JNIUtil::krollExceptionInitMethod, message, NULL);
		if (message) {
			env->DeleteLocalRef(message);
		}
		return result;
	}

	if (!jsValue.isNull() && !jsValue.isUndefined()) {
		LOGW(TAG, "jsValueToJavaError returning null.");
	}
	return NULL;
}

/****************************** generic values ******************************/

// Copies the own enumerable properties of a JS object into a Java map with the given "put" method.
static void copyPropertiesToJavaMap(jsi::Runtime& rt, JNIEnv* env, const jsi::Object& jsObject, jobject javaMap,
	jmethodID putMethod)
{
	jsi::Value keysValue = TiRuntime::state->objectKeys.call(rt, jsObject);
	if (!keysValue.isObject()) {
		return;
	}
	jsi::Array keys = keysValue.getObject(rt).getArray(rt);
	size_t keyCount = keys.size(rt);
	for (size_t i = 0; i < keyCount; i++) {
		jsi::String key = keys.getValueAtIndex(rt, i).getString(rt);
		jstring javaKey = TypeConverter::jsStringToJavaString(rt, env, key);
		bool valueIsNew = false;
		jobject javaValue = TypeConverter::jsValueToJavaObject(rt, env,
			jsObject.getProperty(rt, jsi::PropNameID::forString(rt, key)), &valueIsNew);
		jobject result = env->CallObjectMethod(javaMap, putMethod, javaKey, javaValue);
		env->DeleteLocalRef(result);
		env->DeleteLocalRef(javaKey);
		if (valueIsNew) {
			env->DeleteLocalRef(javaValue);
		}
	}
}

// TODO: the V8 runtime allocates a Java Integer, Double or Boolean per conversion too.
// Item 3 of the Android performance list applies to this function as well.
jobject TypeConverter::jsValueToJavaObject(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue, bool* isNew)
{
	*isNew = false;
	if (jsValue.isNumber()) {
		*isNew = true;
		if (JSUtil::isInt32(jsValue)) {
			return env->NewObject(JNIUtil::integerClass, JNIUtil::integerInitMethod, (jint) jsValue.getNumber());
		}
		return env->NewObject(JNIUtil::doubleClass, JNIUtil::doubleInitMethod, (jdouble) jsValue.getNumber());
	}
	if (jsValue.isBool()) {
		*isNew = true;
		return env->NewObject(JNIUtil::booleanClass, JNIUtil::booleanInitMethod, (jboolean) jsValue.getBool());
	}
	if (jsValue.isString()) {
		*isNew = true;
		return jsStringToJavaString(rt, env, jsValue.getString(rt));
	}
	if (jsValue.isObject()) {
		jsi::Object jsObject = jsValue.getObject(rt);
		*isNew = true;

		if (jsObject.isFunction(rt)) {
			return jsObjectToJavaFunction(rt, env, jsValue);
		}
		if (jsObject.isArray(rt)) {
			return jsArrayToJavaArray(rt, env, jsValue);
		}
		if (isDate(rt, jsValue)) {
			return jsDateToJavaDate(rt, env, jsValue);
		}

		Proxy* proxy = Proxy::unwrap(rt, jsValue);
		if (proxy) {
			return proxy->getJavaObject();
		}

		// Unwrap the hyperloop JS wrapper to get the native Java proxy.
		RuntimeState& state = *TiRuntime::state;
		jsi::Value hasNative = state.hasOwn.call(rt, jsObject, jsi::String::createFromAscii(rt, "$native"));
		if (hasNative.isBool() && hasNative.getBool()) {
			jsi::Value nativeObject = jsObject.getProperty(rt, state.nativeProp);
			Proxy* nativeProxy = Proxy::unwrap(rt, nativeObject);
			if (nativeProxy) {
				return nativeProxy->getJavaObject();
			}
		}

		jobject javaHashMap = env->NewObject(JNIUtil::hashMapClass, JNIUtil::hashMapInitMethod, (jint) 8);
		copyPropertiesToJavaMap(rt, env, jsObject, javaHashMap, JNIUtil::hashMapPutMethod);
		return javaHashMap;
	}

	if (!jsValue.isNull() && !jsValue.isUndefined()) {
		LOGW(TAG, "jsValueToJavaObject returning null.");
	}
	return NULL;
}

// converts js object to kroll dict and recursively converts sub objects if this
// object is a container type. If javaObject is NULL, an empty KrollDict is created.
jobject TypeConverter::jsObjectToJavaKrollDict(jsi::Runtime& rt, JNIEnv* env, const jsi::Value& jsValue, bool* isNew)
{
	*isNew = false;
	if (jsValue.isObject()) {
		*isNew = true;
		jobject javaKrollDict = env->NewObject(JNIUtil::krollDictClass, JNIUtil::krollDictInitMethod, (jint) 8);
		copyPropertiesToJavaMap(rt, env, jsValue.getObject(rt), javaKrollDict, JNIUtil::krollDictPutMethod);
		return javaKrollDict;
	}
	if (!jsValue.isNull() && !jsValue.isUndefined()) {
		LOGW(TAG, "jsObjectToJavaKrollDict returning null.");
	}
	return NULL;
}

jsi::Object TypeConverter::javaHashMapToJsValue(jsi::Runtime& rt, JNIEnv* env, jobject javaObject)
{
	jsi::Object jsObject(rt);
	if (!javaObject || !env) {
		return jsObject;
	}

	jobject hashMapSet = env->CallObjectMethod(javaObject, JNIUtil::hashMapKeySetMethod);
	jobjectArray hashMapKeys = (jobjectArray) env->CallObjectMethod(hashMapSet, JNIUtil::setToArrayMethod);
	env->DeleteLocalRef(hashMapSet);
	jsize hashMapKeysLength = env->GetArrayLength(hashMapKeys);

	for (jsize i = 0; i < hashMapKeysLength; i++) {
		jobject javaPairKey = env->GetObjectArrayElement(hashMapKeys, i);
		jsi::Value jsPairKey;
		if (javaPairKey && env->IsInstanceOf(javaPairKey, JNIUtil::stringClass)) {
			jsPairKey = javaStringToJsString(rt, env, (jstring) javaPairKey);
		} else {
			jsPairKey = javaObjectToJsValue(rt, env, javaPairKey);
		}

		jobject javaPairValue = env->CallObjectMethod(javaObject, JNIUtil::hashMapGetMethod, javaPairKey);
		env->DeleteLocalRef(javaPairKey);

		jsObject.setProperty(rt, jsi::PropNameID::forString(rt, jsPairKey.toString(rt)),
			javaObjectToJsValue(rt, env, javaPairValue));
		env->DeleteLocalRef(javaPairValue);
	}
	env->DeleteLocalRef(hashMapKeys);

	return jsObject;
}

// converts java object to js value and recursively converts sub objects if this
// object is a container type
jsi::Value TypeConverter::javaObjectToJsValue(jsi::Runtime& rt, JNIEnv* env, jobject javaObject)
{
	if (!javaObject) {
		return jsi::Value::null();
	}

	if (env->IsInstanceOf(javaObject, JNIUtil::booleanClass)) {
		jboolean javaBoolean = env->CallBooleanMethod(javaObject, JNIUtil::booleanBooleanValueMethod);
		return jsi::Value((bool) javaBoolean);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::numberClass)) {
		jdouble javaDouble = env->CallDoubleMethod(javaObject, JNIUtil::numberDoubleValueMethod);
		return jsi::Value((double) javaDouble);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::stringClass)) {
		return javaStringToJsString(rt, env, (jstring) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::dateClass)) {
		return javaDateToJsDate(rt, env, javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::hashMapClass)) {
		return javaHashMapToJsValue(rt, env, javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::krollProxyClass)) {
		jobject krollObject = env->GetObjectField(javaObject, JNIUtil::krollProxyKrollObjectField);
		if (krollObject && env->IsInstanceOf(krollObject, JNIUtil::jsObjectClass)) {
			jlong proxyId = env->GetLongField(krollObject, JNIUtil::jsObjectPtrField);
			env->DeleteLocalRef(krollObject);

			Proxy* proxy = proxyId != 0 ? Proxy::fromId(proxyId) : nullptr;
			if (proxy) {
				jsi::Value jsProxy = proxy->jsObject(rt);
				if (jsProxy.isObject()) {
					return jsProxy;
				}
			}
		} else if (krollObject) {
			env->DeleteLocalRef(krollObject);
		}

		// The Java proxy has no JS object, or Hermes collected it. Make a new one.
		jclass javaObjectClass = env->GetObjectClass(javaObject);
		jsi::Value proxyHandle = ProxyFactory::createJsProxy(rt, javaObjectClass, javaObject);
		env->DeleteLocalRef(javaObjectClass);
		return proxyHandle;

	} else if (env->IsInstanceOf(javaObject, JNIUtil::jsFunctionClass)) {
		return javaObjectToJsFunction(rt, env, javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::objectArrayClass)) {
		return javaArrayToJsArray(rt, env, (jobjectArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::byteArrayClass)) {
		return javaByteArrayToJsArrayBuffer(rt, env, (jbyteArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::shortArrayClass)) {
		return javaArrayToJsArray(rt, env, (jshortArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::intArrayClass)) {
		return javaArrayToJsArray(rt, env, (jintArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::longArrayClass)) {
		return javaArrayToJsArray(rt, env, (jlongArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::floatArrayClass)) {
		return javaArrayToJsArray(rt, env, (jfloatArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::doubleArrayClass)) {
		return javaArrayToJsArray(rt, env, (jdoubleArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::booleanArrayClass)) {
		return javaArrayToJsArray(rt, env, (jbooleanArray) javaObject);

	} else if (env->IsInstanceOf(javaObject, JNIUtil::throwableClass)) {
		return javaThrowableToJSError(rt, env, (jthrowable) javaObject);

	} else if (env->IsSameObject(JNIUtil::undefinedObject, javaObject)) {
		return jsi::Value::undefined();
	}

	jclass javaObjectClass = env->GetObjectClass(javaObject);
	JNIUtil::logClassName("!!! Unable to convert unknown Java object class '%s' to JS value !!!", javaObjectClass, true);
	env->DeleteLocalRef(javaObjectClass);
	return jsi::Value::undefined();
}

} // namespace titanium
