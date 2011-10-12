/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Original code Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
 */
#include <jni.h>
#include <v8.h>

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "TypeConverter.h"
#include "V8Util.h"
#include "JNIUtil.h"
#include "V8Runtime.h"

#define TAG "EventEmitter"

using namespace v8;

namespace titanium {

Persistent<FunctionTemplate> EventEmitter::constructorTemplate;

static Persistent<String> eventsSymbol;
Persistent<String> EventEmitter::emitSymbol;

Handle<Value> EventEmitter::Constructor(const Arguments& args)
{
	HandleScope scope;

	EventEmitter *emitter = new EventEmitter();
	emitter->Wrap(args.This());

	return args.This();
}

void EventEmitter::Initialize()
{
	HandleScope scope;
	constructorTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Constructor));
	constructorTemplate->InstanceTemplate()->SetInternalFieldCount(1);
	constructorTemplate->SetClassName(String::NewSymbol("EventEmitter"));

	eventsSymbol = SYMBOL_LITERAL("_events");
	emitSymbol = SYMBOL_LITERAL("emit");
}

bool EventEmitter::emit(Handle<String> event, int argc, Handle<Value> *argv)
{
	HandleScope scope;
	Handle<Value> events_v = handle_->Get(eventsSymbol);
	if (!events_v->IsObject()) return false;

	Handle<Object> events = events_v->ToObject();

	Handle<Value> listeners_v = events->Get(event);
	TryCatch try_catch;

	if (listeners_v->IsFunction()) {
		// Optimized one-listener case
		Handle<Function> listener = Handle<Function>::Cast(listeners_v);
		listener->Call(handle_, argc, argv);
		if (try_catch.HasCaught()) {
			V8Util::fatalException(try_catch);
			return false;
		}
	} else if (listeners_v->IsArray()) {
		Handle<Array> listeners = Handle<Array>::Cast(listeners_v->ToObject()->Clone());
		for (uint32_t i = 0; i < listeners->Length(); ++i) {
			Handle<Value> listener_v = listeners->Get(i);
			if (!listener_v->IsFunction()) continue;
			Handle<Function> listener = Handle<Function>::Cast(listener_v);
			listener->Call(handle_, argc, argv);
			if (try_catch.HasCaught()) {
				V8Util::fatalException(try_catch);
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
}

} // namespace titanium

