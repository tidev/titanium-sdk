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


class TiDatabaseProxy : public titanium::Proxy
{
public:
	explicit TiDatabaseProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> execute(const v8::Arguments&);
	static v8::Handle<v8::Value> remove(const v8::Arguments&);
	static v8::Handle<v8::Value> getRowsAffected(const v8::Arguments&);
	static v8::Handle<v8::Value> getName(const v8::Arguments&);
	static v8::Handle<v8::Value> getLastInsertRowId(const v8::Arguments&);
	static v8::Handle<v8::Value> close(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_lastInsertRowId(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_rowsAffected(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_name(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace database
		} // titanium
