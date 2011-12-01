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

namespace bindings {
	typedef void (*BindCallback)(v8::Handle<v8::Object> exports);
	typedef void (*DisposeCallback)();

	struct BindEntry {
		const char *name;
		BindCallback bind;
		DisposeCallback dispose;
	};

} // namespace bindings

class KrollBindings
{
public:
	static void initNatives(v8::Handle<v8::Object> exports);
	static void initTitanium(v8::Handle<v8::Object> exports);
	static void disposeTitanium();

	static v8::Handle<v8::String> getMainSource();

	static v8::Handle<v8::Value> getBinding(const v8::Arguments& args);
	static v8::Handle<v8::Object> getBinding(v8::Handle<v8::String> binding);

	static void dispose();
};

} // namespace titanium

#endif
