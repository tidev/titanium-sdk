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


class LocaleModule : public titanium::Proxy
{
public:
	explicit LocaleModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getCurrencyCode(const v8::Arguments&);
	static v8::Handle<v8::Value> getCurrentLanguage(const v8::Arguments&);
	static v8::Handle<v8::Value> getCurrencySymbol(const v8::Arguments&);
	static v8::Handle<v8::Value> getCurrentCountry(const v8::Arguments&);
	static v8::Handle<v8::Value> getCurrentLocale(const v8::Arguments&);
	static v8::Handle<v8::Value> getLocaleCurrencySymbol(const v8::Arguments&);
	static v8::Handle<v8::Value> setLanguage(const v8::Arguments&);
	static v8::Handle<v8::Value> getString(const v8::Arguments&);
	static v8::Handle<v8::Value> formatTelephoneNumber(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_currentLocale(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_currentLanguage(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_language(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_currentCountry(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
