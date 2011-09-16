/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <string.h>
#include <v8.h>

#include "KrollJavaScript.h"
#include "../../generated/KrollNatives.h"

namespace titanium {
using namespace v8;

Handle<Value> KrollJavaScript::initNativeModule(const char *moduleName)
{
	HandleScope scope;
	for (const struct _native* native = natives; native->name != NULL; ++native) {
		if (strcmp(moduleName, native->name) == 0) {
			Local<Script> script = Script::Compile(String::New(native->source), String::New(native->name));
			return script->Run();
		}
	}
	return Undefined();
}
}
