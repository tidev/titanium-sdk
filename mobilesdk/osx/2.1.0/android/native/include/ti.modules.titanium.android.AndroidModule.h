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


class AndroidModule : public titanium::Proxy
{
public:
	explicit AndroidModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> createServiceIntent(const v8::Arguments&);
	static v8::Handle<v8::Value> stopService(const v8::Arguments&);
	static v8::Handle<v8::Value> startService(const v8::Arguments&);
	static v8::Handle<v8::Value> isServiceRunning(const v8::Arguments&);
	static v8::Handle<v8::Value> createIntentChooser(const v8::Arguments&);
	static v8::Handle<v8::Value> createIntent(const v8::Arguments&);
	static v8::Handle<v8::Value> createService(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_R(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
