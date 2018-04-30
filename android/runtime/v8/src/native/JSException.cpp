/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cstring>
#include <sstream>

#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"
#include "TypeConverter.h"
#include "V8Util.h"

#include "JSException.h"

using namespace v8;

namespace titanium {

Local<Value> JSException::fromJavaException(v8::Isolate* isolate, jthrowable javaException)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		return GetJNIEnvironmentError(isolate);
	}

	bool deleteRef = false;
	if (!javaException) {
		javaException = env->ExceptionOccurred();
		deleteRef = true;
	}
	env->ExceptionClear();

	jstring javaMessage = (jstring) env->CallObjectMethod(javaException, JNIUtil::throwableGetMessageMethod);
	if (!javaMessage) {
		return THROW(isolate, "Java Exception occurred");
	}

	Local<Context> context = isolate->GetCurrentContext();

	// Grab the top-level error message
	Local<Value> message = TypeConverter::javaStringToJsString(isolate, env, javaMessage);
	env->DeleteLocalRef(javaMessage);
	// Create a JS Error holding this message
	// We use .As<String> here because we know that the return value of TypeConverter::javaStringToJsString
	// must be a String. Only other variant is Null when the javaMessage is null, which we already checked for above.
	// We use .As<Object> on Error because an Error is an Object.
	Local<Object> error = Exception::Error(message.As<String>()).As<Object>();

	// Now loop through the java stack and generate a JS String from the result and assign to Local<String> stack
	std::stringstream stackStream;
	jobjectArray frames = (jobjectArray) env->CallObjectMethod(javaException, JNIUtil::throwableGetStackTraceMethod);
	jsize frames_length = env->GetArrayLength(frames);
	for (int i = 0; i < (frames_length > MAX_STACK ? MAX_STACK : frames_length); i++) {
		jobject frame = env->GetObjectArrayElement(frames, i);
		jstring javaStack = (jstring) env->CallObjectMethod(frame, JNIUtil::stackTraceElementToStringMethod);

		const char* stackPtr = env->GetStringUTFChars(javaStack, NULL);
		stackStream << std::endl << "    " << stackPtr;

		env->ReleaseStringUTFChars(javaStack, stackPtr);
		env->DeleteLocalRef(javaStack);
	}
	if (deleteRef) {
		env->DeleteLocalRef(javaException);
	}
	stackStream << std::endl;

	// Now explicitly assign our properly generated stacktrace
	Local<String> javaStack = String::NewFromUtf8(isolate, stackStream.str().c_str());
	error->Set(context, STRING_NEW(isolate, "nativeStack"), javaStack);

	// throw it
	return isolate->ThrowException(error);
}

}
