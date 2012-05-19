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


class FilesystemModule : public titanium::Proxy
{
public:
	explicit FilesystemModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getFile(const v8::Arguments&);
	static v8::Handle<v8::Value> getSeparator(const v8::Arguments&);
	static v8::Handle<v8::Value> getResourcesDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getLineEnding(const v8::Arguments&);
	static v8::Handle<v8::Value> createTempFile(const v8::Arguments&);
	static v8::Handle<v8::Value> getExternalStorageDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getApplicationCacheDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> isExternalStoragePresent(const v8::Arguments&);
	static v8::Handle<v8::Value> getApplicationDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getTempDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getApplicationDataDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> openStream(const v8::Arguments&);
	static v8::Handle<v8::Value> createTempDirectory(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_applicationDataDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_applicationDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_externalStoragePresent(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_lineEnding(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_applicationCacheDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_resourcesDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_tempDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_externalStorageDirectory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_separator(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
