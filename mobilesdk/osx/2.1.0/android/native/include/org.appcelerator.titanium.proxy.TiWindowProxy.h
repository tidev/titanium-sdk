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


class TiWindowProxy : public titanium::Proxy
{
public:
	explicit TiWindowProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getOrientationModes(const v8::Arguments&);
	static v8::Handle<v8::Value> getOrientation(const v8::Arguments&);
	static v8::Handle<v8::Value> getTab(const v8::Arguments&);
	static v8::Handle<v8::Value> getTabGroup(const v8::Arguments&);
	static v8::Handle<v8::Value> setTab(const v8::Arguments&);
	static v8::Handle<v8::Value> setLeftNavButton(const v8::Arguments&);
	static v8::Handle<v8::Value> close(const v8::Arguments&);
	static v8::Handle<v8::Value> getActivity(const v8::Arguments&);
	static v8::Handle<v8::Value> open(const v8::Arguments&);
	static v8::Handle<v8::Value> setWindowPixelFormat(const v8::Arguments&);
	static v8::Handle<v8::Value> getWindowPixelFormat(const v8::Arguments&);
	static v8::Handle<v8::Value> setOrientationModes(const v8::Arguments&);
	static v8::Handle<v8::Value> setTabGroup(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static void setter_leftNavButton(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_tab(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_tab(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter__internalActivity(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_tabGroup(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_tabGroup(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

		} // titanium
