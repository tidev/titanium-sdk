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


class TitaniumModule : public titanium::Proxy
{
public:
	explicit TitaniumModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getBuildHash(const v8::Arguments&);
	static v8::Handle<v8::Value> localize(const v8::Arguments&);
	static v8::Handle<v8::Value> stringFormatDecimal(const v8::Arguments&);
	static v8::Handle<v8::Value> alert(const v8::Arguments&);
	static v8::Handle<v8::Value> testThrow(const v8::Arguments&);
	static v8::Handle<v8::Value> getBuildTimestamp(const v8::Arguments&);
	static v8::Handle<v8::Value> stringFormatDate(const v8::Arguments&);
	static v8::Handle<v8::Value> stringFormatTime(const v8::Arguments&);
	static v8::Handle<v8::Value> getVersion(const v8::Arguments&);
	static v8::Handle<v8::Value> getBuildDate(const v8::Arguments&);
	static v8::Handle<v8::Value> setTimeout(const v8::Arguments&);
	static v8::Handle<v8::Value> dumpCoverage(const v8::Arguments&);
	static v8::Handle<v8::Value> clearInterval(const v8::Arguments&);
	static v8::Handle<v8::Value> getUserAgent(const v8::Arguments&);
	static v8::Handle<v8::Value> stringFormat(const v8::Arguments&);
	static v8::Handle<v8::Value> clearTimeout(const v8::Arguments&);
	static v8::Handle<v8::Value> stringFormatCurrency(const v8::Arguments&);
	static v8::Handle<v8::Value> setInterval(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_userAgent(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_buildHash(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_buildDate(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_buildTimestamp(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_version(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
