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


class FacebookModule : public titanium::Proxy
{
public:
	explicit FacebookModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> createLoginButton(const v8::Arguments&);
	static v8::Handle<v8::Value> setAppid(const v8::Arguments&);
	static v8::Handle<v8::Value> setForceDialogAuth(const v8::Arguments&);
	static v8::Handle<v8::Value> getLoggedIn(const v8::Arguments&);
	static v8::Handle<v8::Value> getAccessToken(const v8::Arguments&);
	static v8::Handle<v8::Value> getUid(const v8::Arguments&);
	static v8::Handle<v8::Value> getAppid(const v8::Arguments&);
	static v8::Handle<v8::Value> requestWithGraphPath(const v8::Arguments&);
	static v8::Handle<v8::Value> getExpirationDate(const v8::Arguments&);
	static v8::Handle<v8::Value> authorize(const v8::Arguments&);
	static v8::Handle<v8::Value> logout(const v8::Arguments&);
	static v8::Handle<v8::Value> getPermissions(const v8::Arguments&);
	static v8::Handle<v8::Value> getForceDialogAuth(const v8::Arguments&);
	static v8::Handle<v8::Value> setPermissions(const v8::Arguments&);
	static v8::Handle<v8::Value> request(const v8::Arguments&);
	static v8::Handle<v8::Value> dialog(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_uid(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_expirationDate(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_accessToken(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_forceDialogAuth(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_forceDialogAuth(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_permissions(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_permissions(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_appid(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_appid(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_loggedIn(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
