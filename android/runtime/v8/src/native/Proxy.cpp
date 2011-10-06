/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <string.h>
#include <v8.h>

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "TypeConverter.h"
#include "V8Util.h"

#define TAG "Proxy"
#define INDEX_NAME 0
#define INDEX_OLD_VALUE 1
#define INDEX_VALUE 2

using namespace v8;

namespace titanium {

Persistent<FunctionTemplate> Proxy::baseProxyTemplate;
Persistent<String> Proxy::javaClassSymbol;
Persistent<String> Proxy::constructorSymbol;
Persistent<String> Proxy::inheritSymbol;
Persistent<String> Proxy::propertiesSymbol;

Proxy::Proxy(jobject javaProxy) :
	JavaObject(javaProxy)
{
}

void Proxy::bindProxy(Handle<Object> exports)
{
	javaClassSymbol = SYMBOL_LITERAL("__javaClass__");
	constructorSymbol = SYMBOL_LITERAL("constructor");
	inheritSymbol = SYMBOL_LITERAL("inherit");
	propertiesSymbol = SYMBOL_LITERAL("_properties");

	Local<FunctionTemplate> proxyTemplate = FunctionTemplate::New();
	Local<String> proxySymbol = String::NewSymbol("Proxy");
	proxyTemplate->InstanceTemplate()->SetInternalFieldCount(kInternalFieldCount);
	proxyTemplate->SetClassName(proxySymbol);
	proxyTemplate->Inherit(EventEmitter::constructorTemplate);

	proxyTemplate->Set(javaClassSymbol, External::Wrap(JNIUtil::krollProxyClass),
		PropertyAttribute(DontDelete | DontEnum));

	DEFINE_PROTOTYPE_METHOD(proxyTemplate, "onPropertiesChanged", proxyOnPropertiesChanged);

	baseProxyTemplate = Persistent<FunctionTemplate>::New(proxyTemplate);

	exports->Set(proxySymbol, proxyTemplate->GetFunction());
}

Handle<Value> Proxy::getProperty(Local<String> property, const AccessorInfo& info)
{
	Local<Object> proxy = info.This();

	// Call getProperty on the Proxy to get the property.
	// We define this method in JavaScript on the Proxy prototype.
	Local<Value> getProperty = proxy->Get(String::New("getProperty"));
	if (!getProperty.IsEmpty() && getProperty->IsFunction()) {
		Local<Value> argv[1] = { property };
		return Handle<Function>::Cast(getProperty)->Call(proxy, 1, argv);
	}

	LOGE(TAG, "Unable to lookup Proxy.prototype.getProperty");
	return Undefined();
}

void Proxy::setProperty(Local<String> property, Local<Value> value, const AccessorInfo& info)
{
	Local<Object> proxy = info.This();

	// Call Proxy.prototype.setProperty.
	Local<Value> setProperty = proxy->Get(String::New("setProperty"));
	if (!setProperty.IsEmpty() && setProperty->IsFunction()) {
		Local<Value> argv[2] = { property, value };
		Handle<Function>::Cast(setProperty)->Call(proxy, 2, argv);
		return;
	}

	LOGE(TAG, "Unable to lookup Proxy.prototype.setProperty");
}

Handle<FunctionTemplate> Proxy::inheritProxyTemplate(
	Handle<FunctionTemplate> superTemplate, jclass javaClass,
	Handle<String> className, Handle<Function> callback)
{
	HandleScope scope;

	Local<Value> wrappedClass = External::Wrap(javaClass);
	Local<FunctionTemplate> inheritedTemplate = FunctionTemplate::New(proxyConstructor, callback);

	inheritedTemplate->Set(javaClassSymbol, wrappedClass, PropertyAttribute(DontDelete | DontEnum));

	inheritedTemplate->InstanceTemplate()->SetInternalFieldCount(kInternalFieldCount);
	inheritedTemplate->SetClassName(className);
	inheritedTemplate->Inherit(superTemplate);

	return scope.Close(inheritedTemplate);
}


Handle<Value> Proxy::proxyConstructor(const Arguments& args)
{
	HandleScope scope;
	JNIEnv *env = JNIScope::getEnv();
	Local<Object> jsProxy = args.Holder();

	Handle<Object> properties = Object::New();
	jsProxy->Set(propertiesSymbol, properties);

	Handle<Object> prototype = jsProxy->GetPrototype()->ToObject();

	Handle<Function> constructor = Handle<Function>::Cast(prototype->Get(constructorSymbol));
	jclass javaClass = (jclass) External::Unwrap(constructor->Get(javaClassSymbol));

	// If ProxyFactory::createV8Proxy invoked us, unwrap
	// the pre-created Java proxy it sent.
	jobject javaProxy = ProxyFactory::unwrapJavaProxy(args);
	bool deleteRef = false;
	if (!javaProxy) {
		javaProxy = ProxyFactory::createJavaProxy(javaClass, jsProxy, args);
		deleteRef = true;
	}

	JNIUtil::logClassName("Create proxy: %s", javaClass);

	Proxy *proxy = new Proxy(javaProxy);
	proxy->Wrap(jsProxy);

	int length = args.Length();

	if (length > 0 && args[0]->IsObject()) {
		Handle<Value> argsStr = V8Util::jsonStringify(args[0]);
		String::Utf8Value str(argsStr);
		LOGV(TAG, "    with args: %s", *str);

		bool extend = true;
		Handle<Object> createProperties = args[0]->ToObject();
		Local<String> constructorName = createProperties->GetConstructorName();
		if (strcmp(*String::Utf8Value(constructorName), "Arguments") == 0) {
			extend = false;
			int32_t argsLength = createProperties->Get(String::New("length"))->Int32Value();
			if (argsLength > 0) {
				Handle<Value> properties = createProperties->Get(0);
				if (properties->IsObject()) {
					extend = true;
					createProperties = properties->ToObject();
				}
			}
		}

		if (extend) {
			V8Util::objectExtend(properties, createProperties);
		}
	}


	if (!args.Data().IsEmpty() && args.Data()->IsFunction()) {
		Handle<Function> proxyFn = Handle<Function>::Cast(args.Data());
		Handle<Value> *fnArgs = new Handle<Value>[length];
		for (int i = 0; i < length; ++i) {
			fnArgs[i] = args[i];
		}
		proxyFn->Call(jsProxy, length, fnArgs);
	}

	if (deleteRef) {
		JNIEnv *env = JNIScope::getEnv();
		if (env) {
			env->DeleteLocalRef(javaProxy);
		}
	}

	return jsProxy;
}

Handle<Value> Proxy::proxyOnPropertiesChanged(const Arguments& args)
{
	HandleScope scope;
	Handle<Object> jsProxy = args.Holder();

	if (args.Length() < 1 || !args[0]->IsArray()) {
		return JSException::Error("Proxy.propertiesChanged requires a list of lists of property name, the old value, and the new value");
	}

	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return JSException::GetJNIEnvironmentError();
	}

	Proxy *proxy = unwrap(jsProxy);
	if (!proxy) {
		return JSException::Error("Failed to unwrap Proxy instance");
	}

	Local<Array> changes = Local<Array>::Cast(args[0]);
	uint32_t length = changes->Length();
	jobjectArray jChanges = env->NewObjectArray(length, JNIUtil::objectClass, NULL);

	for (uint32_t i = 0; i < length; ++i) {
		Local<Array> change = Local<Array>::Cast(changes->Get(i));
		Local<String> name = change->Get(INDEX_NAME)->ToString();
		Local<Value> oldValue = change->Get(INDEX_OLD_VALUE);
		Local<Value> value = change->Get(INDEX_VALUE);

		jobjectArray jChange = env->NewObjectArray(3, JNIUtil::objectClass, NULL);

		jstring jName = TypeConverter::jsStringToJavaString(name);
		env->SetObjectArrayElement(jChange, INDEX_NAME, jName);
		env->DeleteLocalRef(jName);

		bool isNew;
		jobject jOldValue = TypeConverter::jsValueToJavaObject(oldValue, &isNew);
		env->SetObjectArrayElement(jChange, INDEX_OLD_VALUE, jOldValue);
		if (isNew) {
			env->DeleteLocalRef(jOldValue);
		}

		jobject jValue = TypeConverter::jsValueToJavaObject(value, &isNew);
		env->SetObjectArrayElement(jChange, INDEX_VALUE, jValue);
		if (isNew) {
			env->DeleteLocalRef(jValue);
		}

		env->SetObjectArrayElement(jChanges, i, jChange);
		env->DeleteLocalRef(jChange);
	}

	jobject javaProxy = proxy->getJavaObject();

	env->CallVoidMethod(javaProxy, JNIUtil::krollProxyOnPropertiesChangedMethod, jChanges);
	env->DeleteLocalRef(jChanges);

	return Undefined();
}

} // namespace titanium
