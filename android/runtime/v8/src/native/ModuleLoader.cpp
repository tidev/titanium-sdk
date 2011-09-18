/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ModuleLoader.h"

using namespace v8;

typedef void (*ModuleInit)(Handle<Object>);

#include "ModuleInit.c"

namespace titanium {

Handle<Value> loadModule(const Arguments& args)
{ 
    HandleScope scope;

    Local<Object> topLevelObject = args[0]->ToObject();

    for (int i = 1; i < args.Length(); ++i) {
        String::Utf8Value value(args[i]);
        struct moduleInit* init = lookupModuleInit(*value, value.Length());
        init->fn(topLevelObject);
    }

    return Undefined();
}

}

