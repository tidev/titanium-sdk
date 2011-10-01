/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <v8.h>

#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "V8Util.h"

using namespace v8;

namespace titanium {

Persistent<FunctionTemplate> Proxy::baseProxyTemplate;
Persistent<String> Proxy::javaClassSymbol;
Persistent<String> Proxy::constructorSymbol;
Persistent<String> Proxy::inheritSymbol;

Proxy::Proxy(jobject javaProxy) :
	JavaObject(javaProxy)
{
}

void Proxy::forceExtend(Handle<Object> properties)
{
	HandleScope scope;

	Handle<Array> names = properties->GetOwnPropertyNames();
	int length = names->Length();

	for (int i = 0; i < length; ++i) {
		Handle<Value> name = names->Get(i);

		// We want to skip any API bindings for dynamic properties, so we use ForceSet
		handle_->ForceSet(name, properties->Get(name));
	}
}

void Proxy::initProxyTemplate(Handle<Object> exports)
{
	javaClassSymbol = SYMBOL_LITERAL("__javaClass__");
	constructorSymbol = SYMBOL_LITERAL("constructor");
	inheritSymbol = SYMBOL_LITERAL("inherit");

	Local<FunctionTemplate> proxyTemplate = FunctionTemplate::New();
	Local<String> proxySymbol = String::NewSymbol("Proxy");
	proxyTemplate->InstanceTemplate()->SetInternalFieldCount(kInternalFieldCount);
	proxyTemplate->SetClassName(proxySymbol);
	proxyTemplate->Inherit(EventEmitter::constructorTemplate);

	proxyTemplate->Set(javaClassSymbol, External::Wrap(JNIUtil::krollProxyClass),
		PropertyAttribute(DontDelete | DontEnum));

	DEFINE_PROTOTYPE_METHOD(proxyTemplate, "forceExtend", proxyForceExtend);

	baseProxyTemplate = Persistent<FunctionTemplate>::New(proxyTemplate);

	exports->Set(proxySymbol, proxyTemplate->GetFunction());
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
	Local<Object> jsProxy = args.Holder();

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

	Proxy* proxy = new Proxy(javaProxy);
	proxy->Wrap(jsProxy);

	int length = args.Length();
	if (length > 0 && args[0]->IsObject()) {
		proxy->forceExtend(args[0]->ToObject());
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

Handle<Value> Proxy::proxyForceExtend(const Arguments& args)
{
	HandleScope scope;
	Handle<Object> jsProxy = args.Holder();

	if (args.Length() == 0 || !args[0]->IsObject()) {
		// fail silently, we don't care if this is undefined / not an object
		return jsProxy;
	}

	Proxy *proxy = unwrap(jsProxy);
	if (proxy) {
		proxy->forceExtend(args[0]->ToObject());
	}

	return jsProxy;
}

} // namespace titanium
