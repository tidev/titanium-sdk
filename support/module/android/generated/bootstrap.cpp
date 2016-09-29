/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Warning: This file is GENERATED, and should not be modified
 */
#include <jni.h>
#include <v8.h>

#include <AndroidUtil.h>
#include <JNIUtil.h>
#include <JSException.h>
#include <KrollBindings.h>
#include <V8Util.h>

#include "BootstrapJS.cpp"
#include "KrollGeneratedBindings.cpp"

#define TAG "%(moduleId)s"

using namespace v8;

static Persistent<Object> bindingCache;

static void %(className)s_getBinding(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	EscapableHandleScope scope(isolate);

	if (args.Length() == 0) {
		titanium::JSException::Error(isolate, "%(className)s.getBinding requires 1 argument: binding");
		args.GetReturnValue().Set(scope.Escape(Undefined(isolate)));
		return;
	}

	Local<Object> cache;
	if (bindingCache.IsEmpty()) {
		cache = Object::New(isolate);
		bindingCache.Reset(isolate, cache);
	} else {
		cache = bindingCache.Get(isolate);
	}

	Local<String> binding = args[0]->ToString(isolate);

	if (cache->Has(binding)) {
		args.GetReturnValue().Set(scope.Escape(cache->Get(binding)));
		return;
	}

	titanium::Utf8Value bindingValue(binding);
	LOGD(TAG, "Looking up binding: %%s", *bindingValue);

	titanium::bindings::BindEntry *extBinding = ::%(className)sBindings::lookupGeneratedInit(
		*bindingValue, bindingValue.length());

	if (!extBinding) {
		LOGE(TAG, "Couldn't find binding: %%s, returning undefined", *bindingValue);
		args.GetReturnValue().Set(scope.Escape(Undefined(isolate)));
		return;
	}

	Local<Object> exports = Object::New(isolate);
	extBinding->bind(exports, isolate->GetCurrentContext());
	cache->Set(binding, exports);

	args.GetReturnValue().Set(scope.Escape(exports));
	return;
}

static void %(className)s_init(Local<Object> exports, Local<Context> context)
{
	Isolate* isolate = context->GetIsolate();
	HandleScope scope(isolate);

	for (int i = 0; titanium::natives[i].name; ++i) {
		Local<String> name = String::NewFromUtf8(isolate, titanium::natives[i].name);
		Local<String> source = IMMUTABLE_STRING_LITERAL_FROM_ARRAY(isolate,
			titanium::natives[i].source, titanium::natives[i].source_length);

		exports->Set(name, source);
	}
	Local<FunctionTemplate> constructor = FunctionTemplate::New(isolate, %(className)s_getBinding);
	exports->Set(String::NewFromUtf8(isolate, "getBinding"), constructor->GetFunction(context).ToLocalChecked());
}

static void %(className)s_dispose(Isolate* isolate)
{
	HandleScope scope(isolate);
	if (bindingCache.IsEmpty()) {
		return;
	}

	Local<Array> propertyNames = bindingCache.Get(isolate)->GetPropertyNames();
	uint32_t length = propertyNames->Length();

	for (uint32_t i = 0; i < length; ++i) {
		titanium::Utf8Value binding(propertyNames->Get(i));
		int bindingLength = binding.length();

		titanium::bindings::BindEntry *extBinding =
			::%(className)sBindings::lookupGeneratedInit(*binding, bindingLength);

		if (extBinding && extBinding->dispose) {
			extBinding->dispose(isolate);
		}
	}

	bindingCache.Reset();
}

static titanium::bindings::BindEntry %(className)sBinding = {
	"%(moduleId)s",
	%(className)s_init,
	%(className)s_dispose
};

// Main module entry point
extern "C" JNIEXPORT void JNICALL
Java_%(jniPackage)s_%(className)sBootstrap_nativeBootstrap
	(JNIEnv *env, jobject self)
{
	titanium::KrollBindings::addExternalBinding("%(moduleId)s", &%(className)sBinding);
	titanium::KrollBindings::addExternalLookup(&(::%(className)sBindings::lookupGeneratedInit));
}
