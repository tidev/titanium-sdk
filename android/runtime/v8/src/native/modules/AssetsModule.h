/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef ASSETS_MODULE_H
#define ASSETS_MODULE_H

#include <v8.h>

using namespace v8;

namespace titanium {

class AssetsModule
{
public:
	static void Initialize(Local<Object> target, Local<Context> context);

	static void readAsset(const FunctionCallbackInfo<Value>& args);
	static void readFile(const FunctionCallbackInfo<Value>& args);

};

}

#endif
