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


class TiBlob : public titanium::Proxy
{
public:
	explicit TiBlob(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getFile(const v8::Arguments&);
	static v8::Handle<v8::Value> append(const v8::Arguments&);
	static v8::Handle<v8::Value> getText(const v8::Arguments&);
	static v8::Handle<v8::Value> getType(const v8::Arguments&);
	static v8::Handle<v8::Value> getHeight(const v8::Arguments&);
	static v8::Handle<v8::Value> getNativePath(const v8::Arguments&);
	static v8::Handle<v8::Value> toBase64(const v8::Arguments&);
	static v8::Handle<v8::Value> getWidth(const v8::Arguments&);
	static v8::Handle<v8::Value> toString(const v8::Arguments&);
	static v8::Handle<v8::Value> getLength(const v8::Arguments&);
	static v8::Handle<v8::Value> getMimeType(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_text(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_height(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_nativePath(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_file(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_width(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_length(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_type(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_mimeType(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
