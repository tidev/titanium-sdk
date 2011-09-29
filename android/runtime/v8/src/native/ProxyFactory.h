/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef PROXY_FACTORY_H
#define PROXY_FACTORY_H

#include <jni.h>
#include <v8.h>

namespace titanium {

// Titanium is split accross two runtime environments: Java and V8.
// Code must be exposed on both sides of the "bridge". To accomplish this
// we create "proxy" objects on both sides.
//
//   V8 Proxy  <----> [V8-JNI bridge] <--> Java Proxy
//
// This factory helps in the construction of this proxy pair.
// The creation can be started on either the V8 or Java sides.
// Two "create" function are provided for both cases.
class ProxyFactory
{
public:
	enum {
		kJavaObject = 0,
		kTiNamespace,
		kPropertyCache,
		kInternalFieldCount
	};

	// Creates a proxy on the V8 side given an existing Java proxy.
	static v8::Handle<v8::Object> createV8Proxy(jclass javaClass, jobject javaProxy);

	// Creates a proxy on the Java side given an existing V8 proxy.
	static jobject createJavaProxy(jclass javaClass, v8::Local<v8::Object> v8Proxy, const v8::Arguments& args);

	// Used by createV8Proxy() which invokes the ProxyBinding::Constructor
	// callback to create a new V8 object. We need a way to pass the Java proxy
	// jobject. This is done by passing it as an External value argument.
	static jobject unwrapJavaProxy(const v8::Arguments& args);

	// Setup a new proxy pair for some Kroll type.
	static void registerProxyPair(jclass javaProxyClass, v8::FunctionTemplate* factory);

	// The generic constructor for all proxies
	static v8::Handle<v8::Value> proxyConstructor(const v8::Arguments& args);

	// Inherit a built-in proxy template for use in Javascript (convenience for custom extensions)
	template<typename ProxyClass> inline
	static v8::Handle<v8::FunctionTemplate> inheritProxyTemplate(const char *className)
	{
		return inheritProxyTemplate(ProxyClass::proxyTemplate, ProxyClass::javaClass, className);
	}

	// Inherit a built-in proxy template for use in Javascript (used by generated code)
	static v8::Handle<v8::FunctionTemplate> inheritProxyTemplate(v8::Persistent<v8::FunctionTemplate> superTemplate, jclass javaClass, const char *className);
};

}

#endif
