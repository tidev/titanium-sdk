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
#include "EventListener.h"
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
static Persistent<String> addListenerSymbol;
static Persistent<String> removeListenerSymbol;

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
	addListenerSymbol = SYMBOL_LITERAL("addListener");
	removeListenerSymbol = SYMBOL_LITERAL("removeListener");
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

	Handle<Object> emitter;
	if (ptr != 0) {
		emitter = Persistent<Object>((Object *) ptr);
	} else {
		emitter = TypeConverter::javaObjectToJsValue(jEmitter)->ToObject();
	}
	Handle<Value> fireEventValue = emitter->Get(emitSymbol);
	if (!fireEventValue->IsFunction()) {
		return JNI_FALSE;
	}
	Handle<Function> fireEvent = Handle<Function>::Cast(fireEventValue->ToObject());
	Handle<String> jsEvent = TypeConverter::javaStringToJsString(event);
	Handle<Value> jsData = TypeConverter::javaObjectToJsValue(data);

	Handle<Value> result;

	TryCatch tryCatch;
	if (jsData->IsNull()) {
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

static Persistent<Function> addEventListener;

void Java_org_appcelerator_kroll_runtime_v8_EventEmitter_nativeAddEventListener(JNIEnv *env, jobject jEmitter, jlong ptr, jstring event, jlong listenerPtr)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<Object> emitter;
	if (ptr != 0) {
		emitter = Persistent<Object>::New(Handle<Object>((Object *) ptr));
	} else {
		emitter = TypeConverter::javaObjectToJsValue(jEmitter)->ToObject();
	}

	Local<Function> addEventListener = Local<Function>::Cast(emitter->GetRealNamedProperty(addListenerSymbol));
	Handle<String> jsEvent = TypeConverter::javaStringToJsString(event);
	Handle<Function> listener((Function *) listenerPtr);

	Handle<String> className = listener->GetConstructorName();
	String::Utf8Value cn(className);

	Handle<Value> args[] = { jsEvent, listener };

	TryCatch tryCatch;
	addEventListener->Call(emitter, 2, args);
	if (tryCatch.HasCaught()) {
		V8Util::reportException(tryCatch);
	}
}

void Java_org_appcelerator_kroll_runtime_v8_EventEmitter_nativeRemoveEventListener(JNIEnv *env, jobject jEmitter, jlong ptr, jstring event, jlong listenerPtr)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<Object> emitter;
	if (ptr != 0) {
		emitter = Persistent<Object>((Object *) ptr);
	} else {
		emitter = TypeConverter::javaObjectToJsValue(jEmitter)->ToObject();
	}
	Handle<Function> removeEventListener = Handle<Function>::Cast(emitter->Get(removeListenerSymbol));
	Handle<String> jsEvent = TypeConverter::javaStringToJsString(event);
	Handle<Function> listener((Function *) listenerPtr);

	Handle<Value> args[] = { jsEvent, listener };
	removeEventListener->Call(emitter, 2, args);
}

jboolean Java_org_appcelerator_kroll_runtime_v8_EventEmitter_nativeHasListeners(JNIEnv *env, jobject jEmitter, jlong ptr, jstring event)
{
	ENTER_V8(V8Runtime::globalContext);
	titanium::JNIScope jniScope(env);

	Handle<Object> emitter;
	if (ptr != 0) {
		emitter = Persistent<Object>((Object *) ptr);
	} else {
		emitter = TypeConverter::javaObjectToJsValue(jEmitter)->ToObject();
	}

	Handle<Object> events = emitter->Get(eventsSymbol)->ToObject();
	Handle<String> eventName = TypeConverter::javaStringToJsString(event);
	return events->Has(eventName);
}

}
