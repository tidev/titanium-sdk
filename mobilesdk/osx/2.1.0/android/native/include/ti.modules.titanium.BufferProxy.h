/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/** This is generated, do not edit by hand. **/

#include <jni.h>

#include "Proxy.h"

		namespace titanium {


class BufferProxy : public titanium::Proxy
{
public:
	explicit BufferProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> clear(const v8::Arguments&);
	static v8::Handle<v8::Value> append(const v8::Arguments&);
	static v8::Handle<v8::Value> clone(const v8::Arguments&);
	static v8::Handle<v8::Value> fill(const v8::Arguments&);
	static v8::Handle<v8::Value> toString(const v8::Arguments&);
	static v8::Handle<v8::Value> toBlob(const v8::Arguments&);
	static v8::Handle<v8::Value> getLength(const v8::Arguments&);
	static v8::Handle<v8::Value> insert(const v8::Arguments&);
	static v8::Handle<v8::Value> setLength(const v8::Arguments&);
	static v8::Handle<v8::Value> release(const v8::Arguments&);
	static v8::Handle<v8::Value> copy(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_length(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_length(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

		} // titanium
