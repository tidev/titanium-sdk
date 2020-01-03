/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
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

#define TAG "V8Object"

using namespace titanium;
using namespace v8;

extern "C" {

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeInitObject
	(JNIEnv *env, jclass clazz, jclass proxyClass, jobject proxyObject)
{
	HandleScope scope(V8Runtime::v8_isolate);
	JNIScope jniScope(env);

	ProxyFactory::createV8Proxy(V8Runtime::v8_isolate, proxyClass, proxyObject);
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetProperty
	(JNIEnv *env, jobject object, jlong ptr, jstring name, jobject value)
{
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);

	Local<Object> jsObject;
	if (ptr != 0) {
		titanium::Proxy* proxy = (titanium::Proxy*) ptr;
		jsObject = proxy->handle(V8Runtime::v8_isolate);
	} else {
		LOGE(TAG, "!!! Attempting to set a property on a Java object with no/deleted Proxy on C++ side! Attempting to revive it from Java object.");

		jobject proxySupportField = env->GetObjectField(object, JNIUtil::krollObjectProxySupportField);
		if (!proxySupportField) {
			return;
		}
		static jmethodID getMethodID = NULL;
		if (!getMethodID) {
			getMethodID = env->GetMethodID(env->FindClass("java/lang/ref/WeakReference"), "get", "()Ljava/lang/Object;");
		}
		jobject proxySupport = (jobject)env->CallObjectMethodA(proxySupportField, getMethodID, NULL);
		if (!proxySupport) {
			return;
		}
		jsObject = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, proxySupport).As<Object>();
	}
	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();

	MaybeLocal<Value> maybeProperties = jsObject->Get(context, titanium::Proxy::propertiesSymbol.Get(V8Runtime::v8_isolate));
	if (!maybeProperties.IsEmpty()) {
		Local<Object> properties = maybeProperties.ToLocalChecked().As<Object>();
		Local<Value> jsName = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, name);
		Local<Value> jsValue = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, value);
		jsObject->SetAccessor(context, jsName->ToString(context).FromMaybe(String::Empty(V8Runtime::v8_isolate)), titanium::Proxy::getProperty, titanium::Proxy::onPropertyChanged);
		properties->Set(context, jsName, jsValue);
	}
}


JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeFireEvent
	(JNIEnv *env, jobject jEmitter, jlong ptr, jobject jsource, jlong sourcePtr, jstring event, jobject data, jboolean bubble, jboolean reportSuccess, jint code, jstring errorMessage)
{
	HandleScope scope(V8Runtime::v8_isolate);
	JNIScope jniScope(env);

	Local<Value> jsEvent = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, event);

#ifdef TI_DEBUG
	v8::String::Utf8Value eventName(V8Runtime::v8_isolate, jsEvent);
	LOGV(TAG, "firing event \"%s\"", *eventName);
#endif

	Local<Object> emitter;
	if (ptr != 0) {
		titanium::Proxy* proxy = (titanium::Proxy*) ptr;
		emitter = proxy->handle(V8Runtime::v8_isolate);
	} else {
		emitter = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, jEmitter).As<Object>();
	}

	Local<String> symbol = EventEmitter::emitSymbol.Get(V8Runtime::v8_isolate);
	if (emitter.IsEmpty() || symbol.IsEmpty()) {
		return JNI_FALSE;
	}

	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();
	MaybeLocal<Value> fireEventValue = emitter->Get(context, symbol);
	if (fireEventValue.IsEmpty() || !fireEventValue.ToLocalChecked()->IsFunction()) {
		return JNI_FALSE;
	}

	Local<Object> source;
	if ((jsource == NULL) || (jsource == jEmitter)) {
		source = emitter;
	} else if (sourcePtr != 0) {
		titanium::Proxy* proxy = (titanium::Proxy*) sourcePtr;
		source = proxy->handle(V8Runtime::v8_isolate);
	} else {
		source = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, jsource).As<Object>();
	}

	Local<Function> fireEvent = fireEventValue.ToLocalChecked().As<Function>();

	Local<Object> jsData = TypeConverter::javaHashMapToJsValue(V8Runtime::v8_isolate, env, data);

	jsData->Set(context, NEW_SYMBOL(V8Runtime::v8_isolate, "bubbles"), TypeConverter::javaBooleanToJsBoolean(V8Runtime::v8_isolate, bubble));
	jsData->Set(context, NEW_SYMBOL(V8Runtime::v8_isolate, "source"), source);

	if (reportSuccess || code != 0) {
		jsData->Set(context, NEW_SYMBOL(V8Runtime::v8_isolate, "success"), TypeConverter::javaBooleanToJsBoolean(V8Runtime::v8_isolate, code == 0));
		jsData->Set(context, NEW_SYMBOL(V8Runtime::v8_isolate, "code"), TypeConverter::javaIntToJsNumber(V8Runtime::v8_isolate, code));
	}

	if (errorMessage != NULL) {
		jsData->Set(context, NEW_SYMBOL(V8Runtime::v8_isolate, "error"), TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, errorMessage));
	}

	TryCatch tryCatch(V8Runtime::v8_isolate);
	Local<Value> args[] = { jsEvent, jsData };
	MaybeLocal<Value> result = fireEvent->Call(context, emitter, 2, args);

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch);
		return JNI_FALSE;
	}

	return result.FromMaybe(False(V8Runtime::v8_isolate).As<Value>())->IsTrue() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jobject JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeCallProperty
	(JNIEnv* env, jobject javaObject, jlong ptr, jstring propertyName, jobjectArray args)
{
	HandleScope scope(V8Runtime::v8_isolate);
	JNIScope jniScope(env);

	Local<Value> jsPropertyName = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, propertyName);

	Local<Object> jsObject;
	if (ptr != 0) {
		titanium::Proxy* proxy = (titanium::Proxy*) ptr;
		jsObject = proxy->handle(V8Runtime::v8_isolate);
	} else {
		LOGE(TAG, "!!! Attempting to call a property on a Java object with no/deleted Proxy on C++ side! Attempting to revive it from Java object.");
		jobject proxySupportField = env->GetObjectField(javaObject, JNIUtil::krollObjectProxySupportField);
		if (!proxySupportField) {
			return JNIUtil::undefinedObject;
		}
		static jmethodID getMethodID = NULL;
		if (!getMethodID) {
			getMethodID = env->GetMethodID(env->FindClass("java/lang/ref/WeakReference"), "get", "()Ljava/lang/Object;");
		}
		jobject proxySupport = (jobject)env->CallObjectMethodA(proxySupportField, getMethodID, NULL);
		if (proxySupport) {
			jsObject = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, proxySupport).As<Object>();
		}
	}

	if (jsObject.IsEmpty()) {
		LOGW(TAG, "Unable to get the JSObject representing this Java object, returning undefined.");
		return JNIUtil::undefinedObject;
	}

	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();

	MaybeLocal<Value> property = jsObject->Get(context, jsPropertyName);
	if (property.IsEmpty() || !property.ToLocalChecked()->IsFunction()) {
		return JNIUtil::undefinedObject;
	}

	int argc = 0;
	Local<Value>* argv = NULL;
	if (args) {
		argv = TypeConverter::javaObjectArrayToJsArguments(V8Runtime::v8_isolate, args, &argc);
	}

	TryCatch tryCatch(V8Runtime::v8_isolate);
	Local<Function> function = property.ToLocalChecked().As<Function>();
	MaybeLocal<Value> returnValue = function->Call(context, jsObject, argc, argv);

	if (argv) {
		delete[] argv;
	}

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch);
	} // if exception, object should be empty handle...so returns undefined
	if (returnValue.IsEmpty()) {
		return JNIUtil::undefinedObject;
	}

	bool isNew;
	return TypeConverter::jsValueToJavaObject(V8Runtime::v8_isolate, env, returnValue.ToLocalChecked(), &isNew);
}

JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeRelease
	(JNIEnv *env, jclass clazz, jlong refPointer)
{
	LOGD(TAG, "V8Object::nativeRelease");
	HandleScope scope(V8Runtime::v8_isolate);
	JNIScope jniScope(env);

	if (refPointer) {
		// FIXME What's the right way to cast the long long int as a pointer?
		// Maybe we can move to more correct smart pointer usage?
		// http://stackoverflow.com/questions/26375215/c-shared-ptr-and-java-native-object-ownership
		titanium::Proxy* proxy = (titanium::Proxy*) refPointer;
		if (proxy && proxy->isDetached()) {
			// if the proxy is detached, delete it
			// This means we have already received notification from V8 that the JS side of the proxy can be deleted
			LOGD(TAG, "deleting titanium::Proxy with pointer value: %p", refPointer);
			delete proxy;
			return JNI_TRUE;
		}
	}

	return JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Object_nativeSetWindow
	(JNIEnv *env, jobject javaKrollWindow, jlong ptr, jobject javaWindow)
{
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);
	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();

	Local<Object> jsKrollWindow;
	if (ptr != 0) {
		titanium::Proxy* proxy = (titanium::Proxy*) ptr;
		jsKrollWindow = proxy->handle(V8Runtime::v8_isolate);
	} else {
		jsKrollWindow = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, javaKrollWindow).As<Object>();
	}

	MaybeLocal<Value> setWindowValue = jsKrollWindow->Get(context, STRING_NEW(V8Runtime::v8_isolate, "setWindow"));
	if (setWindowValue.IsEmpty() || !setWindowValue.ToLocalChecked()->IsFunction()) {
		return;
	}

	Local<Function> setWindow = setWindowValue.ToLocalChecked().As<Function>();

	Local<Value> jsWindow = TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, env, javaWindow);

	TryCatch tryCatch(V8Runtime::v8_isolate);
	if (!jsWindow->IsNull()) {
		Local<Value> args[] = { jsWindow };
		setWindow->Call(context, jsKrollWindow, 1, args);
	}

	if (tryCatch.HasCaught()) {
		V8Util::openJSErrorDialog(V8Runtime::v8_isolate, tryCatch);
		V8Util::reportException(V8Runtime::v8_isolate, tryCatch);
	}
}

} // extern "C"
