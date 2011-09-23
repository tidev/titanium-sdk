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

class TitaniumGlobal
{
public:
	static void Initialize(Handle<Object> target);

protected:
	static Handle<Value> prototypePropertyGetter(Local<String> property, const AccessorInfo& info);

private:
	static Persistent<FunctionTemplate> constructorTemplate;
	static Persistent<Object> instance;

};
}

#endif

