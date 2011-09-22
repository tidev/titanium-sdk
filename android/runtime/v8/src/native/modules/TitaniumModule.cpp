/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <v8.h>
#include <string.h>

#include "TitaniumModule.h"
#include "V8Util.h"
#include "AndroidUtil.h"
#include "APIModule.h"

namespace titanium {
using namespace v8;

#define TAG "TitaniumModule"

Persistent<FunctionTemplate> TitaniumModule::constructor_template;
Persistent<Object> TitaniumModule::instance;
static Persistent<Object> property_cache;

Handle<Value> TitaniumModule::PrototypePropertyGetter(Local<String> property, const AccessorInfo& info)
{
	HandleScope scope;
	String::Utf8Value property_v(property);
	LOGD(TAG, "PrototypePropertyGetter %s", *property_v);
	if (property_cache.IsEmpty()) {
		property_cache = Persistent<Object>::New(Object::New());
	}
	Handle<Object> exports;
	if (property_cache->Has(property)) {
		Local<Object> value = property_cache->Get(property)->ToObject();
		TitaniumModule::instance->ForceSet(property, value);
		return value;
	} else if (strcmp(*property_v, "API") == 0) {
		exports = Object::New();
		APIModule::Initialize(exports);
	} else {
		LOGW(TAG, "No such Titanium property %s", *property_v);
		return Undefined();
	}
	Local<Array> keys = exports->GetPropertyNames();
	for (unsigned int i = 0; i < keys->Length(); ++i) {
		Handle<String> key = keys->Get(Integer::New(i))->ToString();
		String::Utf8Value key_v(key);
		LOGD(TAG, "initialized Titanium.%s", *key_v);
		Handle<Value> value = exports->Get(key);
		if (value == exports) {
			value = TitaniumModule::instance;
		}
		property_cache->Set(key, value);
		TitaniumModule::instance->ForceSet(key, value);
	}

	return scope.Close(exports->Get(property));
}

Handle<Value> TitaniumModule::PrototypePropertySetter(Local<String> property, Local<Value> value,
	const AccessorInfo& info)
{
	String::Utf8Value key(property);
	LOGD(TAG, "PrototypePropertySetter %s", *key);
	return value;
}

Handle<Integer> TitaniumModule::PrototypePropertyQuery(Local<String> property, const AccessorInfo& info)
{
	String::Utf8Value key(property);
	LOGD(TAG, "PrototypePropertyQuery %s", *key);
	return Handle<Integer>();
}

Handle<Boolean> TitaniumModule::PrototypePropertyDeleter(Local<String> property, const AccessorInfo& info)
{
	String::Utf8Value key(property);
	LOGD(TAG, "PrototypePropertyDeleter %s", *key);
	return False();
}

Handle<Array> TitaniumModule::PrototypePropertyEnumerator(const AccessorInfo& info)
{
	LOGD(TAG, "PrototypePropertyEnumerator");
	HandleScope scope;
	Local<Array> array = Array::New(0);
	return scope.Close(array);
}

void TitaniumModule::Initialize(v8::Handle<v8::Object> target)
{
	HandleScope scope;

	constructor_template = Persistent<FunctionTemplate>::New(FunctionTemplate::New());
	constructor_template->SetClassName(String::NewSymbol("Titanium"));
	constructor_template->PrototypeTemplate()->SetNamedPropertyHandler(PrototypePropertyGetter, PrototypePropertySetter,
		PrototypePropertyQuery, PrototypePropertyDeleter, PrototypePropertyEnumerator, Undefined());

	instance = Persistent<Object>::New(constructor_template->GetFunction()->NewInstance());
	target->Set(String::NewSymbol("Titanium"), instance);
}

}

