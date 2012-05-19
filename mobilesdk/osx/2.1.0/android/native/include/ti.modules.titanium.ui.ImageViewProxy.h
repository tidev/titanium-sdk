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


class ImageViewProxy : public titanium::Proxy
{
public:
	explicit ImageViewProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> pause(const v8::Arguments&);
	static v8::Handle<v8::Value> stop(const v8::Arguments&);
	static v8::Handle<v8::Value> resume(const v8::Arguments&);
	static v8::Handle<v8::Value> setReverse(const v8::Arguments&);
	static v8::Handle<v8::Value> getAnimating(const v8::Arguments&);
	static v8::Handle<v8::Value> start(const v8::Arguments&);
	static v8::Handle<v8::Value> getReverse(const v8::Arguments&);
	static v8::Handle<v8::Value> toBlob(const v8::Arguments&);
	static v8::Handle<v8::Value> getPaused(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_animating(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_reverse(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_reverse(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_paused(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace ui
		} // titanium
