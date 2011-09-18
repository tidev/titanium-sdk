/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <v8.h>

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

void initKrollProxy(Handle<Object> ti, JNIEnv *env)
{
	HandleScope scope;
	KrollProxy::Initialize(ti, env);
	Handle<ObjectTemplate> prototype = KrollProxy::proxyTemplate->PrototypeTemplate();
	prototype->Set(String::NewSymbol("extend"), FunctionTemplate::New(KrollProxyExtend)->GetFunction());
}

}
