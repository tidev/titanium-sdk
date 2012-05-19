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


class MenuProxy : public titanium::Proxy
{
public:
	explicit MenuProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> setGroupCheckable(const v8::Arguments&);
	static v8::Handle<v8::Value> setGroupEnabled(const v8::Arguments&);
	static v8::Handle<v8::Value> removeItem(const v8::Arguments&);
	static v8::Handle<v8::Value> removeGroup(const v8::Arguments&);
	static v8::Handle<v8::Value> add(const v8::Arguments&);
	static v8::Handle<v8::Value> size(const v8::Arguments&);
	static v8::Handle<v8::Value> close(const v8::Arguments&);
	static v8::Handle<v8::Value> clear(const v8::Arguments&);
	static v8::Handle<v8::Value> hasVisibleItems(const v8::Arguments&);
	static v8::Handle<v8::Value> getItem(const v8::Arguments&);
	static v8::Handle<v8::Value> getItems(const v8::Arguments&);
	static v8::Handle<v8::Value> findItem(const v8::Arguments&);
	static v8::Handle<v8::Value> setGroupVisible(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_items(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
