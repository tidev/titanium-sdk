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

namespace titanium
{

	class EventEmitter : public NativeObject
	{
	public:
		static void Initialize(v8::Handle<v8::Object> global);
		static v8::Persistent<v8::FunctionTemplate> constructorTemplate;

		bool Emit(v8::Handle<v8::String> event,
			int argc, v8::Handle<v8::Value> argv[]);

	protected:
		EventEmitter(jobject object) : NativeObject (object) { }
	};

}
#endif
