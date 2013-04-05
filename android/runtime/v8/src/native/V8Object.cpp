/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <stdio.h>
#include <v8.h>

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "JNIUtil.h"
#include "TypeConverter.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "V8Runtime.h"
#include "V8Util.h"

#include "org_appcelerator_kroll_runtime_v8_V8Object.h"

#define TAG "V8Object"

using namespace titanium;
using namespace v8;

#ifdef __cplusplus
extern "C" {
#endif

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeInitObject
	(JNIEnv *env, jclass clazz, jclass proxyClass, jobject proxyObject)
{
	ENTER_V8(V8Runtime::globalContext);
	JNIScope jniScope(env);

	ProxyFactory::createV8Proxy(proxyClass, proxyObject);
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetProperty
	(JNIEnv *env, jobject object, jlong ptr, jstring name, jobject value)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<Object> jsObject;
	if (ptr != 0) {
		jsObject = Persistent<Object>((Object *) ptr);
	} else {
		jsObject = TypeConverter::javaObjectToJsValue(env, object)->ToObject();
	}

	Handle<Object> properties = jsObject->Get(Proxy::propertiesSymbol)->ToObject();
	Handle<Value> jsName = TypeConverter::javaStringToJsString(env, name);

	Handle<Value> jsValue = TypeConverter::javaObjectToJsValue(env, value);
	properties->Set(jsName, jsValue);
}


JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeFireEvent
	(JNIEnv *env, jobject jEmitter, jlong ptr, jobject jsource, jlong sourcePtr, jstring event, jobject data, jboolean bubble, jboolean reportSuccess, jint code, jstring errorMessage)
{
	ENTER_V8(V8Runtime::globalContext);
	JNIScope jniScope(env);

	Handle<Value> jsEvent = TypeConverter::javaStringToJsString(env, event);

#ifdef TI_DEBUG
	String::Utf8Value eventName(jsEvent);
	LOGV(TAG, "firing event \"%s\"", *eventName);
#endif

	Handle<Object> emitter;
	if (ptr != 0) {
		emitter = Persistent<Object>((Object *) ptr);
	} else {
		emitter = TypeConverter::javaObjectToJsValue(env, jEmitter)->ToObject();
	}

	Handle<Value> fireEventValue = emitter->Get(EventEmitter::emitSymbol);
	if (!fireEventValue->IsFunction()) {
		return JNI_FALSE;
	}

	Handle<Object> source;
	if ((jsource == NULL) || (jsource == jEmitter)) {
		source = emitter;
	} else if (sourcePtr != 0) {
		source = Persistent<Object>((Object *) sourcePtr);
	} else {
		source = TypeConverter::javaObjectToJsValue(env, jsource)->ToObject();
	}

	Handle<Function> fireEvent = Handle<Function>::Cast(fireEventValue->ToObject());

	Handle<Object> jsData = TypeConverter::javaHashMapToJsValue(env, data);

	jsData->Set(String::NewSymbol("bubbles"), TypeConverter::javaBooleanToJsBoolean(bubble));

	jsData->Set(String::NewSymbol("source"), source);

	if (reportSuccess || code != 0) {
		jsData->Set(String::NewSymbol("success"), TypeConverter::javaBooleanToJsBoolean(code == 0));
		jsData->Set(String::NewSymbol("code"), TypeConverter::javaIntToJsNumber(code));
	}
	
	if (errorMessage != NULL) {
		jsData->Set(String::NewSymbol("error"), TypeConverter::javaStringToJsString(env, errorMessage));
	}

	Handle<Value> result;
	TryCatch tryCatch;
	Handle<Value> args[] = { jsEvent, jsData };
	result = fireEvent->Call(emitter, 2, args);

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(tryCatch);
		V8Util::reportException(tryCatch);
	} else if (result->IsTrue()) {
		return JNI_TRUE;
	}
	return JNI_FALSE;
}

JNIEXPORT jobject JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeCallProperty
	(JNIEnv* env, jclass clazz, jlong ptr, jstring propertyName, jobjectArray args)
{
	ENTER_V8(V8Runtime::globalContext);
	JNIScope jniScope(env);

	Handle<Value> jsPropertyName = TypeConverter::javaStringToJsString(env, propertyName);
	Persistent<Object> object = Persistent<Object>((Object*) ptr);
	Local<Value> property = object->Get(jsPropertyName);
	if (!property->IsFunction()) {
		return JNIUtil::undefinedObject;
	}

	int argc = 0;
	Handle<Value>* argv = NULL;
	if (args) {
		argv = TypeConverter::javaObjectArrayToJsArguments(args, &argc);
	}

	TryCatch tryCatch;
	Local<Function> function = Local<Function>::Cast(property);
	Local<Value> returnValue = function->Call(object, argc, argv);

	if (argv) {
		delete[] argv;
	}

	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch);
		return JNIUtil::undefinedObject;
	}

	bool isNew;
	return TypeConverter::jsValueToJavaObject(env, returnValue, &isNew);
}

JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeRelease
	(JNIEnv *env, jclass clazz, jlong refPointer)
{
	ENTER_V8(V8Runtime::globalContext);
	JNIScope jniScope(env);

	if (refPointer) {
		Persistent<Object> handle((Object *)refPointer);
		JavaObject *javaObject = NativeObject::Unwrap<JavaObject>(handle);
		if (javaObject && javaObject->isDetached()) {
			delete javaObject;
			return true;
		}
	}

	return false;
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetWindow
	(JNIEnv *env, jobject javaKrollWindow, jlong ptr, jobject javaWindow)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<Object> jsKrollWindow;
	if (ptr != 0) {
		jsKrollWindow = Persistent<Object>((Object *) ptr);
	} else {
		jsKrollWindow = TypeConverter::javaObjectToJsValue(env, javaKrollWindow)->ToObject();
	}

	Handle<Value> setWindowValue = jsKrollWindow->Get(String::New("setWindow"));
	if (!setWindowValue->IsFunction()) {
		return;
	}

	Handle<Function> setWindow = Handle<Function>::Cast(setWindowValue->ToObject());

	Handle<Value> jsWindow = TypeConverter::javaObjectToJsValue(env, javaWindow);

	TryCatch tryCatch;
	if (!jsWindow->IsNull()) {
		Handle<Value> args[] = { jsWindow };
		setWindow->Call(jsKrollWindow, 1, args);
	}

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(tryCatch);
		V8Util::reportException(tryCatch);
	}
}

#ifdef __cplusplus
}
#endif
