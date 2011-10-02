/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef PROXY_H
#define PROXY_H

#include <jni.h>
#include <v8.h>

#include "JavaObject.h"

namespace titanium {

class Proxy : public JavaObject
{
public:
	enum {
		kJavaObject = 0,
		kJavaClass,
		kPropertyCache,
		kInternalFieldCount
	};

	static v8::Persistent<v8::FunctionTemplate> baseProxyTemplate;
	static v8::Persistent<v8::String> javaClassSymbol, constructorSymbol;
	static v8::Persistent<v8::String> inheritSymbol, propertiesSymbol;

	Proxy(jobject javaProxy);

	// Initialize the base proxy template
	static void bindProxy(v8::Handle<v8::Object> exports);

	// This provides Javascript a way to extend one of our native / wrapped
	// templates without needing to know about the internal java class.
	//
	// An example of what this might look like from JS:
	// var MyProxy = Ti.UI.View.inherit(function MyView(options) {
	//     // constructor code goes here.. (optional)
	// });
	template<typename ProxyClass>
	static v8::Handle<v8::Value> inherit(const v8::Arguments& args)
	{
		v8::HandleScope scope;
		v8::Handle<v8::Function> fn = v8::Handle<v8::Function>::Cast(args[0]);

		v8::Handle<v8::FunctionTemplate> newType = inheritProxyTemplate(
			ProxyClass::proxyTemplate,
			ProxyClass::javaClass,
			fn->GetName()->ToString(), fn);
		return newType->GetFunction();
	}

	// Inherit a built-in proxy template for use in Javascript (used by generated code)
	static v8::Handle<v8::FunctionTemplate> inheritProxyTemplate(
		v8::Handle<v8::FunctionTemplate> superTemplate,
		jclass javaClass,
		v8::Handle<v8::String> className,
		v8::Handle<v8::Function> callback = v8::Handle<v8::Function>());

	static inline Proxy* unwrap(v8::Handle<v8::Object> value)
	{
		if (!JavaObject::isJavaObject(value)) {
			return NULL;
		}

		void *ptr = value->GetPointerFromInternalField(0);
		if (!ptr) {
			return NULL;
		}

		return static_cast<Proxy*>(ptr);
	}

private:
	static v8::Handle<v8::Value> proxyConstructor(const v8::Arguments& args);
	static v8::Handle<v8::Value> proxyOnPropertiesChanged(const v8::Arguments& args);
};

}

#endif
