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
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Local<Object> thisObject = Local<Object>((Object *) thisPointer);

	// construct function from pointer
	Function *jsFunction = (Function *) functionPointer;

	// create function arguments
	int length;
	v8::Handle<v8::Value> *jsFunctionArguments =
		TypeConverter::javaObjectArrayToJsArguments(functionArguments, &length);

	// call into the JS function with the provided argument
	TryCatch tryCatch;
	v8::Local<v8::Value> object = jsFunction->Call(thisObject, length, jsFunctionArguments);

	// make sure to delete the arguments since the arguments array is built on the heap
	if (jsFunctionArguments) {
		delete jsFunctionArguments;
	}

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(tryCatch);
		V8Util::reportException(tryCatch);

		return NULL;
	}
	
	bool isNew;
	return TypeConverter::jsValueToJavaObject(object, &isNew);
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Function_nativeRelease
	(JNIEnv *env, jclass clazz, jlong ptr)
{
	ASSERT(ptr != 0);
	Persistent<Function> function = Persistent<Function>((Function*) ptr);

	// Release the JS function so it can be collected.
	function.Dispose();
	function.Clear();
}

#ifdef __cplusplus
}
#endif

