/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>

#include "ModuleFactory.h"
#include "JNIUtil.h"

#include "ModuleInit.h"

namespace titanium {
using namespace internal;

bool ModuleFactory::hasModule(const char *moduleName)
{
	return !!ModuleHash::lookupModuleInit(moduleName, strlen(moduleName));
}

bool ModuleFactory::initModule(const char *moduleName, v8::Handle<v8::Object> target)
{
	moduleInit* module = ModuleHash::lookupModuleInit(moduleName, strlen(moduleName));
	if (module) {
		module->fn(target);
	}
	return (!!module);
}

}

