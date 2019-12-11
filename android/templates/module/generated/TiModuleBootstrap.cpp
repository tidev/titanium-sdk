/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Warning: This file is GENERATED, and should not be modified
 */
#include <JSException.h>
#include <KrollBindings.h>
#include <V8Util.h>

#include "BootstrapJS.h"
#include "KrollGeneratedBindings.h"

#define TAG "${moduleId}"

using namespace v8;

static Persistent<Object> bindingCache;

static void TiModule_getBinding(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	EscapableHandleScope scope(isolate);

	if (args.Length() == 0) {
		titanium::JSException::Error(isolate, "${moduleId} TiModule_getBinding() requires 1 argument: binding");
		args.GetReturnValue().Set(scope.Escape(Undefined(isolate)));
		return;
	}

	Local<Context> context = isolate->GetCurrentContext();
	MaybeLocal<String> maybeBinding = args[0]->ToString(context);
	if (maybeBinding.IsEmpty()) {
		titanium::JSException::Error(isolate, "${moduleId} TiModule_getBinding requires 1 argument: binding. Received argument that could not be converted to a String");
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
	Local<String> binding = maybeBinding.ToLocalChecked();
	if (cache->Has(context, binding).FromMaybe(false)) {
		MaybeLocal<Value> maybeCachedValue = cache->Get(context, binding);
		if (!maybeCachedValue.IsEmpty()) {
			args.GetReturnValue().Set(scope.Escape(maybeCachedValue.ToLocalChecked()));
			return;
		}
	}

	v8::String::Utf8Value bindingValue(isolate, binding);
	LOGD(TAG, "Looking up binding: %s", *bindingValue);

	titanium::bindings::BindEntry *extBinding = titanium::bindings::TiModuleBindings::lookupGeneratedInit(
		*bindingValue, bindingValue.length());

	if (!extBinding) {
		LOGE(TAG, "Couldn't find binding: %s, returning undefined", *bindingValue);
		args.GetReturnValue().Set(scope.Escape(Undefined(isolate)));
		return;
	}

	Local<Object> exports = Object::New(isolate);
	extBinding->bind(exports, context);
	cache->Set(context, binding, exports);

	args.GetReturnValue().Set(scope.Escape(exports));
	return;
}

static void TiModule_init(Local<Object> exports, Local<Context> context)
{
	Isolate* isolate = context->GetIsolate();
	HandleScope scope(isolate);

	for (int i = 0; titanium::natives[i].name; ++i) {
		MaybeLocal<String> maybeName = String::NewFromUtf8(isolate, titanium::natives[i].name, v8::NewStringType::kNormal);
		if (maybeName.IsEmpty()) {
			LOGE(TAG, "Couldn't generate JS String for binding name: %s, skipping setting value", *titanium::natives[i].name);
			continue;
		}

		Local<String> source = IMMUTABLE_STRING_LITERAL_FROM_ARRAY(isolate,
			titanium::natives[i].source, titanium::natives[i].source_length);
		exports->Set(context, maybeName.ToLocalChecked(), source);
	}

	Local<FunctionTemplate> constructor = FunctionTemplate::New(isolate, TiModule_getBinding);
	exports->Set(context, String::NewFromUtf8(isolate, "getBinding", v8::NewStringType::kNormal).ToLocalChecked(), constructor->GetFunction(context).ToLocalChecked());
}

static void TiModule_dispose(Isolate* isolate)
{
	HandleScope scope(isolate);
	if (bindingCache.IsEmpty()) {
		return;
	}

	Local<Object> cache = bindingCache.Get(isolate);
	Local<Context> context = isolate->GetCurrentContext();
	MaybeLocal<Array> maybePropertyNames = cache->GetPropertyNames(context);
	if (maybePropertyNames.IsEmpty()) {
		return;
	}

	Local<Array> propertyNames = maybePropertyNames.ToLocalChecked();
	uint32_t length = propertyNames->Length();
	for (uint32_t i = 0; i < length; ++i) {
		MaybeLocal<Value> maybePropertyName = propertyNames->Get(context, i);
		if (maybePropertyName.IsEmpty()) {
			continue;
		}

		v8::String::Utf8Value binding(isolate, maybePropertyName.ToLocalChecked());
		int bindingLength = binding.length();

		titanium::bindings::BindEntry *extBinding =
			titanium::bindings::TiModuleBindings::lookupGeneratedInit(*binding, bindingLength);

		if (extBinding && extBinding->dispose) {
			extBinding->dispose(isolate);
		}
	}

	bindingCache.Reset();
}

static titanium::bindings::BindEntry TiModuleBinding = {
	"${moduleId}",
	TiModule_init,
	TiModule_dispose
};

// Main module entry point
extern "C" JNIEXPORT void JNICALL
Java_${jniPackage}_TiModuleBootstrap_nativeBootstrap
	(JNIEnv *env, jobject self)
{
	titanium::KrollBindings::addExternalBinding("${moduleId}", &TiModuleBinding);
	titanium::KrollBindings::addExternalLookup(&(titanium::bindings::TiModuleBindings::lookupGeneratedInit));
}
