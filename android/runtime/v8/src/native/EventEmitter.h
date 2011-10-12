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

class EventEmitter : public NativeObject
{
public:
	static v8::Persistent<v8::String> emitSymbol;

	static v8::Handle<v8::Value> Constructor(const v8::Arguments& args);
	static void Initialize();
	static v8::Persistent<v8::FunctionTemplate> constructorTemplate;

	bool emit(v8::Handle<v8::String> event, int argc, v8::Handle<v8::Value> *argv);

protected:
	EventEmitter()
		: NativeObject()
	{
	}

	virtual ~EventEmitter()
	{
	}
};

}
#endif
