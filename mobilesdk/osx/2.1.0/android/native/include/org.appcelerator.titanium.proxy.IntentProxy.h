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


class IntentProxy : public titanium::Proxy
{
public:
	explicit IntentProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getStringExtra(const v8::Arguments&);
	static v8::Handle<v8::Value> putExtra(const v8::Arguments&);
	static v8::Handle<v8::Value> setFlags(const v8::Arguments&);
	static v8::Handle<v8::Value> setType(const v8::Arguments&);
	static v8::Handle<v8::Value> hasExtra(const v8::Arguments&);
	static v8::Handle<v8::Value> addFlags(const v8::Arguments&);
	static v8::Handle<v8::Value> putExtraUri(const v8::Arguments&);
	static v8::Handle<v8::Value> getBlobExtra(const v8::Arguments&);
	static v8::Handle<v8::Value> getAction(const v8::Arguments&);
	static v8::Handle<v8::Value> getFlags(const v8::Arguments&);
	static v8::Handle<v8::Value> getLongExtra(const v8::Arguments&);
	static v8::Handle<v8::Value> getType(const v8::Arguments&);
	static v8::Handle<v8::Value> getBooleanExtra(const v8::Arguments&);
	static v8::Handle<v8::Value> addCategory(const v8::Arguments&);
	static v8::Handle<v8::Value> getDoubleExtra(const v8::Arguments&);
	static v8::Handle<v8::Value> getData(const v8::Arguments&);
	static v8::Handle<v8::Value> setAction(const v8::Arguments&);
	static v8::Handle<v8::Value> getIntExtra(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_flags(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_flags(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_data(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_action(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_action(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_type(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_type(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

		} // titanium
