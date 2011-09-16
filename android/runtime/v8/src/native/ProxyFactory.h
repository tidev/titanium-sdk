/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef PROXY_FACTORY_H
#define PROXY_FACTORY_H

#include <jni.h>
#include <v8.h>

namespace titanium {
class ProxyFactory
{
public:
	v8::Handle<v8::Object> create(jobject javaObject)
	{
		return v8::Object::New();
	};

private:
	// stub out shit here
};
}

#endif

