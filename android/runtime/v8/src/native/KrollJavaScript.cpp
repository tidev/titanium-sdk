/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>

#include "EventEmitter.h"
#include "KrollJavaScript.h"
#include "V8Util.h"
#include "../../generated/KrollNatives.h"

#include "org.appcelerator.kroll.KrollProxy.h"
#include "org.appcelerator.kroll.KrollModule.h"

namespace titanium {
using namespace v8;

void KrollJavaScript::DefineNatives(Handle<Object> target)
{
	HandleScope scope;
	for (int i = 0; natives[i].name; ++i) {
		if (natives[i].source == kroll_native) continue;
		Local<String> name = String::New(natives[i].name);
		Handle<String> source = IMMUTABLE_STRING_LITERAL_FROM_ARRAY(natives[i].source, natives[i].source_length);
		target->Set(name, source);
	}
}

Handle<String> KrollJavaScript::MainSource()
{
	return IMMUTABLE_STRING_LITERAL_FROM_ARRAY(kroll_native, sizeof(kroll_native)-1);
}

static Handle<Value> Extend(const Arguments& args)
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

void KrollJavaScript::initBaseTypes(Handle<Object> target)
{
	KrollProxy::Initialize(target);
	DEFINE_METHOD(KrollProxy::proxyTemplate, "extend", Extend);
	KrollModule::Initialize(target);
}

}
