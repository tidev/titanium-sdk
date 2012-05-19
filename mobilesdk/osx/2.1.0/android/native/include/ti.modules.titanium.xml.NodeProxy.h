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


class NodeProxy : public titanium::Proxy
{
public:
	explicit NodeProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getParentNode(const v8::Arguments&);
	static v8::Handle<v8::Value> evaluate(const v8::Arguments&);
	static v8::Handle<v8::Value> hasAttributes(const v8::Arguments&);
	static v8::Handle<v8::Value> replaceChild(const v8::Arguments&);
	static v8::Handle<v8::Value> normalize(const v8::Arguments&);
	static v8::Handle<v8::Value> getNodeType(const v8::Arguments&);
	static v8::Handle<v8::Value> setPrefix(const v8::Arguments&);
	static v8::Handle<v8::Value> getNamespaceURI(const v8::Arguments&);
	static v8::Handle<v8::Value> hasChildNodes(const v8::Arguments&);
	static v8::Handle<v8::Value> cloneNode(const v8::Arguments&);
	static v8::Handle<v8::Value> isSupported(const v8::Arguments&);
	static v8::Handle<v8::Value> insertBefore(const v8::Arguments&);
	static v8::Handle<v8::Value> getLastChild(const v8::Arguments&);
	static v8::Handle<v8::Value> setNodeValue(const v8::Arguments&);
	static v8::Handle<v8::Value> appendChild(const v8::Arguments&);
	static v8::Handle<v8::Value> getLocalName(const v8::Arguments&);
	static v8::Handle<v8::Value> getChildNodes(const v8::Arguments&);
	static v8::Handle<v8::Value> getPreviousSibling(const v8::Arguments&);
	static v8::Handle<v8::Value> getOwnerDocument(const v8::Arguments&);
	static v8::Handle<v8::Value> removeChild(const v8::Arguments&);
	static v8::Handle<v8::Value> getFirstChild(const v8::Arguments&);
	static v8::Handle<v8::Value> getNextSibling(const v8::Arguments&);
	static v8::Handle<v8::Value> getNodeName(const v8::Arguments&);
	static v8::Handle<v8::Value> getPrefix(const v8::Arguments&);
	static v8::Handle<v8::Value> getNodeValue(const v8::Arguments&);
	static v8::Handle<v8::Value> getAttributes(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_localName(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_nodeName(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_firstChild(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_childNodes(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_ownerDocument(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_lastChild(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_namespaceURI(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_previousSibling(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_parentNode(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_prefix(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_prefix(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_nodeValue(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_nodeValue(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_attributes(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_nodeType(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_nextSibling(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

			} // namespace xml
		} // titanium
