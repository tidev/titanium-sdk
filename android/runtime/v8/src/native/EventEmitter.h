/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Original code Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
 */
#ifndef EVENT_EMITTER_H
#define EVENT_EMITTER_H

#include <jni.h>
#include <v8.h>

#include "NativeObject.h"

namespace titanium {

class EventEmitter: public NativeObject
{
public:
	static void Initialize(v8::Local<v8::FunctionTemplate> globalTemplate);
	static v8::Persistent<v8::FunctionTemplate> constructorTemplate;

protected:
	EventEmitter(jobject object)
			: NativeObject(object)
	{
	}
};

}
#endif
