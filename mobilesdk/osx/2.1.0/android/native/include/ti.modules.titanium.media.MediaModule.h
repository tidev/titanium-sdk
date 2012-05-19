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


class MediaModule : public titanium::Proxy
{
public:
	explicit MediaModule(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> takePicture(const v8::Arguments&);
	static v8::Handle<v8::Value> openPhotoGallery(const v8::Arguments&);
	static v8::Handle<v8::Value> previewImage(const v8::Arguments&);
	static v8::Handle<v8::Value> getIsCameraSupported(const v8::Arguments&);
	static v8::Handle<v8::Value> takeScreenshot(const v8::Arguments&);
	static v8::Handle<v8::Value> vibrate(const v8::Arguments&);
	static v8::Handle<v8::Value> showCamera(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_isCameraSupported(v8::Local<v8::String> property, const v8::AccessorInfo& info);

};

		} // titanium
