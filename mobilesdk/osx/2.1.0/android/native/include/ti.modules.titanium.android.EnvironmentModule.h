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
			namespace android {


class EnvironmentModule : public titanium::Proxy
{
public:
	explicit EnvironmentModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getDownloadCacheDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getExternalStorageDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getExternalStorageState(const v8::Arguments&);
	static v8::Handle<v8::Value> getDataDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getRootDirectory(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_rootDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_dataDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_externalStorageState(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_externalStorageDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_downloadCacheDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace android
		} // titanium
