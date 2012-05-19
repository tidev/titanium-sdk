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


class ActivityProxy : public titanium::Proxy
{
public:
	explicit ActivityProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> startNextMatchingActivity(const v8::Arguments&);
	static v8::Handle<v8::Value> getDir(const v8::Arguments&);
	static v8::Handle<v8::Value> getWindow(const v8::Arguments&);
	static v8::Handle<v8::Value> startActivityIfNeeded(const v8::Arguments&);
	static v8::Handle<v8::Value> startActivityFromChild(const v8::Arguments&);
	static v8::Handle<v8::Value> setRequestedOrientation(const v8::Arguments&);
	static v8::Handle<v8::Value> finish(const v8::Arguments&);
	static v8::Handle<v8::Value> getIntent(const v8::Arguments&);
	static v8::Handle<v8::Value> startActivityForResult(const v8::Arguments&);
	static v8::Handle<v8::Value> setResult(const v8::Arguments&);
	static v8::Handle<v8::Value> startActivity(const v8::Arguments&);
	static v8::Handle<v8::Value> getString(const v8::Arguments&);
	static v8::Handle<v8::Value> getDecorView(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static void setter_requestedOrientation(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_window(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_intent(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
