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
			namespace network {
			namespace socket {


class TCPProxy : public titanium::Proxy
{
public:
	explicit TCPProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getState(const v8::Arguments&);
	static v8::Handle<v8::Value> setConnected(const v8::Arguments&);
	static v8::Handle<v8::Value> setPort(const v8::Arguments&);
	static v8::Handle<v8::Value> connect(const v8::Arguments&);
	static v8::Handle<v8::Value> accept(const v8::Arguments&);
	static v8::Handle<v8::Value> isWritable(const v8::Arguments&);
	static v8::Handle<v8::Value> close(const v8::Arguments&);
	static v8::Handle<v8::Value> setAccepted(const v8::Arguments&);
	static v8::Handle<v8::Value> setListenQueueSize(const v8::Arguments&);
	static v8::Handle<v8::Value> setOptions(const v8::Arguments&);
	static v8::Handle<v8::Value> setTimeout(const v8::Arguments&);
	static v8::Handle<v8::Value> isConnected(const v8::Arguments&);
	static v8::Handle<v8::Value> write(const v8::Arguments&);
	static v8::Handle<v8::Value> read(const v8::Arguments&);
	static v8::Handle<v8::Value> isReadable(const v8::Arguments&);
	static v8::Handle<v8::Value> listen(const v8::Arguments&);
	static v8::Handle<v8::Value> setHost(const v8::Arguments&);
	static v8::Handle<v8::Value> setError(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static void setter_port(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_host(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_error(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_accepted(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_connected(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_state(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_listenQueueSize(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_timeout(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static void setter_options(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

			} // namespace socket
			} // namespace network
		} // titanium
