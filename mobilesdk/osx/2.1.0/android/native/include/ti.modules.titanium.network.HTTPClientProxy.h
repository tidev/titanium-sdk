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
			namespace network {


class HTTPClientProxy : public titanium::Proxy
{
public:
	explicit HTTPClientProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getStatus(const v8::Arguments&);
	static v8::Handle<v8::Value> getResponseText(const v8::Arguments&);
	static v8::Handle<v8::Value> getAllResponseHeaders(const v8::Arguments&);
	static v8::Handle<v8::Value> getAutoEncodeUrl(const v8::Arguments&);
	static v8::Handle<v8::Value> send(const v8::Arguments&);
	static v8::Handle<v8::Value> getReadyState(const v8::Arguments&);
	static v8::Handle<v8::Value> getResponseXML(const v8::Arguments&);
	static v8::Handle<v8::Value> getConnectionType(const v8::Arguments&);
	static v8::Handle<v8::Value> getValidatesSecureCertificate(const v8::Arguments&);
	static v8::Handle<v8::Value> getResponseData(const v8::Arguments&);
	static v8::Handle<v8::Value> getLocation(const v8::Arguments&);
	static v8::Handle<v8::Value> open(const v8::Arguments&);
	static v8::Handle<v8::Value> setAutoRedirect(const v8::Arguments&);
	static v8::Handle<v8::Value> getStatusText(const v8::Arguments&);
	static v8::Handle<v8::Value> getAutoRedirect(const v8::Arguments&);
	static v8::Handle<v8::Value> setRequestHeader(const v8::Arguments&);
	static v8::Handle<v8::Value> getResponseHeader(const v8::Arguments&);
	static v8::Handle<v8::Value> setTimeout(const v8::Arguments&);
	static v8::Handle<v8::Value> setValidatesSecureCertificate(const v8::Arguments&);
	static v8::Handle<v8::Value> clearCookies(const v8::Arguments&);
	static v8::Handle<v8::Value> getConnected(const v8::Arguments&);
	static v8::Handle<v8::Value> setAutoEncodeUrl(const v8::Arguments&);
	static v8::Handle<v8::Value> abort(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_responseData(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_validatesSecureCertificate(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_validatesSecureCertificate(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_allResponseHeaders(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_location(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_status(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_responseXML(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_connected(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_connectionType(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_statusText(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_responseText(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_readyState(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_autoRedirect(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_autoRedirect(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_autoEncodeUrl(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_autoEncodeUrl(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_timeout(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

			} // namespace network
		} // titanium
