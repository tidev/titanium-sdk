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
			namespace platform {


class DisplayCapsProxy : public titanium::Proxy
{
public:
	explicit DisplayCapsProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getPlatformHeight(const v8::Arguments&);
	static v8::Handle<v8::Value> getLogicalDensityFactor(const v8::Arguments&);
	static v8::Handle<v8::Value> getXdpi(const v8::Arguments&);
	static v8::Handle<v8::Value> getPlatformWidth(const v8::Arguments&);
	static v8::Handle<v8::Value> getDpi(const v8::Arguments&);
	static v8::Handle<v8::Value> getYdpi(const v8::Arguments&);
	static v8::Handle<v8::Value> getDensity(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_platformWidth(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_density(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_platformHeight(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_xdpi(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_logicalDensityFactor(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_ydpi(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_dpi(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace platform
		} // titanium
