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
			namespace database {


class TiResultSetProxy : public titanium::Proxy
{
public:
	explicit TiResultSetProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> field(const v8::Arguments&);
	static v8::Handle<v8::Value> isValidRow(const v8::Arguments&);
	static v8::Handle<v8::Value> getField(const v8::Arguments&);
	static v8::Handle<v8::Value> next(const v8::Arguments&);
	static v8::Handle<v8::Value> getRowCount(const v8::Arguments&);
	static v8::Handle<v8::Value> getFieldCount(const v8::Arguments&);
	static v8::Handle<v8::Value> getFieldByName(const v8::Arguments&);
	static v8::Handle<v8::Value> fieldName(const v8::Arguments&);
	static v8::Handle<v8::Value> fieldByName(const v8::Arguments&);
	static v8::Handle<v8::Value> getFieldName(const v8::Arguments&);
	static v8::Handle<v8::Value> close(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_rowCount(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_fieldCount(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace database
		} // titanium
