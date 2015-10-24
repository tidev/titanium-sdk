/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ProxyFactory.h"

#include <map>
#include <stdio.h>
#include <v8.h>

#include "AndroidUtil.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "KrollBindings.h"
#include "Proxy.h"
#include "TypeConverter.h"
#include "V8Runtime.h"
#include "V8Util.h"

#define TAG "ProxyFactory"

using namespace v8;

namespace titanium {

typedef struct {
	FunctionTemplate* v8ProxyTemplate;
	jmethodID javaProxyCreator;
} ProxyInfo;

typedef std::map<jclass, ProxyInfo> ProxyFactoryMap;
static ProxyFactoryMap factories;

#define GET_PROXY_INFO(jclass, info) \
	ProxyFactoryMap::iterator i = factories.find(jclass); \
	info = i != factories.end() ? &i->second : NULL

#define LOG_JNIENV_ERROR(msgMore) \
	LOGE(TAG, "Unable to find class %s", msgMore)

Local<Object> ProxyFactory::createV8Proxy(v8::Isolate* isolate, jclass javaClass, jobject javaProxy)
{
	LOGV(TAG, "create v8 proxy");
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while creating Java proxy.");
		return Local<Object>();
	}

	v8::EscapableHandleScope scope(isolate);
	Local<Function> creator;

	LOGV(TAG, "get proxy info");

	ProxyInfo* info;
	GET_PROXY_INFO(javaClass, info);
	if (!info) {
		// No info has been registered for this class yet, fall back
		// to the binding lookup table
		jstring javaClassName = JNIUtil::getClassName(javaClass);
		Local<Value> className = TypeConverter::javaStringToJsString(isolate, env, javaClassName);
		env->DeleteLocalRef(javaClassName);

		Local<Object> exports = KrollBindings::getBinding(isolate, className->ToString(isolate));

		if (exports.IsEmpty()) {
			titanium::Utf8Value classStr(className);
			LOGE(TAG, "Failed to find class for %s", *classStr);
			LOG_JNIENV_ERROR("while creating V8 Proxy.");
			return scope.Escape(Local<Object>());
		}

		// TODO: The first value in exports should be the type that's exported
		// But there's probably a better way to do this
		Local<Array> names = exports->GetPropertyNames();
		if (names->Length() >= 1) {
			creator = exports->Get(names->Get(0)).As<Function>();
		}
	} else {
		creator = info->v8ProxyTemplate->GetFunction(isolate->GetCurrentContext()).ToLocalChecked();
	}

	Local<Value> external = External::New(isolate, javaProxy);
	TryCatch tryCatch(isolate);
	Local<Value> argv[1] = { external };
	Local<Object> v8Proxy = creator->NewInstance(1, argv);
	if (tryCatch.HasCaught()) {
		LOGE(TAG, "Exception thrown while creating V8 proxy.");
		V8Util::reportException(isolate, tryCatch);
		return scope.Escape(Local<Object>());
	}

	// set the pointer back on the java proxy
	Proxy* proxy = NativeObject::Unwrap<Proxy>(v8Proxy);
	jlong ptr = (jlong) &(proxy->persistent());

	jobject javaV8Object = env->NewObject(JNIUtil::v8ObjectClass,
		JNIUtil::v8ObjectInitMethod, ptr);

	env->SetObjectField(javaProxy,
		JNIUtil::krollProxyKrollObjectField, javaV8Object);
	env->DeleteLocalRef(javaV8Object);

	return scope.Escape(v8Proxy);
}

jobject ProxyFactory::createJavaProxy(jclass javaClass, Local<Object> v8Proxy, const v8::FunctionCallbackInfo<v8::Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	ProxyInfo* info;
	GET_PROXY_INFO(javaClass, info);

	if (!info) {
		JNIUtil::logClassName("ProxyFactory: failed to find class for %s", javaClass, true);
		LOGE(TAG, "No proxy info found for class.");
		return NULL;
	}

	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while creating Java proxy.");
		return NULL;
	}

	// Create a persistent handle to the V8 proxy
	// and cast it to a pointer. The Java proxy needs
	// a reference to the V8 proxy for later use.
	Proxy* proxy = NativeObject::Unwrap<Proxy>(v8Proxy); // v8Proxy holds Proxy object in internal field
	jlong pv8Proxy = (jlong) &(proxy->persistent()); // proxy has a persistent holding the v8Proxy.
	// So we're getting address of the persistent which holds v8Proxy here...

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

	jobject javaV8Object = env->NewObject(JNIUtil::v8ObjectClass,
		JNIUtil::v8ObjectInitMethod, pv8Proxy);

	// Create the java proxy using the creator static method provided.
	// Send along a pointer to the v8 proxy so the two are linked.
	jobject javaProxy = env->CallStaticObjectMethod(JNIUtil::krollProxyClass,
		info->javaProxyCreator, javaClass, javaV8Object, javaArgs, javaSourceUrl);

	if (javaSourceUrl) {
		LOGV(TAG, "delete source url!");
		env->DeleteLocalRef(javaSourceUrl);
	}

	env->DeleteLocalRef(javaV8Object);
	env->DeleteLocalRef(javaArgs);

	return javaProxy;
}

jobject ProxyFactory::unwrapJavaProxy(const v8::FunctionCallbackInfo<v8::Value>& args)
{
	if (args.Length() != 1)
		return NULL;

	Local<Value> firstArgument = args[0];
	return firstArgument->IsExternal() ? (jobject) (firstArgument.As<External>()->Value()) : NULL;
}

void ProxyFactory::registerProxyPair(jclass javaProxyClass, FunctionTemplate* v8ProxyTemplate, bool createDeprecated)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while registering proxy pair.");
		return;
	}

	ProxyInfo info;
	info.v8ProxyTemplate = v8ProxyTemplate;

	if (createDeprecated) {
		info.javaProxyCreator = JNIUtil::krollProxyCreateDeprecatedProxyMethod;
	} else {
		info.javaProxyCreator = JNIUtil::krollProxyCreateProxyMethod;
	}

	factories[javaProxyClass] = info;
}

void ProxyFactory::dispose()
{
	factories.clear();
}

}
