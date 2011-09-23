/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef MODULE_FACTORY_H
#define MODULE_FACTORY_H

#include <v8.h>

namespace titanium {

class ModuleFactory
{
public:
	static bool initModule(const char *moduleName, v8::Handle<v8::Object> target);
};

}

#endif
