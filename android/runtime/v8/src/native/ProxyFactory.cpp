/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ProxyFactory.h"

#include <map>
#include <v8.h>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "ModuleFactory.h"
#include "TypeConverter.h"

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
	info = i != factories.end() ? &i->second : NULL;

#define LOG_JNIENV_ERROR(msgMore) \
	LOGE(TAG, "Unable to find class %s", msgMore)

Handle<Object> ProxyFactory::createV8Proxy(jclass javaClass, jobject javaProxy)
{
	ProxyInfo* info;
	GET_PROXY_INFO(javaClass, info)
	if (!info) {
		JNIUtil::logClassName("ProxyFactory: failed to find class for %s", javaClass, true);
		LOG_JNIENV_ERROR("while creating V8 Proxy.");
		return Handle<Object>();
	}

	HandleScope scope;

	Local<Function> creator = info->v8ProxyTemplate->GetFunction();
	Local<Value> external = External::New(javaProxy);
	Local<Object> v8Proxy = creator->NewInstance(1, &external);

	// set the pointer back on the java proxy
	jlong ptr = (jlong) *Persistent<Object>::New(v8Proxy);
	JNIScope::getEnv()->SetLongField(javaProxy, JNIUtil::managedV8ReferencePtrField, ptr);

	return scope.Close(v8Proxy);
}

jobject ProxyFactory::createJavaProxy(jclass javaClass, Local<Object> v8Proxy, const Arguments& args)
{
	ProxyInfo* info;
	GET_PROXY_INFO(javaClass, info)
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
	jlong pv8Proxy = (jlong) *Persistent<Object>::New(v8Proxy);

	// We also pass the creation URL of the proxy so we can track relative URLs
	Handle<Value> sourceUrl = args.Callee()->GetScriptOrigin().ResourceName();
	String::Utf8Value sourceUrlValue(sourceUrl);

	const char *url = "app://app.js";
	if (sourceUrlValue.length() > 0) {
		url = *sourceUrlValue;
	}

	jstring javaSourceUrl = env->NewStringUTF(url);

	// Convert the V8 arguments into Java types so they can be
	// passed to the Java creator method.
	jobjectArray javaArgs = TypeConverter::jsArgumentsToJavaArray(args);

	// Create the java proxy using the creator static method provided.
	// Send along a pointer to the v8 proxy so the two are linked.
	LOGD(TAG, "calling create for java proxy");
	jobject javaProxy = env->CallStaticObjectMethod(JNIUtil::krollProxyClass,
		info->javaProxyCreator, javaClass, javaArgs, pv8Proxy, javaSourceUrl);
	env->DeleteLocalRef(javaArgs);

	return javaProxy;
}

jobject ProxyFactory::unwrapJavaProxy(const Arguments& args)
{
	LOGD(TAG, "unwrap Java Proxy, args len=%d", args.Length());

	if (args.Length() != 1)
		return NULL;
	Local<Value> firstArgument = args[0];
	return firstArgument->IsExternal() ? (jobject)External::Unwrap(firstArgument) : NULL;
}

void ProxyFactory::registerProxyPair(jclass javaProxyClass, FunctionTemplate* v8ProxyTemplate)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while registering proxy pair.");
		return;
	}

	ProxyInfo info;
	info.v8ProxyTemplate = v8ProxyTemplate;
	info.javaProxyCreator = JNIUtil::krollProxyCreateMethod;

	factories[javaProxyClass] = info;
}

Handle<Value> ProxyFactory::proxyPropertyGetter(Local<String> property, const AccessorInfo& info)
{
	HandleScope scope;

	Local<Object> proxy = info.This();
	Local<Object> propertyCache = proxy->GetInternalField(kPropertyCache)->ToObject();

	if (propertyCache->Has(property)) {
		Local<Object> value = propertyCache->Get(property)->ToObject();
		proxy->ForceSet(property, value);
		return value;
	}

	Local<String> tiNamespace = proxy->GetInternalField(kTiNamespace)->ToString();
	if (tiNamespace->Length() == 0) {
		return Undefined();
	}

	Local<String> apiName = String::Concat(tiNamespace, String::New("."));
	apiName = String::Concat(apiName, property);

	String::Utf8Value fullAPI(apiName);
	Handle<Object> exports;
	LOGD(TAG, "Looking up %s", *fullAPI);

	if (ModuleFactory::hasModule(*fullAPI)) {
		exports = Object::New();
		ModuleFactory::initModule(*fullAPI, exports);
	} else {
		LOGW(TAG, "Titanium.%s does not exist", *fullAPI);
		return Undefined();
	}

	Local<Array> keys = exports->GetPropertyNames();
	for (unsigned int i = 0; i < keys->Length(); ++i) {
		Handle<String> key = keys->Get(Integer::New(i))->ToString();
		String::Utf8Value keyValue(key);
		LOGD(TAG, "Initialized Titanium.%s", *keyValue);
		Handle<Value> value = exports->Get(key);
		if (value == exports) {
			value = proxy;
		}
		propertyCache->Set(key, value);
		proxy->ForceSet(key, value);
	}

	return scope.Close(exports->Get(property));
}

}

