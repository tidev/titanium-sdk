/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Original code Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
 */
#include "EventEmitter.h"
#include "V8Util.h"

namespace titanium {

using namespace v8;

Persistent<FunctionTemplate> EventEmitter::constructorTemplate;

static Persistent<String> eventsSymbol;

void EventEmitter::Initialize(Local<FunctionTemplate> globalTemplate)
{
	HandleScope scope;
	constructorTemplate = Persistent<FunctionTemplate>::New(globalTemplate);
	constructorTemplate->SetClassName(String::NewSymbol("EventEmitter"));
	eventsSymbol = SYMBOL_LITERAL("_events");
}

bool EventEmitter::Emit(Handle<String> event, int argc, Handle<Value> argv[])
{
	HandleScope scope;
	Local<Value> events_v = handle_->Get(eventsSymbol);
	if (!events_v->IsObject()) return false;
	Local<Object> events = events_v->ToObject();

	Local<Value> listeners_v = events->Get(event);
	TryCatch try_catch;

	if (listeners_v->IsFunction()) {
		// Optimized one-listener case
		Local<Function> listener = Local<Function>::Cast(listeners_v);
		listener->Call(handle_, argc, argv);
		if (try_catch.HasCaught()) {
			FatalException(try_catch);
			return false;
		}
	} else if (listeners_v->IsArray()) {
		Local<Array> listeners = Local<Array>::Cast(listeners_v->ToObject()->Clone());
		for (uint32_t i = 0; i < listeners->Length(); ++i) {
			Local<Value> listener_v = listeners->Get(i);
			if (!listener_v->IsFunction()) continue;
			Local<Function> listener = Local<Function>::Cast(listener_v);
			listener->Call(handle_, argc, argv);
			if (try_catch.HasCaught()) {
				FatalException(try_catch);
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
}

}
