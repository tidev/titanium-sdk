/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"
#include "TypeConverter.h"

#include "JSException.h"

using namespace v8;

namespace titanium {

Local<Value> JSException::fromJavaException(v8::Isolate* isolate, jthrowable javaException)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return GetJNIEnvironmentError(isolate);
	}

	env->ExceptionDescribe();

	bool deleteRef = false;
	if (!javaException) {
		javaException = env->ExceptionOccurred();
		env->ExceptionClear();
		deleteRef = true;
	}

	//env->ExceptionDescribe();

	jstring message = (jstring) env->CallObjectMethod(javaException, JNIUtil::throwableGetMessageMethod);
	if (!message) {
		return THROW(isolate, "Java Exception occurred");
	}

	Local<Value> jsMessage = TypeConverter::javaStringToJsString(isolate, env, message);
	env->DeleteLocalRef(message);

	if (deleteRef) {
		env->DeleteLocalRef(javaException);
	}

	return isolate->ThrowException(jsMessage->ToString(isolate));
}

}
