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
			namespace ui {


class WebViewProxy : public titanium::Proxy
{
public:
	explicit WebViewProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> goBack(const v8::Arguments&);
	static v8::Handle<v8::Value> getHtml(const v8::Arguments&);
	static v8::Handle<v8::Value> getEnableZoomControls(const v8::Arguments&);
	static v8::Handle<v8::Value> pause(const v8::Arguments&);
	static v8::Handle<v8::Value> setUserAgent(const v8::Arguments&);
	static v8::Handle<v8::Value> resume(const v8::Arguments&);
	static v8::Handle<v8::Value> goForward(const v8::Arguments&);
	static v8::Handle<v8::Value> stopLoading(const v8::Arguments&);
	static v8::Handle<v8::Value> getUserAgent(const v8::Arguments&);
	static v8::Handle<v8::Value> getPluginState(const v8::Arguments&);
	static v8::Handle<v8::Value> canGoBack(const v8::Arguments&);
	static v8::Handle<v8::Value> setBasicAuthentication(const v8::Arguments&);
	static v8::Handle<v8::Value> setHtml(const v8::Arguments&);
	static v8::Handle<v8::Value> reload(const v8::Arguments&);
	static v8::Handle<v8::Value> evalJS(const v8::Arguments&);
	static v8::Handle<v8::Value> setEnableZoomControls(const v8::Arguments&);
	static v8::Handle<v8::Value> release(const v8::Arguments&);
	static v8::Handle<v8::Value> canGoForward(const v8::Arguments&);
	static v8::Handle<v8::Value> setPluginState(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_enableZoomControls(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_enableZoomControls(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_userAgent(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_userAgent(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_html(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_pluginState(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_pluginState(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

			} // namespace ui
		} // titanium
