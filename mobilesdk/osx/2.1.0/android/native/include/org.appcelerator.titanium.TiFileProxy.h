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


class TiFileProxy : public titanium::Proxy
{
public:
	explicit TiFileProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getNativePath(const v8::Arguments&);
	static v8::Handle<v8::Value> rename(const v8::Arguments&);
	static v8::Handle<v8::Value> getReadonly(const v8::Arguments&);
	static v8::Handle<v8::Value> modificationTimestamp(const v8::Arguments&);
	static v8::Handle<v8::Value> spaceAvailable(const v8::Arguments&);
	static v8::Handle<v8::Value> createTimestamp(const v8::Arguments&);
	static v8::Handle<v8::Value> open(const v8::Arguments&);
	static v8::Handle<v8::Value> getSymbolicLink(const v8::Arguments&);
	static v8::Handle<v8::Value> write(const v8::Arguments&);
	static v8::Handle<v8::Value> read(const v8::Arguments&);
	static v8::Handle<v8::Value> getWritable(const v8::Arguments&);
	static v8::Handle<v8::Value> writeLine(const v8::Arguments&);
	static v8::Handle<v8::Value> getSize(const v8::Arguments&);
	static v8::Handle<v8::Value> getDirectoryListing(const v8::Arguments&);
	static v8::Handle<v8::Value> move(const v8::Arguments&);
	static v8::Handle<v8::Value> deleteDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> copy(const v8::Arguments&);
	static v8::Handle<v8::Value> deleteFile(const v8::Arguments&);
	static v8::Handle<v8::Value> resolve(const v8::Arguments&);
	static v8::Handle<v8::Value> getParent(const v8::Arguments&);
	static v8::Handle<v8::Value> createDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getExecutable(const v8::Arguments&);
	static v8::Handle<v8::Value> extension(const v8::Arguments&);
	static v8::Handle<v8::Value> isDirectory(const v8::Arguments&);
	static v8::Handle<v8::Value> getHidden(const v8::Arguments&);
	static v8::Handle<v8::Value> readLine(const v8::Arguments&);
	static v8::Handle<v8::Value> isFile(const v8::Arguments&);
	static v8::Handle<v8::Value> getName(const v8::Arguments&);
	static v8::Handle<v8::Value> exists(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_hidden(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_nativePath(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_writable(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_name(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_executable(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_parent(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_readonly(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_symbolicLink(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_directoryListing(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_size(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
