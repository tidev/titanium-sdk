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


class PlatformModule : public titanium::Proxy
{
public:
	explicit PlatformModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getNetmask(const v8::Arguments&);
	static v8::Handle<v8::Value> getModel(const v8::Arguments&);
	static v8::Handle<v8::Value> getArchitecture(const v8::Arguments&);
	static v8::Handle<v8::Value> getOsname(const v8::Arguments&);
	static v8::Handle<v8::Value> getAvailableMemory(const v8::Arguments&);
	static v8::Handle<v8::Value> createUUID(const v8::Arguments&);
	static v8::Handle<v8::Value> getBatteryState(const v8::Arguments&);
	static v8::Handle<v8::Value> getRuntime(const v8::Arguments&);
	static v8::Handle<v8::Value> getProcessorCount(const v8::Arguments&);
	static v8::Handle<v8::Value> getLocale(const v8::Arguments&);
	static v8::Handle<v8::Value> getVersion(const v8::Arguments&);
	static v8::Handle<v8::Value> getBatteryLevel(const v8::Arguments&);
	static v8::Handle<v8::Value> setBatteryMonitoring(const v8::Arguments&);
	static v8::Handle<v8::Value> getBatteryMonitoring(const v8::Arguments&);
	static v8::Handle<v8::Value> getName(const v8::Arguments&);
	static v8::Handle<v8::Value> is24HourTimeFormat(const v8::Arguments&);
	static v8::Handle<v8::Value> getOstype(const v8::Arguments&);
	static v8::Handle<v8::Value> getUsername(const v8::Arguments&);
	static v8::Handle<v8::Value> getDisplayCaps(const v8::Arguments&);
	static v8::Handle<v8::Value> getMacaddress(const v8::Arguments&);
	static v8::Handle<v8::Value> openURL(const v8::Arguments&);
	static v8::Handle<v8::Value> getAddress(const v8::Arguments&);
	static v8::Handle<v8::Value> getId(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_model(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_availableMemory(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_displayCaps(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_ostype(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_processorCount(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_macaddress(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_locale(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_runtime(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_architecture(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_netmask(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_version(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_id(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_osname(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_batteryMonitoring(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_batteryMonitoring(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_username(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_address(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_name(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_batteryLevel(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_batteryState(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
