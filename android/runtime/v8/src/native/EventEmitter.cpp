/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Original code Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
 */
#include "EventEmitter.h"

namespace titanium {

using namespace v8;

Persistent<FunctionTemplate> EventEmitter::constructorTemplate;

static Persistent<String> eventsSymbol;

void EventEmitter::Initialize(Handle<Object> global)
{
	HandleScope scope;
	Handle < String > emitterSymbol = String::NewSymbol("EventEmitter");
	constructorTemplate = Persistent < FunctionTemplate > ::New(FunctionTemplate::New());
	constructorTemplate->SetClassName(emitterSymbol);
	global->Set(emitterSymbol, constructorTemplate->GetFunction());

	eventsSymbol = Persistent < String > ::New(String::NewSymbol("_events"));
}

bool EventEmitter::Emit(Handle<String> event, int argc, Handle<Value> argv[])
{
	HandleScope scope;
	// HandleScope not needed here because only called from one of the two
	// functions below
	Local < Value > eventsValue = handle_->Get(eventsSymbol);
	if (!eventsValue->IsObject()) return false;
	Local < Object > events = eventsValue->ToObject();

	Local < Value > listenersValue = events->Get(event);

	TryCatch tryCatch;

	if (listenersValue->IsFunction()) {
		// Optimized one-listener case
		Local < Function > listener = Local < Function > ::Cast(listenersValue);

		listener->Call(handle_, argc, argv);

		if (tryCatch.HasCaught()) {
			// TODO pull this in: FatalException(tryCatch);
			return false;
		}

	} else if (listenersValue->IsArray()) {
		Local < Array > listeners = Local < Array > ::Cast(listenersValue->ToObject()->Clone());

		for (uint32_t i = 0; i < listeners->Length(); i++) {
			Local < Value > listenerValue = listeners->Get(i);
			if (!listenerValue->IsFunction()) continue;
			Local < Function > listener = Local < Function > ::Cast(listenerValue);

			listener->Call(handle_, argc, argv);

			if (tryCatch.HasCaught()) {
				// TODO pull this in: FatalException(tryCatch);
				return false;
			}
		}

	} else {
		return false;
	}

	return true;
}

}
