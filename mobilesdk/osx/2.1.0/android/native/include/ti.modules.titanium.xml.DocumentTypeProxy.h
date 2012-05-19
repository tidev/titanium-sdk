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
			namespace xml {


class DocumentTypeProxy : public titanium::Proxy
{
public:
	explicit DocumentTypeProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getEntities(const v8::Arguments&);
	static v8::Handle<v8::Value> getDocumentType(const v8::Arguments&);
	static v8::Handle<v8::Value> getName(const v8::Arguments&);
	static v8::Handle<v8::Value> getPublicId(const v8::Arguments&);
	static v8::Handle<v8::Value> getInternalSubset(const v8::Arguments&);
	static v8::Handle<v8::Value> getSystemId(const v8::Arguments&);
	static v8::Handle<v8::Value> getNotations(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_documentType(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_internalSubset(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_name(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_notations(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_publicId(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_systemId(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_entities(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace xml
		} // titanium
