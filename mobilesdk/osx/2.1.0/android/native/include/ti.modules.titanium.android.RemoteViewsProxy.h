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


class RemoteViewsProxy : public titanium::Proxy
{
public:
	explicit RemoteViewsProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> setChronometer(const v8::Arguments&);
	static v8::Handle<v8::Value> setTextViewText(const v8::Arguments&);
	static v8::Handle<v8::Value> setImageViewResource(const v8::Arguments&);
	static v8::Handle<v8::Value> setString(const v8::Arguments&);
	static v8::Handle<v8::Value> setViewVisibility(const v8::Arguments&);
	static v8::Handle<v8::Value> setBoolean(const v8::Arguments&);
	static v8::Handle<v8::Value> setImageViewUri(const v8::Arguments&);
	static v8::Handle<v8::Value> setDouble(const v8::Arguments&);
	static v8::Handle<v8::Value> setUri(const v8::Arguments&);
	static v8::Handle<v8::Value> setOnClickPendingIntent(const v8::Arguments&);
	static v8::Handle<v8::Value> setInt(const v8::Arguments&);
	static v8::Handle<v8::Value> setTextColor(const v8::Arguments&);
	static v8::Handle<v8::Value> setProgressBar(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------

};

			} // namespace android
		} // titanium
