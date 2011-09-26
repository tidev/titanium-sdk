/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef KROLL_BINDINGS_H
#define KROLL_BINDINGS_H

#include <v8.h>

namespace titanium {

class KrollBindings
{
public:
	static void initNatives(v8::Handle<v8::Object> target);
	static void initTitanium(v8::Handle<v8::Object> target);

	static v8::Handle<v8::String> getMainSource();
	static v8::Handle<v8::Value> getBinding(const v8::Arguments& args);
};

}

#endif
