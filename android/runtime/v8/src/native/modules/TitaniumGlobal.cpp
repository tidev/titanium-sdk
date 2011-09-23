/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <v8.h>
#include <string.h>

#include "TitaniumGlobal.h"
#include "V8Util.h"
#include "AndroidUtil.h"
#include "APIModule.h"
#include "ModuleFactory.h"
#include "KrollJavaScript.h"

namespace titanium {
using namespace v8;

#define TAG "TitaniumGlobal"

Persistent<FunctionTemplate> TitaniumGlobal::constructor_template;
Persistent<Object> TitaniumGlobal::instance;
static Persistent<Object> property_cache;

Handle<Value> TitaniumGlobal::PrototypePropertyGetter(Local<String> property, const AccessorInfo& info)
{
	HandleScope scope;
	String::Utf8Value propertyValue(property);
	LOGD(TAG, "PrototypePropertyGetter %s", *propertyValue);

	if (property_cache.IsEmpty()) {
		property_cache = Persistent<Object>::New(Object::New());
	}

	Handle<Object> exports;
	if (property_cache->Has(property)) {
		Local<Object> value = property_cache->Get(property)->ToObject();
		instance->ForceSet(property, value);
		return value;
	} else if (strcmp(*propertyValue, "API") == 0) {
		exports = Object::New();
		APIModule::Initialize(exports);
	} else if (ModuleFactory::hasModule(*propertyValue)) {
		exports = Object::New();
		ModuleFactory::initModule(*propertyValue, exports);
	} else {
		LOGW(TAG, "Titanium.%s does not exist", *propertyValue);
		return Undefined();
	}
	Local<Array> keys = exports->GetPropertyNames();
	for (unsigned int i = 0; i < keys->Length(); ++i) {
		Handle<String> key = keys->Get(Integer::New(i))->ToString();
		String::Utf8Value key_v(key);
		LOGD(TAG, "initialized Titanium.%s", *key_v);
		Handle<Value> value = exports->Get(key);
		if (value == exports) {
			value = instance;
		}
		property_cache->Set(key, value);
		instance->ForceSet(key, value);
	}

	return scope.Close(exports->Get(property));
}

void TitaniumGlobal::Initialize(v8::Handle<v8::Object> target)
{
	HandleScope scope;

	constructor_template = Persistent<FunctionTemplate>::New(FunctionTemplate::New());
	constructor_template->SetClassName(String::NewSymbol("Titanium"));
	constructor_template->PrototypeTemplate()->SetNamedPropertyHandler(PrototypePropertyGetter);

	instance = Persistent<Object>::New(constructor_template->GetFunction()->NewInstance());
	KrollJavaScript::initBaseTypes(instance);
	ModuleFactory::initModule("Titanium", instance);

	target->Set(String::NewSymbol("Titanium"), instance);
}

}

