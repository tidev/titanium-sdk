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


class TiViewProxy : public titanium::Proxy
{
public:
	explicit TiViewProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> addClass(const v8::Arguments&);
	static v8::Handle<v8::Value> updateLayout(const v8::Arguments&);
	static v8::Handle<v8::Value> getCenter(const v8::Arguments&);
	static v8::Handle<v8::Value> animate(const v8::Arguments&);
	static v8::Handle<v8::Value> getKeepScreenOn(const v8::Arguments&);
	static v8::Handle<v8::Value> startLayout(const v8::Arguments&);
	static v8::Handle<v8::Value> remove(const v8::Arguments&);
	static v8::Handle<v8::Value> getParent(const v8::Arguments&);
	static v8::Handle<v8::Value> setKeepScreenOn(const v8::Arguments&);
	static v8::Handle<v8::Value> getChildren(const v8::Arguments&);
	static v8::Handle<v8::Value> finishLayout(const v8::Arguments&);
	static v8::Handle<v8::Value> show(const v8::Arguments&);
	static v8::Handle<v8::Value> blur(const v8::Arguments&);
	static v8::Handle<v8::Value> add(const v8::Arguments&);
	static v8::Handle<v8::Value> getHeight(const v8::Arguments&);
	static v8::Handle<v8::Value> hide(const v8::Arguments&);
	static v8::Handle<v8::Value> setHeight(const v8::Arguments&);
	static v8::Handle<v8::Value> convertPointToView(const v8::Arguments&);
	static v8::Handle<v8::Value> toImage(const v8::Arguments&);
	static v8::Handle<v8::Value> getWidth(const v8::Arguments&);
	static v8::Handle<v8::Value> focus(const v8::Arguments&);
	static v8::Handle<v8::Value> setWidth(const v8::Arguments&);
	static v8::Handle<v8::Value> getSize(const v8::Arguments&);
	static v8::Handle<v8::Value> getRect(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_center(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_height(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_height(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_width(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_width(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_parent(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_children(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_keepScreenOn(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_keepScreenOn(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_rect(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_size(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
