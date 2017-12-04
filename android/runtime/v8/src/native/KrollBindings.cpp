/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <dlfcn.h>
#include <map>
#include <cstring>
#include <vector>
#include <v8.h>
#include <jni.h>

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "V8Runtime.h"
#include "V8Util.h"
#include "TypeConverter.h"

#include "KrollBindings.h"

// Generated Javascript -> C++ code
#include "KrollJS.cpp"

// Generated perfect hash for native bindings
#include "KrollNativeBindings.cpp"

// Generated perfect hash for generated bindings
#include "KrollGeneratedBindings.cpp"

#define TAG "KrollBindings"

namespace titanium {
using namespace v8;

std::map<std::string, bindings::BindEntry*> KrollBindings::externalBindings;
std::map<std::string, jobject> KrollBindings::externalCommonJsModules;
std::map<std::string, jmethodID> KrollBindings::commonJsSourceRetrievalMethods;
std::vector<LookupFunction> KrollBindings::externalLookups;
std::map<std::string, bindings::BindEntry*> KrollBindings::externalLookupBindings;

void KrollBindings::initFunctions(Local<Object> exports, Local<Context> context)
{
	Isolate* isolate = context->GetIsolate();
	SetMethod(isolate, exports, "binding", KrollBindings::getBinding);
	SetMethod(isolate, exports, "externalBinding", KrollBindings::getExternalBinding);
	SetMethod(isolate, exports, "isExternalCommonJsModule", KrollBindings::isExternalCommonJsModule);
	SetMethod(isolate, exports, "getExternalCommonJsModule", KrollBindings::getExternalCommonJsModule);
}

void KrollBindings::initNatives(Local<Object> exports, Local<Context> context)
{
	Isolate* isolate = context->GetIsolate();
	HandleScope scope(isolate);
	for (int i = 0; natives[i].name; ++i) {
		if (natives[i].source == kroll_native) continue;
		Local<String> name = String::NewFromUtf8(isolate, natives[i].name);
		Local<String> source = IMMUTABLE_STRING_LITERAL_FROM_ARRAY(isolate, natives[i].source, natives[i].source_length);
		exports->Set(name, source);
	}
}

void KrollBindings::initTitanium(Local<Object> exports, Local<Context> context)
{
	Isolate* isolate = context->GetIsolate();
	HandleScope scope(isolate);
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Couldn't initialize JNIEnv");
		return;
	}

	Proxy::bindProxy(exports, context);
	KrollProxy::bindProxy(exports, context);
	KrollModule::bindProxy(exports, context);
	TitaniumModule::bindProxy(exports, context);
}

void KrollBindings::disposeTitanium(Isolate* isolate)
{
	Proxy::dispose(isolate);
	KrollProxy::dispose(isolate);
	KrollModule::dispose(isolate);
	TitaniumModule::dispose(isolate);
}

static Persistent<Object> bindingCache;

void KrollBindings::getBinding(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();

	if (args.Length() == 0 || !(args[0]->IsString())) {
		JSException::Error(isolate, "Invalid arguments to binding, expected String");
		return;
	}

	Local<Object> binding = getBinding(isolate, args[0].As<String>());
	if (binding.IsEmpty()) {
		return;
	}

	args.GetReturnValue().Set(binding);
}

void KrollBindings::getExternalBinding(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	if (args.Length() == 0 || !(args[0]->IsString())) {
		JSException::Error(args.GetIsolate(), "Invalid arguments to externalBinding, expected String");
		return;
	}

	Local<String> binding = args[0].As<String>();
	Local<Object> cache = bindingCache.Get(isolate);
	if (cache->Has(binding)) {
		args.GetReturnValue().Set(cache->Get(binding)->ToObject(isolate));
		return;
	}

	v8::String::Utf8Value bindingValue(binding);
	int length = bindingValue.length();
	struct bindings::BindEntry *externalBinding = KrollBindings::getExternalBinding(*bindingValue, length);
	Local<Object> exports = KrollBindings::instantiateBinding(isolate, externalBinding, binding, cache);
	if (!exports.IsEmpty()) {
		args.GetReturnValue().Set(exports);
	}
}

Local<Object> KrollBindings::instantiateBinding(Isolate* isolate, bindings::BindEntry* binding, Local<String> key, Local<Object> cache) {
	if (binding) {
		Local<Object> exports = Object::New(isolate);
		Local<Context> context = isolate->GetCurrentContext();
		binding->bind(exports, context);
		cache->Set(key, exports);
		return exports;
	}

	return Local<Object>();
}

bindings::BindEntry* KrollBindings::getExternalBinding(const char *name, unsigned int length)
{
	std::string key(name);
	return externalBindings[key];
}

void KrollBindings::addExternalBinding(const char *name, struct bindings::BindEntry *binding)
{
	externalBindings[std::string(name)] = binding;
}

void KrollBindings::addExternalLookup(LookupFunction lookup)
{
	externalLookups.push_back(lookup);
}

Local<Object> KrollBindings::getBinding(v8::Isolate* isolate, Local<String> binding)
{
	Local<Object> cache;
	if (bindingCache.IsEmpty()) {
		cache = Object::New(isolate);
		bindingCache.Reset(isolate, cache);
	} else {
		cache = bindingCache.Get(isolate);
	}

	if (cache->Has(binding)) {
		return cache->Get(binding)->ToObject(isolate);
	}

	v8::String::Utf8Value bindingValue(binding);
	int length = bindingValue.length();

	Local<Object> exports;
	// Try natives
	exports = KrollBindings::instantiateBinding(isolate, bindings::native::lookupBindingInit(*bindingValue, length), binding, cache);
	if (!exports.IsEmpty()) {
		return exports;
	}

	// Try generated proxies (Titanium APIs)
	exports = KrollBindings::instantiateBinding(isolate, bindings::generated::lookupGeneratedInit(*bindingValue, length), binding, cache);
	if (!exports.IsEmpty()) {
		return exports;
	}

	// try native modules by lookup function
	// This uses an array of functions we call to aks for a given binding
	// Not sure why we have this *and* the external bindings in a map from name -> binding
	for (int i = 0; i < KrollBindings::externalLookups.size(); i++) {
		titanium::LookupFunction lookupFunction = KrollBindings::externalLookups[i];

		struct bindings::BindEntry* external = (*lookupFunction)(*bindingValue, length);
		if (external) {
			exports = KrollBindings::instantiateBinding(isolate, external, binding, cache);
			externalLookupBindings[*bindingValue] = external;
			return exports;
		}
	}

	// Try native modules by binding string
	exports = KrollBindings::instantiateBinding(isolate, KrollBindings::getExternalBinding(*bindingValue, length), binding, cache);
	if (!exports.IsEmpty()) {
		return exports;
	}

	return Local<Object>();
}

// Dispose of all static function templates
// in the generated and native bindings. This
// clears out the module lookup cache
void KrollBindings::dispose(v8::Isolate* isolate)
{
	JNIEnv *env = JNIScope::getEnv();
	std::map<std::string, jobject>::iterator iterMods;
	for (iterMods = externalCommonJsModules.begin(); iterMods != externalCommonJsModules.end(); ++iterMods) {
		jobject obj = iterMods->second;
		env->DeleteGlobalRef(obj);
	}

	externalCommonJsModules.clear();
	commonJsSourceRetrievalMethods.clear();

	// Dispose all external bindings
	std::map<std::string, bindings::BindEntry *>::iterator iter;
	for (iter = externalBindings.begin(); iter != externalBindings.end(); ++iter) {
		bindings::BindEntry *external = iter->second;
		if (external && external->dispose) {
			external->dispose(isolate);
		}
	}

	if (bindingCache.IsEmpty()) {
		return;
	}

	Local<Object> cache = bindingCache.Get(isolate);
	Local<Array> propertyNames = cache->GetPropertyNames();
	uint32_t length = propertyNames->Length();

	for (uint32_t i = 0; i < length; i++) {
		v8::String::Utf8Value binding(propertyNames->Get(i));
		int bindingLength = binding.length();

		struct titanium::bindings::BindEntry *generated = bindings::generated::lookupGeneratedInit(*binding, bindingLength);
		if (generated && generated->dispose) {
			generated->dispose(isolate);
			continue;
		}

		struct titanium::bindings::BindEntry *native = bindings::native::lookupBindingInit(*binding, bindingLength);
		if (native && native->dispose) {
			native->dispose(isolate);
			continue;
		}

		struct titanium::bindings::BindEntry *lookup = externalLookupBindings[*binding];
		if (lookup && lookup->dispose) {
			lookup->dispose(isolate);
			continue;
		}
	}

	externalLookupBindings.clear();

	bindingCache.Reset();
}

/*
 * Stores a java KrollSourceCodeProvider instance and the id of its getSourceCode method
 * for an external CommonJS module that is stored in a java external module.
 */
void KrollBindings::addExternalCommonJsModule(const char *name, jobject sourceProvider, jmethodID sourceRetrievalMethod)
{
	std::string stringName(name);
	externalCommonJsModules[stringName] = sourceProvider;
	commonJsSourceRetrievalMethods[stringName] = sourceRetrievalMethod;
}

/*
 * Checks if an external CommonJS module with given name has been registered
 * here.
 */
void KrollBindings::isExternalCommonJsModule(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	HandleScope scope(isolate);

	if (args.Length() == 0 || !(args[0]->IsString())) {
		JSException::Error(isolate, "Invalid arguments to isExternalCommonJsModule, expected String");
		return;
	}

	v8::Local<v8::String> name = args[0].As<String>();
	v8::String::Utf8Value nameVal(name);
	std::string nameKey(*nameVal);

	bool exists = (externalCommonJsModules.count(nameKey) > 0);
	args.GetReturnValue().Set(exists);
}

/*
 * Makes the KrollSourceCodeProvider's getSourceCode method call to grab
 * the source code of a CommonJS module stored in a native (java) external module.
 */
void KrollBindings::getExternalCommonJsModule(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	EscapableHandleScope scope(args.GetIsolate());

	if (args.Length() == 0 || !(args[0]->IsString())) {
		JSException::Error(isolate, "Invalid arguments to getExternalCommonJsBinding, expected String");
		return;
	}

	v8::Local<v8::String> name = args[0].As<String>();
	v8::String::Utf8Value nameVal(name);
	std::string nameKey(*nameVal);
	std::string moduleRoot = nameKey;
	std::string subPath = nameKey;

	int slashPos = nameKey.find("/", 0);
	if (slashPos != std::string::npos) {
		moduleRoot = nameKey.substr(0, slashPos);
		subPath = nameKey.substr(slashPos + 1);
	}

	bool exists = (externalCommonJsModules.count(moduleRoot) > 0);
	if (!exists) {
		args.GetReturnValue().Set(v8::Undefined(isolate));
		return;
	}

	JNIEnv *env = JNIScope::getEnv();
	jobject sourceProvider = externalCommonJsModules[moduleRoot];
	jmethodID sourceRetrievalMethod = commonJsSourceRetrievalMethods[moduleRoot];

	// The older version of KrollSourceCodeProvider.getSourceCode() (the method being called
	// below) took no arguments, because we only
	// supported one possible CommonJS module file packaged in a native module. There could be some
	// modules out there that were created during the time when we only had that no-arg version of
	// getSourceCode(), so we have to continue to support that. But we first try the newer version:
	// getSourceCode(String), which allows you to get any CommonJS module packaged with the native
	// module since we now support multiple CommonJS modules.
	jstring sourceJavaString = (jstring) env->CallObjectMethod(sourceProvider,
		sourceRetrievalMethod, env->NewStringUTF(subPath.c_str()));
	jthrowable exc = env->ExceptionOccurred();

	if (exc && slashPos == std::string::npos) {
		// An exception occurred trying the newer getSourceCode(String).
		// Try the old, no-arg way of getting source, but only if indeed the
		// root module is being requested (i.e., no slashes in path).
		env->ExceptionClear();
		sourceRetrievalMethod = env->GetMethodID(env->GetObjectClass(sourceProvider),
			"getSourceCode", "()Ljava/lang/String;");
		if (sourceRetrievalMethod) {
			sourceJavaString = (jstring) env->CallObjectMethod(sourceProvider, sourceRetrievalMethod);
		}
	}

	v8::Local<v8::Value> sourceCode = TypeConverter::javaStringToJsString(isolate, env, sourceJavaString);
	args.GetReturnValue().Set(scope.Escape(sourceCode));
}

Local<String> KrollBindings::getMainSource(v8::Isolate* isolate)
{
	return IMMUTABLE_STRING_LITERAL_FROM_ARRAY(isolate, kroll_native, sizeof(kroll_native)-1);
}

}
