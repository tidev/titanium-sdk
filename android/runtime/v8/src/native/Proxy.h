/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef PROXY_H
#define PROXY_H

#include <jni.h>
#include <v8.h>

#include "JavaObject.h"

namespace titanium {

// The base class for all Titanium proxy objects.
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
	static void bindProxy(v8::Local<v8::Object> exports, Local<Context> context);

	// Query the property value from the internal property map.
	// Proxies that have only setters in Java store the value
	// on the JavaScript side in this map. This getter is then
	// used when the user script requests the value.
	static void getProperty(v8::Local<v8::Name> name, const v8::PropertyCallbackInfo<v8::Value>& args);
	static void getProperty(const v8::FunctionCallbackInfo<v8::Value>& args);

	// Stores the new value for the property into the internal map.
	static void setProperty(v8::Local<v8::Name> name,
                    		v8::Local<v8::Value> value,
                    		const v8::PropertyCallbackInfo<void>& info);

	// Setter that reports to the Java proxy when a property has changed.
	// Used by proxies that use accessor based properties.
	static void onPropertyChanged(v8::Local<v8::Name> name,
                    			  v8::Local<v8::Value> value,
                    			  const v8::PropertyCallbackInfo<void>& info);
	static void onPropertyChanged(const v8::FunctionCallbackInfo<v8::Value>& args);

	// Fetches an indexed property value from the Java proxy.
	static void getIndexedProperty(uint32_t index,
	                                                const v8::PropertyCallbackInfo<v8::Value>& info);

	// Sets an indexed property on the Java proxy.
	static void setIndexedProperty(uint32_t index,
	                                                v8::Local<v8::Value> value,
	                                                const v8::PropertyCallbackInfo<v8::Value>& info);

	// Called by EventEmitter to notify when listeners
	// are watching for a type of event. Notifies the Java proxy when this changes.
	static void hasListenersForEventType(const v8::FunctionCallbackInfo<v8::Value>& args);

	// Called by EventEmitter when we fire events from JS to Java
	static void onEventFired(const v8::FunctionCallbackInfo<v8::Value>& args);

	// This provides Javascript a way to extend one of our native / wrapped
	// templates without needing to know about the internal java class.
	//
	// An example of what this might look like from JS:
	// var MyProxy = Ti.UI.View.inherit(function MyView(options) {
	//     // constructor code goes here.. (optional)
	// });
	template<typename ProxyClass>
	static void inherit(const v8::FunctionCallbackInfo<v8::Value>& args)
	{
		v8::Isolate* isolate = args.GetIsolate();
		v8::HandleScope scope(isolate);
		v8::Local<v8::Function> fn = args[0].As<v8::Function>();

		v8::Local<v8::FunctionTemplate> newType = inheritProxyTemplate(
			isolate,
			ProxyClass::getProxyTemplate(isolate),
			ProxyClass::javaClass,
			fn->GetName()->ToString(), fn);
		args.GetReturnValue().Set(newType->GetFunction());
	}

	// Inherit a built-in proxy template for use in Javascript (used by generated code)
	static v8::Local<v8::FunctionTemplate> inheritProxyTemplate(
		v8::Isolate* isolate,
		v8::Local<v8::FunctionTemplate> superTemplate,
		jclass javaClass,
		v8::Local<v8::String> className,
		v8::Local<v8::Function> callback = v8::Local<v8::Function>());

	static inline Proxy* unwrap(v8::Local<v8::Object> value)
	{
		if (!JavaObject::isJavaObject(value)) {
			return NULL;
		}

		void *ptr = value->GetAlignedPointerFromInternalField(0);
		if (!ptr) {
			return NULL;
		}

		return static_cast<Proxy*>(ptr);
	}

	static void dispose();

private:
	static void proxyConstructor(const v8::FunctionCallbackInfo<v8::Value>& args);
	static void proxyOnPropertiesChanged(const v8::FunctionCallbackInfo<v8::Value>& args);
};

}

#endif
