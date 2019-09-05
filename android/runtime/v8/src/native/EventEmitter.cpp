/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Original code Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
 */
#include "EventEmitter.h"
#include "V8Util.h"

#define TAG "EventEmitter"

using namespace v8;

namespace titanium {

Persistent<FunctionTemplate> EventEmitter::constructorTemplate;

static Persistent<String> eventsSymbol;
Persistent<String> EventEmitter::emitSymbol;

void EventEmitter::eventEmitterConstructor(const FunctionCallbackInfo<Value>& args)
{
	HandleScope scope(args.GetIsolate());
	EventEmitter *emitter = new EventEmitter();
	emitter->Wrap(args.This());
}

void EventEmitter::initTemplate(Local<Context> context)
{
	Isolate* isolate = context->GetIsolate();
	HandleScope scope(isolate);
	Local<FunctionTemplate> constructor = FunctionTemplate::New(isolate, eventEmitterConstructor);
	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(NEW_SYMBOL(isolate, "EventEmitter"));
	constructorTemplate.Reset(isolate, constructor);

	eventsSymbol.Reset(isolate, NEW_SYMBOL(isolate, "_events"));
	emitSymbol.Reset(isolate, NEW_SYMBOL(isolate, "emit"));
}

void EventEmitter::dispose()
{
	constructorTemplate.Reset();
	eventsSymbol.Reset();
	emitSymbol.Reset();
}

bool EventEmitter::emit(Local<String> event, int argc, Local<Value> *argv)
{
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	Local<Context> context = isolate->GetCurrentContext();

	Local<Object> self = handle();

	MaybeLocal<Value> maybeEvents = self->Get(context, eventsSymbol.Get(isolate));
	if (maybeEvents.IsEmpty() || !maybeEvents.ToLocalChecked()->IsObject()) {
		return false;
	}

	Local<Object> events = maybeEvents.ToLocalChecked().As<Object>();
	MaybeLocal<Value> maybeListeners = events->Get(context, event);
	if (maybeListeners.IsEmpty()) {
		return false;
	}

	Local<Value> listeners = maybeListeners.ToLocalChecked();
	TryCatch try_catch(isolate);
	if (listeners->IsFunction()) {
		// Optimized one-listener case
		Local<Function> listener = listeners.As<Function>();
		listener->Call(context, self, argc, argv);
		if (try_catch.HasCaught()) {
			V8Util::fatalException(isolate, try_catch);
			return false;
		}
	} else if (listeners->IsArray()) {
		Local<Array> listenersArray = listeners.As<Array>()->Clone().As<Array>();
		for (uint32_t i = 0; i < listenersArray->Length(); ++i) {
			MaybeLocal<Value> maybeListener = listenersArray->Get(context, i);
			if (maybeListener.IsEmpty() || !maybeListener.ToLocalChecked()->IsFunction()) {
				continue;
			}
			Local<Function> listenerFunction = maybeListener.ToLocalChecked().As<Function>();
			listenerFunction->Call(context, self, argc, argv);
			if (try_catch.HasCaught()) {
				V8Util::fatalException(isolate, try_catch);
				return false;
			}
		}
	}

	return true;
}

} // namespace titanium
