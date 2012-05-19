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


class MenuItemProxy : public titanium::Proxy
{
public:
	explicit MenuItemProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> setCheckable(const v8::Arguments&);
	static v8::Handle<v8::Value> setVisible(const v8::Arguments&);
	static v8::Handle<v8::Value> setChecked(const v8::Arguments&);
	static v8::Handle<v8::Value> hasSubMenu(const v8::Arguments&);
	static v8::Handle<v8::Value> isEnabled(const v8::Arguments&);
	static v8::Handle<v8::Value> getOrder(const v8::Arguments&);
	static v8::Handle<v8::Value> getTitleCondensed(const v8::Arguments&);
	static v8::Handle<v8::Value> getItemId(const v8::Arguments&);
	static v8::Handle<v8::Value> getGroupId(const v8::Arguments&);
	static v8::Handle<v8::Value> setTitleCondensed(const v8::Arguments&);
	static v8::Handle<v8::Value> isVisible(const v8::Arguments&);
	static v8::Handle<v8::Value> isCheckable(const v8::Arguments&);
	static v8::Handle<v8::Value> setTitle(const v8::Arguments&);
	static v8::Handle<v8::Value> isChecked(const v8::Arguments&);
	static v8::Handle<v8::Value> setEnabled(const v8::Arguments&);
	static v8::Handle<v8::Value> getTitle(const v8::Arguments&);
	static v8::Handle<v8::Value> setIcon(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_titleCondensed(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_titleCondensed(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_groupId(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_enabled(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_icon(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_title(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_title(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_order(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_visible(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_checkable(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_itemId(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_checked(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

		} // titanium
