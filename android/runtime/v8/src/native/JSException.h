/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef JSEXCEPTION_H
#define JSEXCEPTION_H

#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"

#define THROW(isolate, msg) \
	isolate->ThrowException(v8::String::NewFromUtf8(isolate, msg))

namespace titanium {

class JSException
{
public:
	static v8::Local<v8::Value> Error(v8::Isolate* isolate, const char* msg)
	{
		return THROW(isolate, msg);
	}

	// Calling a constructor as a function not allowed.
	static v8::Local<v8::Value> CalledConstructor(v8::Isolate* isolate)
	{
		return THROW(isolate, "Calling this constructor is not allowed.");
	}

	// An attempt to get the current JNI environment failed.
	static v8::Local<v8::Value> GetJNIEnvironmentError(v8::Isolate* isolate)
	{
		return THROW(isolate, JNIENV_GET_ERROR_MSG);
	}

	static v8::Local<v8::Value> fromJavaException(v8::Isolate* isolate, jthrowable javaException = NULL);
};

}

#endif
