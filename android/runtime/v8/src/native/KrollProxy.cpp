/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <v8.h>
#include <string.h>

#include "KrollProxy.h"
#include "org.appcelerator.kroll.KrollProxy.h"

namespace titanium {
using namespace v8;

static Handle<Value> KrollProxyExtend(const Arguments& args)
{
	HandleScope scope;
	if (args.Length() == 0) return Undefined();
	if (!args[0]->IsObject()) return Undefined();

	Local<Object> options = args[0]->ToObject();
	Local<Array> names = options->GetPropertyNames();
	int len = names->Length();

	for (int i = 0; i < len; i++) {
		Handle<Value> name = names->Get(i);
		args.This()->Set(name, options->Get(name));
	}
	return Undefined();
}

static Handle<Value> KrollProxy_binding(const Arguments& args)
{
	static Persistent<Object> binding_cache;

	HandleScope scope;
	Local<String> module = args[0]->ToString();
	String::Utf8Value module_v(module);

	if (binding_cache.IsEmpty()) {
		binding_cache = Persistent<Object>::New(Object::New());
	}
	Local<Object> exports;
	if (binding_cache->Has(module)) {
		exports = binding_cache->Get(module)->ToObject();
	} else if (!strcmp(*module_v, "natives")) {
		exports = Object::New();
		//DefineNatives(exports);
		binding_cache->Set(module, exports);
	} else {
		return ThrowException(Exception::Error(String::New("No such module")));
	}
	return scope.Close(exports);
}

void initKrollProxy()
{
	HandleScope scope;
	Handle<ObjectTemplate> prototype = KrollProxy::proxyTemplate->PrototypeTemplate();
	prototype->Set(String::NewSymbol("extend"), FunctionTemplate::New(KrollProxyExtend)->GetFunction());
	prototype->Set(String::NewSymbol("binding"), FunctionTemplate::New(KrollProxy_binding)->GetFunction());
}

}
