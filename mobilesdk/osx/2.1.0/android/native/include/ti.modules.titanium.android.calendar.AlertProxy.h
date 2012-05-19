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
			namespace calendar {


class AlertProxy : public titanium::Proxy
{
public:
	explicit AlertProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getState(const v8::Arguments&);
	static v8::Handle<v8::Value> getEventId(const v8::Arguments&);
	static v8::Handle<v8::Value> getAlarmTime(const v8::Arguments&);
	static v8::Handle<v8::Value> getBegin(const v8::Arguments&);
	static v8::Handle<v8::Value> getEnd(const v8::Arguments&);
	static v8::Handle<v8::Value> getId(const v8::Arguments&);
	static v8::Handle<v8::Value> getMinutes(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_id(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_minutes(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_eventId(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_state(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_end(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_alarmTime(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_begin(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace calendar
			} // namespace android
		} // titanium
