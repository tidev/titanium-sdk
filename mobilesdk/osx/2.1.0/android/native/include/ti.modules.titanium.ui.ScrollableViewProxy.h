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


class ScrollableViewProxy : public titanium::Proxy
{
public:
	explicit ScrollableViewProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> setViews(const v8::Arguments&);
	static v8::Handle<v8::Value> removeView(const v8::Arguments&);
	static v8::Handle<v8::Value> addView(const v8::Arguments&);
	static v8::Handle<v8::Value> getViews(const v8::Arguments&);
	static v8::Handle<v8::Value> setScrollingEnabled(const v8::Arguments&);
	static v8::Handle<v8::Value> movePrevious(const v8::Arguments&);
	static v8::Handle<v8::Value> moveNext(const v8::Arguments&);
	static v8::Handle<v8::Value> getCurrentPage(const v8::Arguments&);
	static v8::Handle<v8::Value> getScrollingEnabled(const v8::Arguments&);
	static v8::Handle<v8::Value> scrollToView(const v8::Arguments&);
	static v8::Handle<v8::Value> setCurrentPage(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_scrollingEnabled(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_scrollingEnabled(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_views(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_views(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_currentPage(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_currentPage(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

			} // namespace ui
		} // titanium
