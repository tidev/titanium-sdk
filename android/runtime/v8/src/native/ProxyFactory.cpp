/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ProxyFactory.h"

#include <stdio.h>
#include <v8.h>

#include "AndroidUtil.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "KrollBindings.h"
#include "Proxy.h"
#include "TypeConverter.h"
#include "V8Util.h"

#define TAG "ProxyFactory"

using namespace v8;

namespace titanium {

#define LOG_JNIENV_ERROR(msgMore) \
	LOGE(TAG, "Unable to find class %s", msgMore);

Local<Object> ProxyFactory::createV8Proxy(v8::Isolate* isolate, jclass javaClass, jobject javaProxy)
{
	return ProxyFactory::createV8Proxy(isolate, ProxyFactory::getJavaClassName(isolate, javaClass), javaProxy);
}

Local<Object> ProxyFactory::createV8Proxy(v8::Isolate* isolate, Local<Value> className, jobject javaProxy)
{
	LOGD(TAG, "ProxyFactory::createV8Proxy");
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while creating Java proxy.");
		return Local<Object>();
	}

	v8::EscapableHandleScope scope(isolate);

	Local<Object> exports = KrollBindings::getBinding(isolate, className->ToString(isolate));

	if (exports.IsEmpty()) {
		titanium::Utf8Value classStr(className);
		LOGE(TAG, "Failed to find class for %s", *classStr);
		LOG_JNIENV_ERROR("while creating V8 Proxy.");
		return Local<Object>();
	}

	// FIXME: We pick the first item in exports as the constructor. We should do something more intelligent (for ES6 look at default export?)
	Local<Array> names = exports->GetPropertyNames();
	if (names->Length() < 1) {
		titanium::Utf8Value classStr(className);
		LOGE(TAG, "Failed to find class for %s", *classStr);
		LOG_JNIENV_ERROR("while creating V8 Proxy.");
		return Local<Object>();
	}
	Local<Function> creator = exports->Get(names->Get(0)).As<Function>();

	Local<Value> javaObjectExternal = External::New(isolate, javaProxy);
	TryCatch tryCatch(isolate);
	Local<Value> argv[1] = { javaObjectExternal };
	Local<Object> v8Proxy = creator->NewInstance(1, argv);
	if (tryCatch.HasCaught()) {
		LOGE(TAG, "Exception thrown while creating V8 proxy.");
		V8Util::reportException(isolate, tryCatch);
		return Local<Object>();
	}

	// The v8Proxy is a JS Object containing an internal pointer to the Proxy object that wraps it in C++ world.
	titanium::Proxy* proxy = NativeObject::Unwrap<titanium::Proxy>(v8Proxy);
	// We take the address of that C++ Proxy/JavaObject and store it on the Java side to reference when we need to get the proxy or JS object again
	jlong ptr = (jlong) proxy;

	jobject javaV8Object = env->NewObject(JNIUtil::v8ObjectClass, JNIUtil::v8ObjectInitMethod, ptr);

	env->SetObjectField(javaProxy, JNIUtil::krollProxyKrollObjectField, javaV8Object);
	env->DeleteLocalRef(javaV8Object);

	return scope.Escape(v8Proxy);
}

jobject ProxyFactory::createJavaProxy(jclass javaClass, Local<Object> v8Proxy, const v8::FunctionCallbackInfo<v8::Value>& args)
{
	LOGD(TAG, "ProxyFactory::createJavaProxy");
	Isolate* isolate = args.GetIsolate();

	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while creating Java proxy.");
		return NULL;
	}

	// Grab the Proxy pointer from the JSObject that wraps it,
	// pass along the address of the Proxy to use a pointer to get it back later when we deal with this object
	titanium::Proxy* proxy = NativeObject::Unwrap<titanium::Proxy>(v8Proxy); // v8Proxy holds pointer to Proxy object in internal field
	jlong pv8Proxy = (jlong) proxy; // So now we store pointer to the Proxy on Java side.

	// We also pass the creation URL of the proxy so we can track relative URLs
	Local<Value> sourceUrl = args.Callee()->GetScriptOrigin().ResourceName();
	titanium::Utf8Value sourceUrlValue(sourceUrl);

	const char *url = "app://app.js";
	jstring javaSourceUrl = NULL;
	if (sourceUrlValue.length() > 0) {
		url = *sourceUrlValue;
		javaSourceUrl = env->NewStringUTF(url);
	}

	// Determine if this constructor call was made within
	// the createXYZ() wrapper function. This can be tested by checking
	// if an Arguments object was passed as the sole argument.
	bool calledFromCreate = false;
	if (args.Length() == 1 && args[0]->IsObject()) {
		if (V8Util::constructorNameMatches(isolate, args[0].As<Object>(), "Arguments")) {
			calledFromCreate = true;
		}
	}

	// Convert the V8 arguments into Java types so they can be
	// passed to the Java creator method. Which converter we use
	// depends how this constructor was called.
	jobjectArray javaArgs;
	if (calledFromCreate) {
		Local<Object> arguments = args[0]->ToObject(isolate);
		int length = arguments->Get(Proxy::lengthSymbol.Get(isolate))->Int32Value();
		int start = 0;

		// Get the scope variables if provided and extract the source URL.
		// We need to send that to the Java side when creating the proxy.
		if (length > 0) {
			Local<Object> scopeVars = arguments->Get(0)->ToObject(isolate);
			if (V8Util::constructorNameMatches(isolate, scopeVars, "ScopeVars")) {
				Local<Value> sourceUrl = scopeVars->Get(Proxy::sourceUrlSymbol.Get(isolate));
				javaSourceUrl = TypeConverter::jsValueToJavaString(isolate, env, sourceUrl);
				start = 1;
			}
		}

		javaArgs = TypeConverter::jsObjectIndexPropsToJavaArray(isolate, env, arguments, start, length);
	} else {
		javaArgs = TypeConverter::jsArgumentsToJavaArray(env, args);
	}

	// This does: Object javaV8Object = new V8Object(pv8Proxy);
	jobject javaV8Object = env->NewObject(JNIUtil::v8ObjectClass,
		JNIUtil::v8ObjectInitMethod, pv8Proxy);

	// This does: KrollProxy.createProxy(javaClass, javaV8Object, javaArgs, javaSourceUrl);
	// Which creates a new instance of the class using default no-arg constructor,
	// and then calls #setupProxy() with the rest of the args on the instance.
	jobject javaProxy = env->CallStaticObjectMethod(JNIUtil::krollProxyClass,
		JNIUtil::krollProxyCreateProxyMethod, javaClass, javaV8Object, javaArgs, javaSourceUrl);

	if (javaSourceUrl) {
		LOGD(TAG, "delete source url!");
		env->DeleteLocalRef(javaSourceUrl);
	}

	env->DeleteLocalRef(javaV8Object);
	env->DeleteLocalRef(javaArgs);
	// We don't delete the global jclass reference...

	return javaProxy;
}

Local<Value> ProxyFactory::getJavaClassName(v8::Isolate* isolate, jclass javaClass)
{
	LOGD(TAG, "ProxyFactory::getJavaClassName");
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Unable to get JNIEnv while getting Java class name as V8 value.");
		return Local<Value>();
	}

	v8::EscapableHandleScope scope(isolate);

	jstring javaClassName = JNIUtil::getClassName(javaClass);
	Local<Value> className = TypeConverter::javaStringToJsString(isolate, env, javaClassName);
	env->DeleteLocalRef(javaClassName);
	return scope.Escape(className);
}

void ProxyFactory::dispose()
{
	// no-op for now
}

}
