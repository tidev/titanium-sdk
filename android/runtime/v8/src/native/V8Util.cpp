/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>
#include "V8Util.h"

namespace titanium {

v8::Handle<v8::String> ImmutableAsciiStringLiteral::CreateFromLiteral(const char *string_literal, size_t length)
{
	HandleScope scope;
	v8::Local<v8::String> result = v8::String::NewExternal(new ImmutableAsciiStringLiteral(string_literal, length));
	return scope.Close(result);
}

}
