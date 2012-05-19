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
			namespace app {


class PropertiesModule : public titanium::Proxy
{
public:
	explicit PropertiesModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> hasProperty(const v8::Arguments&);
	static v8::Handle<v8::Value> setDouble(const v8::Arguments&);
	static v8::Handle<v8::Value> getDouble(const v8::Arguments&);
	static v8::Handle<v8::Value> getInt(const v8::Arguments&);
	static v8::Handle<v8::Value> setBool(const v8::Arguments&);
	static v8::Handle<v8::Value> setString(const v8::Arguments&);
	static v8::Handle<v8::Value> setInt(const v8::Arguments&);
	static v8::Handle<v8::Value> listProperties(const v8::Arguments&);
	static v8::Handle<v8::Value> getBool(const v8::Arguments&);
	static v8::Handle<v8::Value> getString(const v8::Arguments&);
	static v8::Handle<v8::Value> removeProperty(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------

};

			} // namespace app
		} // titanium
