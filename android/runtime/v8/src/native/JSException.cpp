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

Handle<Value> JSException::fromJavaException(jthrowable javaException)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return GetJNIEnvironmentError();
	}

	if (!javaException) {
		javaException = env->ExceptionOccurred();
	}

	env->ExceptionDescribe();

	jstring message = (jstring) env->CallObjectMethod(javaException, JNIUtil::throwableGetMessageMethod);
	if (!message) {
		return THROW("Java Exception occurred");
	}

	return ThrowException(Exception::Error(TypeConverter::javaStringToJsString(message)));
}

}
