/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
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

	Local<Object> self = handle();

	Local<Value> events_v = self->Get(eventsSymbol.Get(isolate));
	if (!events_v->IsObject()) return false;

	Local<Object> events = events_v.As<Object>();

	Local<Value> listeners_v = events->Get(event);
	TryCatch try_catch;

	if (listeners_v->IsFunction()) {
		// Optimized one-listener case
		Local<Function> listener = listeners_v.As<Function>();
		listener->Call(isolate->GetCurrentContext(), self, argc, argv);
		if (try_catch.HasCaught()) {
			V8Util::fatalException(isolate, try_catch);
			return false;
		}
	} else if (listeners_v->IsArray()) {
		Local<Array> listeners = listeners_v.As<Array>()->Clone().As<Array>();
		for (uint32_t i = 0; i < listeners->Length(); ++i) {
			Local<Value> listener_v = listeners->Get(i);
			if (!listener_v->IsFunction()) continue;
			Local<Function> listener = listener_v.As<Function>();
			listener->Call(isolate->GetCurrentContext(), self, argc, argv);
			if (try_catch.HasCaught()) {
				V8Util::fatalException(isolate, try_catch);
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
}

} // namespace titanium
