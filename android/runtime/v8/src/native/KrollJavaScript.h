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
	static void DefineNatives(v8::Handle<v8::Object> target);
	static v8::Handle<v8::String> MainSource();
	static void initBaseTypes(v8::Handle<v8::Object> global);
};
}

#endif
