/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef SCRIPTS_H
#define SCRIPTS_H

#include <v8.h>

namespace titanium {
class ScriptsModule
{
public:
	static void Initialize(v8::Handle<v8::Object> target);
	static v8::Handle<v8::Object> WrapContext(v8::Persistent<v8::Context> context);
};
}

#endif
