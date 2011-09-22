/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TITANIUM_MODULE_H
#define TITANIUM_MODULE_H

#include <v8.h>

namespace titanium {
using namespace v8;

class TitaniumModule
{
public:
	static void Initialize(Handle<Object> target);

protected:
	static Handle<Value> PrototypePropertyGetter(Local<String> property, const AccessorInfo& info);
	static Handle<Value> PrototypePropertySetter(Local<String> property, Local<Value> value, const AccessorInfo& info);
	static Handle<Integer> PrototypePropertyQuery(Local<String> property, const AccessorInfo& info);
	static Handle<Boolean> PrototypePropertyDeleter(Local<String> property, const AccessorInfo& info);
	static Handle<Array> PrototypePropertyEnumerator(const AccessorInfo& info);

private:
	static Persistent<FunctionTemplate> constructor_template;
	static Persistent<Object> instance;

};
}

#endif

