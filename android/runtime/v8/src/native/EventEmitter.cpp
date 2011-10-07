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
static Persistent<String> emitSymbol;

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

}

using namespace titanium;

extern "C" {

jboolean Java_org_appcelerator_kroll_runtime_v8_EventEmitter_nativeFireEvent(JNIEnv *env, jobject jEmitter, jlong ptr, jstring event, jobject data)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<String> jsEvent = TypeConverter::javaStringToJsString(event);

#ifdef TI_DEBUG
	String::Utf8Value eventName(jsEvent);
	LOGV(TAG, "firing event \"%s\"", *eventName);
#endif

	Handle<Object> emitter;
	if (ptr != 0) {
		emitter = Persistent<Object>((Object *) ptr);
	} else {
		emitter = TypeConverter::javaObjectToJsValue(jEmitter)->ToObject();
	}

	LOGV(TAG, "done init / unwrapping emitter");

	Handle<Value> fireEventValue = emitter->Get(emitSymbol);
	if (!fireEventValue->IsFunction()) {
		return JNI_FALSE;
	}

	Handle<Function> fireEvent = Handle<Function>::Cast(fireEventValue->ToObject());

	Handle<Value> jsData = TypeConverter::javaObjectToJsValue(data);
	Handle<Value> result;

	TryCatch tryCatch;
	if (/*jsData.IsEmpty() || */jsData->IsNull()) {
		Handle<Value> args[] = { jsEvent };
		result = fireEvent->Call(emitter, 1, args);
	} else {
		Handle<Value> args[] = { jsEvent, jsData };
		result = fireEvent->Call(emitter, 2, args);
	}

	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch);
	} else if (result->IsTrue()) {
		return JNI_TRUE;
	}
	return JNI_FALSE;
}

}

