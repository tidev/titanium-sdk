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


class AppModule : public titanium::Proxy
{
public:
	explicit AppModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getDeployType(const v8::Arguments&);
	static v8::Handle<v8::Value> getCopyright(const v8::Arguments&);
	static v8::Handle<v8::Value> getID(const v8::Arguments&);
	static v8::Handle<v8::Value> getDescription(const v8::Arguments&);
	static v8::Handle<v8::Value> getPublisher(const v8::Arguments&);
	static v8::Handle<v8::Value> getSessionId(const v8::Arguments&);
	static v8::Handle<v8::Value> getGUID(const v8::Arguments&);
	static v8::Handle<v8::Value> appURLToPath(const v8::Arguments&);
	static v8::Handle<v8::Value> getGuid(const v8::Arguments&);
	static v8::Handle<v8::Value> getAnalytics(const v8::Arguments&);
	static v8::Handle<v8::Value> getVersion(const v8::Arguments&);
	static v8::Handle<v8::Value> getUrl(const v8::Arguments&);
	static v8::Handle<v8::Value> getName(const v8::Arguments&);
	static v8::Handle<v8::Value> getURL(const v8::Arguments&);
	static v8::Handle<v8::Value> getId(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_id(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_guid(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_sessionId(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_description(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_name(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_copyright(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_deployType(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_analytics(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_url(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_version(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_publisher(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
