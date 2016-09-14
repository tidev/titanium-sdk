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

	/**
	 * Initialize the base proxy template
	 * @param exports The module exports object to hang types/methods off of.
	 * @param context The context to use.
	 */
	static void bindProxy(v8::Local<v8::Object> exports, Local<Context> context);

	/**
	 * Query the property value from the internal property map ("_properties").
	 * Proxies that have only setters in Java store the value
	 * on the JavaScript side in this map. This getter is then
	 * used when the user script requests the value.
	 * See #proxyConstructor for creation of "_properties"
	 *
	 * @param name property name
	 * @param info property callback info used to return the value
	 */
	static void getProperty(v8::Local<v8::Name> name, const v8::PropertyCallbackInfo<v8::Value>& info);
	// Used when the property is called as a function
	static void getProperty(const v8::FunctionCallbackInfo<v8::Value>& info);

	/**
	 * Stores the new value for the property into the internal map ("_properties").
	 * See #proxyConstructor for creation of "_properties"
	 *
	 * @param name  property name
	 * @param value new value
	 * @param info  property setter callback info
	 */
	static void setProperty(v8::Local<v8::Name> name,
                    		v8::Local<v8::Value> value,
                    		const v8::PropertyCallbackInfo<void>& info);

	/**
	 * Setter that reports to the Java proxy when a property has changed.
	 * Used by proxies that use accessor based properties.
	 *
	 * @param name  property name
	 * @param value new value
	 * @param info  [description]
	 */
	static void onPropertyChanged(v8::Local<v8::Name> name,
                    			  v8::Local<v8::Value> value,
                    			  const v8::PropertyCallbackInfo<void>& info);
	// Used when called as a function
	static void onPropertyChanged(const v8::FunctionCallbackInfo<v8::Value>& args);

	/**
	 * Fetches an indexed property value from the Java proxy.
	 *
	 * @param index [description]
	 * @param info  [description]
	 */
	static void getIndexedProperty(uint32_t index,
	                               const v8::PropertyCallbackInfo<v8::Value>& info);

	/**
	 * Sets an indexed property on the Java proxy.
	 *
	 * @param index index of the property to set
	 * @param value new value
	 * @param info  property callback info
	 */
	static void setIndexedProperty(uint32_t index,
	                               v8::Local<v8::Value> value,
	                               const v8::PropertyCallbackInfo<v8::Value>& info);

	/**
	 * Called by EventEmitter to notify when listeners
	 * are watching for a type of event. Notifies the Java proxy when this changes.
	 * @param args [description]
	 */
	static void hasListenersForEventType(const v8::FunctionCallbackInfo<v8::Value>& args);

	/**
	 * Called by EventEmitter when we fire events from JS to Java
	 *
	 * @param args [description]
	 */
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
			fn->GetName()->ToString(isolate), fn);
		args.GetReturnValue().Set(newType->GetFunction());
	}

	/**
	 * Inherit a built-in proxy template for use in Javascript (used by generated code)
	 */
	static v8::Local<v8::FunctionTemplate> inheritProxyTemplate(
		v8::Isolate* isolate,
		v8::Local<v8::FunctionTemplate> superTemplate,
		jclass javaClass,
		v8::Local<v8::String> className,
		v8::Local<v8::Function> callback = v8::Local<v8::Function>());

	/**
	 * Unwraps the Proxy inside a JS object.
	 *
	 * @param  value JS object to unwrap
	 * @return       the Proxy used with the JS object. NULL if not wrapping a Proxy.
	 */
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

	static void dispose(v8::Isolate* isolate);

private:

	/**
	 * This is the callback used whne we need to construct a native Proxy for a JS object.
	 * Here we typically:
	 * - wrap the js object in a Proxy instance
	 * - define an own property "_properties" used for #getProperty and #setProperty callbacks
	 * -
	 * - look up the prototype of the JS object, grab the constructor, then ask for the __javaClass__ property.
	 *   (See #javaClassPropertyCallback below) to get the jclass we need to instantiate
	 * - attach the Java Proxy instantiated to this native Proxy.
	 * - Deal with argunents passed
	 * - If using the inherit function, look for that hanging as the Data() of args and invoke it.
	 *
	 * @param args The constructor arguments.
	 */
	static void proxyConstructor(const v8::FunctionCallbackInfo<v8::Value>& args);

	/**
	 * Callback to propagate property changes up to the Java object from #setPropertiesAndFire called in JS.
	 *
	 * @param args The function arguments.
	 */
	static void proxyOnPropertiesChanged(const v8::FunctionCallbackInfo<v8::Value>& args);

	/**
	 * This is a hack to workaround V8 API changes. We used to store a jclass
	 * wrapped in an External on the proxy's template. V8 changed to only allow
	 * Templates and Primitives (number, string, etc) via ->Set() on a Template.
	 * So we couldn't hang an External there anymore. Now we set it via #SetNativeDataProperty
	 * so that we always use the native getter callback method here, and we cheat
	 * and set the External wrapping the jclass as the "data" for the callback.
	 * So we just grab the data (External wrapping a jclass) and return it.
	 *
	 * @param property The name of the property (Should always be "__javaClass__")
	 * @param info     The property callback info object to manipulate to return our value
	 */
	static void javaClassPropertyCallback(v8::Local<v8::String> property, const v8::PropertyCallbackInfo<v8::Value>& info);
};

}

#endif
