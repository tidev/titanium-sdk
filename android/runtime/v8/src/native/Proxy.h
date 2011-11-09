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
	static v8::Persistent<v8::String> lengthSymbol, sourceUrlSymbol;

	Proxy(jobject javaProxy);

	// Initialize the base proxy template
	static void bindProxy(v8::Handle<v8::Object> exports);

	// Query the property value from the internal property map.
	// Proxies that have only setters in Java store the value
	// on the JavaScript side in this map. This getter is then
	// used when the user script requests the value.
	static v8::Handle<v8::Value> getProperty(v8::Local<v8::String> property,
											 const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getProperty(const v8::Arguments& args);

	// Stores the new value for the property into the internal map.
	static void setProperty(v8::Local<v8::String> property,
							v8::Local<v8::Value> value,
							const v8::AccessorInfo& info);

	// Setter that reports to the Java proxy when a property has changed.
	// Used by proxies that use accessor based properties.
	static void onPropertyChanged(v8::Local<v8::String> property,
	                              v8::Local<v8::Value> value,
	                              const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> onPropertyChanged(const v8::Arguments& args);

	// Fetches an indexed property value from the Java proxy.
	static v8::Handle<v8::Value> getIndexedProperty(uint32_t index,
	                                                const v8::AccessorInfo& info);

	// Sets an indexed property on the Java proxy.
	static v8::Handle<v8::Value>  setIndexedProperty(uint32_t index,
	                                                v8::Local<v8::Value> value,
	                                                const v8::AccessorInfo& info);

	// Called by EventEmitter to notify when listeners
	// are watching for a type of event. Notfies the Java proxy when this changes.
	static v8::Handle<v8::Value> hasListenersForEventType(const v8::Arguments& args);

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
