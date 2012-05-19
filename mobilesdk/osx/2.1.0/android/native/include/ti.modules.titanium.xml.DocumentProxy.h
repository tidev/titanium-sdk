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


class DocumentProxy : public titanium::Proxy
{
public:
	explicit DocumentProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getElementById(const v8::Arguments&);
	static v8::Handle<v8::Value> createEntityReference(const v8::Arguments&);
	static v8::Handle<v8::Value> getImplementation(const v8::Arguments&);
	static v8::Handle<v8::Value> importNode(const v8::Arguments&);
	static v8::Handle<v8::Value> getElementsByTagNameNS(const v8::Arguments&);
	static v8::Handle<v8::Value> createTextNode(const v8::Arguments&);
	static v8::Handle<v8::Value> createElementNS(const v8::Arguments&);
	static v8::Handle<v8::Value> getDoctype(const v8::Arguments&);
	static v8::Handle<v8::Value> createDocumentFragment(const v8::Arguments&);
	static v8::Handle<v8::Value> createComment(const v8::Arguments&);
	static v8::Handle<v8::Value> createAttributeNS(const v8::Arguments&);
	static v8::Handle<v8::Value> getDocumentElement(const v8::Arguments&);
	static v8::Handle<v8::Value> getElementsByTagName(const v8::Arguments&);
	static v8::Handle<v8::Value> createAttribute(const v8::Arguments&);
	static v8::Handle<v8::Value> createCDATASection(const v8::Arguments&);
	static v8::Handle<v8::Value> createProcessingInstruction(const v8::Arguments&);
	static v8::Handle<v8::Value> createElement(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_implementation(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_doctype(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_documentElement(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace xml
		} // titanium
