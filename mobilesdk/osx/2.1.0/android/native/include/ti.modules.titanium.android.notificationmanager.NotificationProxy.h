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


class NotificationProxy : public titanium::Proxy
{
public:
	explicit NotificationProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> setDeleteIntent(const v8::Arguments&);
	static v8::Handle<v8::Value> setContentView(const v8::Arguments&);
	static v8::Handle<v8::Value> setIconLevel(const v8::Arguments&);
	static v8::Handle<v8::Value> setFlags(const v8::Arguments&);
	static v8::Handle<v8::Value> setLedOnMS(const v8::Arguments&);
	static v8::Handle<v8::Value> setDefaults(const v8::Arguments&);
	static v8::Handle<v8::Value> setTickerText(const v8::Arguments&);
	static v8::Handle<v8::Value> setLatestEventInfo(const v8::Arguments&);
	static v8::Handle<v8::Value> setLedARGB(const v8::Arguments&);
	static v8::Handle<v8::Value> setSound(const v8::Arguments&);
	static v8::Handle<v8::Value> setAudioStreamType(const v8::Arguments&);
	static v8::Handle<v8::Value> setVibratePattern(const v8::Arguments&);
	static v8::Handle<v8::Value> setLedOffMS(const v8::Arguments&);
	static v8::Handle<v8::Value> setWhen(const v8::Arguments&);
	static v8::Handle<v8::Value> setNumber(const v8::Arguments&);
	static v8::Handle<v8::Value> setIcon(const v8::Arguments&);
	static v8::Handle<v8::Value> setContentIntent(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static void setter_vibratePattern(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_icon(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_flags(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_iconLevel(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_contentView(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_number(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_audioStreamType(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_deleteIntent(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_defaults(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_tickerText(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_ledARGB(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_sound(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_when(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_ledOnMS(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_contentIntent(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_ledOffMS(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

			} // namespace android
		} // titanium
