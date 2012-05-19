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


class EventProxy : public titanium::Proxy
{
public:
	explicit EventProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getStatus(const v8::Arguments&);
	static v8::Handle<v8::Value> getHasAlarm(const v8::Arguments&);
	static v8::Handle<v8::Value> getAlerts(const v8::Arguments&);
	static v8::Handle<v8::Value> getRecurrenceDate(const v8::Arguments&);
	static v8::Handle<v8::Value> getDescription(const v8::Arguments&);
	static v8::Handle<v8::Value> getVisibility(const v8::Arguments&);
	static v8::Handle<v8::Value> createReminder(const v8::Arguments&);
	static v8::Handle<v8::Value> getExtendedProperties(const v8::Arguments&);
	static v8::Handle<v8::Value> getRecurrenceRule(const v8::Arguments&);
	static v8::Handle<v8::Value> getExtendedProperty(const v8::Arguments&);
	static v8::Handle<v8::Value> getEnd(const v8::Arguments&);
	static v8::Handle<v8::Value> getBegin(const v8::Arguments&);
	static v8::Handle<v8::Value> getRecurrenceExceptionRule(const v8::Arguments&);
	static v8::Handle<v8::Value> getLocation(const v8::Arguments&);
	static v8::Handle<v8::Value> createAlert(const v8::Arguments&);
	static v8::Handle<v8::Value> getHasExtendedProperties(const v8::Arguments&);
	static v8::Handle<v8::Value> getReminders(const v8::Arguments&);
	static v8::Handle<v8::Value> getTitle(const v8::Arguments&);
	static v8::Handle<v8::Value> getRecurrenceExceptionDate(const v8::Arguments&);
	static v8::Handle<v8::Value> getAllDay(const v8::Arguments&);
	static v8::Handle<v8::Value> getLastDate(const v8::Arguments&);
	static v8::Handle<v8::Value> setExtendedProperty(const v8::Arguments&);
	static v8::Handle<v8::Value> getId(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_hasExtendedProperties(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_reminders(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_recurrenceExceptionDate(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_visibility(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_status(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_allDay(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_location(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_recurrenceExceptionRule(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_lastDate(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_hasAlarm(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_begin(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_id(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_title(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_recurrenceDate(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_description(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_alerts(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_recurrenceRule(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_end(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_extendedProperties(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace calendar
			} // namespace android
		} // titanium
