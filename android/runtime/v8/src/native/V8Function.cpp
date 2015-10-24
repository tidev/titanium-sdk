/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"
#include "TypeConverter.h"
#include "V8Runtime.h"
#include "V8Util.h"

#define TAG "V8Function"

using namespace titanium;
using namespace v8;

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Class:     org_appcelerator_kroll_runtime_v8_V8Function
 * Method:    nativeInvoke
 * Signature: (JJ[Ljava/lang/Object)V
 */
JNIEXPORT jobject JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Function_nativeInvoke(
	JNIEnv *env, jobject caller, jlong thisPointer, jlong functionPointer, jobjectArray functionArguments)
{
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);

	// construct this from pointer
	Persistent<Object>* persistentJSObject = (Persistent<Object>*) thisPointer;
	Local<Object> thisObject = persistentJSObject->Get(V8Runtime::v8_isolate);

	// construct function from pointer
	Persistent<Function>* persistentJSFunction = (Persistent<Function>*) functionPointer;
	Local<Function> jsFunction = persistentJSFunction->Get(V8Runtime::v8_isolate);

	// create function arguments
	int length;
	v8::Local<v8::Value> *jsFunctionArguments =
		TypeConverter::javaObjectArrayToJsArguments(V8Runtime::v8_isolate, env, functionArguments, &length);

	// call into the JS function with the provided argument
	TryCatch tryCatch(V8Runtime::v8_isolate);
	v8::Local<v8::Value> object = jsFunction->Call(V8Runtime::v8_isolate->GetCurrentContext(), thisObject, length, jsFunctionArguments).ToLocalChecked();

	// make sure to delete the arguments since the arguments array is built on the heap
	if (jsFunctionArguments) {
		delete jsFunctionArguments;
	}

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch);

		return NULL;
	}

	bool isNew;
	return TypeConverter::jsValueToJavaObject(V8Runtime::v8_isolate, env, object, &isNew);
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Function_nativeRelease
	(JNIEnv *env, jclass clazz, jlong ptr)
{
	ASSERT(ptr != 0);

	// Release the JS function so it can be collected.
	Persistent<Function>* persistentJSFunction = (Persistent<Function>*) ptr;
	persistentJSFunction->Reset();
}

#ifdef __cplusplus
}
#endif
