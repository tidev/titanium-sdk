/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <string.h>
#include <v8.h>

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "ModuleFactory.h"
#include "V8Util.h"

#include "KrollBindings.h"

// Generated Javascript -> C++ code
#include "KrollJS.cpp"

// Generated perfect hash for native bindings
#include "KrollNativeBindings.cpp"

#define TAG "KrollBindings"

namespace titanium {
using namespace v8;

void KrollBindings::initNatives(Handle<Object> target)
{
	HandleScope scope;
	for (int i = 0; natives[i].name; ++i) {
		if (natives[i].source == kroll_native) continue;
		Local<String> name = String::New(natives[i].name);
		Handle<String> source = IMMUTABLE_STRING_LITERAL_FROM_ARRAY(natives[i].source, natives[i].source_length);
		target->Set(name, source);
	}
}

void KrollBindings::initTitanium(v8::Handle<v8::Object> target)
{
	ModuleFactory::initModule("Titanium", target);
}

Handle<Value> KrollBindings::getBinding(const Arguments& args)
{
	static Persistent<Object> bindingCache;
	HandleScope scope;

	Handle<Value> resourceName = args.Callee()->GetScriptOrigin().ResourceName();
	int lineNumber = args.Callee()->GetScriptLineNumber();
	String::Utf8Value filename(resourceName);

	LOGD(TAG, "getBinding called from %s line %d", *filename, lineNumber);

	if (bindingCache.IsEmpty()) {
		bindingCache = Persistent<Object>::New(Object::New());
	}

	Local<String> binding = args[0]->ToString();
	if (bindingCache->Has(binding)) {
		return scope.Close(bindingCache->Get(binding)->ToObject());
	}

	String::Utf8Value bindingValue(binding);
	LOGD(TAG, "getBindings: %s", *bindingValue);

	struct bindingInit *init = KrollNativeBindings::lookupBindingInit(
		*bindingValue, bindingValue.length());

	if (init) {
		Local<Object> exports = Object::New();
		init->fn(exports);
		bindingCache->Set(binding, exports);
		return scope.Close(exports);
	}

	return Undefined();
}

Handle<String> KrollBindings::getMainSource()
{
	return IMMUTABLE_STRING_LITERAL_FROM_ARRAY(kroll_native, sizeof(kroll_native)-1);
}

}
