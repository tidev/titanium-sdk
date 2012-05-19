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


class PickerProxy : public titanium::Proxy
{
public:
	explicit PickerProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> showDatePickerDialog(const v8::Arguments&);
	static v8::Handle<v8::Value> showTimePickerDialog(const v8::Arguments&);
	static v8::Handle<v8::Value> getType(const v8::Arguments&);
	static v8::Handle<v8::Value> setColumns(const v8::Arguments&);
	static v8::Handle<v8::Value> setUseSpinner(const v8::Arguments&);
	static v8::Handle<v8::Value> setType(const v8::Arguments&);
	static v8::Handle<v8::Value> add(const v8::Arguments&);
	static v8::Handle<v8::Value> getColumns(const v8::Arguments&);
	static v8::Handle<v8::Value> getSelectedRow(const v8::Arguments&);
	static v8::Handle<v8::Value> getUseSpinner(const v8::Arguments&);
	static v8::Handle<v8::Value> setSelectedRow(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_columns(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_columns(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_useSpinner(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_useSpinner(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_type(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_type(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

			} // namespace ui
		} // titanium
