/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef _ASSETS_H_
#define _ASSETS_H_

#include <v8.h>

namespace assets {
	
	v8::Handle<v8::Primitive> readResource(v8::Handle<v8::String> path);

}

#endif
