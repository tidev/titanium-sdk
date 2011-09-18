/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <v8.h>

#ifndef MODULELOADER_H
#define MODULELOADER_H

namespace titanium {

v8::Handle<v8::Value> loadModule(const v8::Arguments& args);

}

#endif
