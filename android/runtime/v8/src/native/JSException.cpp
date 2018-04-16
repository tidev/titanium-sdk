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
		env->ExceptionClear();
		deleteRef = true;
	}
	//env->ExceptionDescribe();

	jstring javaMessage = (jstring) env->CallObjectMethod(javaException, JNIUtil::throwableGetMessageMethod);
	if (!javaMessage) {
		return THROW(isolate, "Java Exception occurred");
	}
	std::stringstream message(env->GetStringUTFChars(javaMessage, NULL));

	jobjectArray frames = (jobjectArray) env->CallObjectMethod(javaException, JNIUtil::throwableGetStackTraceMethod);
	jsize frames_length = env->GetArrayLength(frames);
	for (int i = 0; i < (frames_length > 10 ? 10 : frames_length); i++) {
		jobject frame = env->GetObjectArrayElement(frames, i);
		jstring javaStack = (jstring) env->CallObjectMethod(frame, JNIUtil::stackTraceElementToStringMethod);

		message << std::endl << env->GetStringUTFChars(javaStack, NULL);

		env->DeleteLocalRef(javaStack);
	}
	message << std::endl;

	env->DeleteLocalRef(javaMessage);
	if (deleteRef) {
		env->DeleteLocalRef(javaException);
	}

	return isolate->ThrowException(String::NewFromUtf8(isolate, message.str().c_str()));
}

}
