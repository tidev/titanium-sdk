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
#include "V8Runtime.h"
#include "V8Util.h"

#define TAG "V8Callback"

using namespace titanium;

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Callback
 * Method:    nativeInvoke
 * Signature: (J[Ljava/lang/Object)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Callback_nativeInvoke(
	JNIEnv *env, jobject caller, jlong functionPointer, jobjectArray functionArguments)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	// construct function from pointer
	v8::Persistent<v8::Function> jsFunction((v8::Function *) functionPointer);

	// create function arguments
	int length;
	v8::Handle<v8::Value> *jsFunctionArguments =
		TypeConverter::javaObjectArrayToJsArguments(functionArguments, &length);

	// call into the JS function with the provided argument
	jsFunction->Call(V8Runtime::globalContext->Global(), length, jsFunctionArguments);

	// make sure to delete the arguments since the arguments array is built on the heap
	if (jsFunctionArguments) {
		delete jsFunctionArguments;
	}
}

#ifdef __cplusplus
}
#endif

