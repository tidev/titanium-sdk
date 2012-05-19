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


class Ti2DMatrix : public titanium::Proxy
{
public:
	explicit Ti2DMatrix(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> invert(const v8::Arguments&);
	static v8::Handle<v8::Value> scale(const v8::Arguments&);
	static v8::Handle<v8::Value> rotate(const v8::Arguments&);
	static v8::Handle<v8::Value> finalValuesAfterInterpolation(const v8::Arguments&);
	static v8::Handle<v8::Value> translate(const v8::Arguments&);
	static v8::Handle<v8::Value> multiply(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------

};

		} // titanium
