/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef KROLL_JAVASCRIPT_H
#define KROLL_JAVASCRIPT_H

#include <v8.h>

namespace titanium {
class KrollJavaScript
{
public:
	static v8::Handle<v8::Value> initNativeModule(const char *moduleName);
};
}

#endif
