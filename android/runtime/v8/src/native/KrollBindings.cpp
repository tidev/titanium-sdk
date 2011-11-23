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
#include "JNIUtil.h"
#include "JSException.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "V8Runtime.h"
#include "V8Util.h"

#include "KrollBindings.h"

// Generated Javascript -> C++ code
#include "KrollJS.cpp"

// Generated perfect hash for native bindings
#include "KrollNativeBindings.cpp"

// Generated perfect hash for generated bindings
#include "KrollGeneratedBindings.cpp"

#define TAG "KrollBindings"

namespace titanium {
using namespace v8;

void KrollBindings::initNatives(Handle<Object> exports)
{
	HandleScope scope;
	for (int i = 0; natives[i].name; ++i) {
		if (natives[i].source == kroll_native) continue;
		Local<String> name = String::New(natives[i].name);
		Handle<String> source = IMMUTABLE_STRING_LITERAL_FROM_ARRAY(natives[i].source, natives[i].source_length);
		exports->Set(name, source);
	}
}

void KrollBindings::initTitanium(Handle<Object> exports)
{
	HandleScope scope;
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Couldn't initialize JNIEnv");
		return;
	}

	Proxy::bindProxy(exports);
	KrollProxy::bindProxy(exports);
	KrollModule::bindProxy(exports);
	TitaniumModule::bindProxy(exports);
}

void KrollBindings::disposeTitanium()
{
	Proxy::dispose();
	KrollProxy::dispose();
	KrollModule::dispose();
	TitaniumModule::dispose();
}

static Persistent<Object> bindingCache;

Handle<Value> KrollBindings::getBinding(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0 || !args[0]->IsString()) {
		return JSException::Error("Invalid arguments to binding, expected String");
	}

	Handle<Object> binding = getBinding(args[0]->ToString());
	if (binding.IsEmpty()) {
		return Undefined();
	}

	return scope.Close(binding);
}

Handle<Object> KrollBindings::getBinding(Handle<String> binding)
{
	if (bindingCache.IsEmpty()) {
		bindingCache = Persistent<Object>::New(Object::New());
	}

	String::Utf8Value bindingValue(binding);

	if (bindingCache->Has(binding)) {
		return bindingCache->Get(binding)->ToObject();
	}

	int length = bindingValue.length();

	struct bindings::BindEntry *native = bindings::native::lookupBindingInit(*bindingValue, length);

	if (native) {
		Local<Object> exports = Object::New();
		native->bind(exports);
		bindingCache->Set(binding, exports);

		return exports;
	}

	struct bindings::BindEntry* generated = bindings::generated::lookupGeneratedInit(*bindingValue, length);

	if (generated) {
		Local<Object> exports = Object::New();
		generated->bind(exports);
		bindingCache->Set(binding, exports);

		return exports;
	}

	return Handle<Object>();
}

void KrollBindings::dispose()
{
	HandleScope scope;
	Local<Array> propertyNames = bindingCache->GetPropertyNames();
	uint32_t length = propertyNames->Length();

	for (uint32_t i = 0; i < length; i++) {
		String::Utf8Value binding(propertyNames->Get(i));
		int bindingLength = binding.length();

		struct titanium::bindings::BindEntry *generated = bindings::generated::lookupGeneratedInit(*binding, bindingLength);
		if (generated && generated->dispose) {
			generated->dispose();
			continue;
		}

		struct titanium::bindings::BindEntry *native = bindings::native::lookupBindingInit(*binding, bindingLength);
		if (native && native->dispose) {
			native->dispose();
			continue;
		}
	}

	bindingCache.Dispose();
	bindingCache = Persistent<Object>();
}

Handle<String> KrollBindings::getMainSource()
{
	return IMMUTABLE_STRING_LITERAL_FROM_ARRAY(kroll_native, sizeof(kroll_native)-1);
}

}
