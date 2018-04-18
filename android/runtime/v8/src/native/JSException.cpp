/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cstring>
#include <sstream>

#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"
#include "TypeConverter.h"

#include "JSException.h"

#define MAX_STACK 10

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
	const char* messagePtr = env->GetStringUTFChars(javaMessage, NULL);
	std::stringstream message;
	message << messagePtr;

	jobjectArray frames = (jobjectArray) env->CallObjectMethod(javaException, JNIUtil::throwableGetStackTraceMethod);
	jsize frames_length = env->GetArrayLength(frames);
	for (int i = 0; i < (frames_length > MAX_STACK ? MAX_STACK : frames_length); i++) {
		jobject frame = env->GetObjectArrayElement(frames, i);
		jstring javaStack = (jstring) env->CallObjectMethod(frame, JNIUtil::stackTraceElementToStringMethod);

		const char* stackPtr = env->GetStringUTFChars(javaStack, NULL);
		message << std::endl << "    " << stackPtr;

		env->ReleaseStringUTFChars(javaStack, stackPtr);
		env->DeleteLocalRef(javaStack);
	}
	message << std::endl;

	env->ReleaseStringUTFChars(javaMessage, messagePtr);
	env->DeleteLocalRef(javaMessage);
	if (deleteRef) {
		env->DeleteLocalRef(javaException);
	}

	return isolate->ThrowException(String::NewFromUtf8(isolate, message.str().c_str()));
}

}
