/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <dlfcn.h>
#include <map>
#include <string.h>
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

void KrollBindings::initFunctions(Handle<Object> exports)
{
	DEFINE_METHOD(exports, "binding", KrollBindings::getBinding);
	DEFINE_METHOD(exports, "externalBinding", KrollBindings::getExternalBinding);
	DEFINE_METHOD(exports, "isExternalCommonJsModule", KrollBindings::isExternalCommonJsModule);
	DEFINE_METHOD(exports, "getExternalCommonJsModule", KrollBindings::getExternalCommonJsModule);
}

void KrollBindings::initNatives(Handle<Object> exports)
{
	HandleScope scope;
	for (int i = 0; natives[i].name; ++i) {
		if (natives[i].source == kroll_native) continue;
		Local<String> name = String::New(natives[i].name);
		Handle<String> source = IMMUTABLE_STRING_LITERAL_FROM_ARRAY(natives[i].source, natives[i].source_length);
		exports->Set(name, source);
	}
}

void KrollBindings::initTitanium(Handle<Object> exports)
{
	HandleScope scope;
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Couldn't initialize JNIEnv");
		return;
	}

	Proxy::bindProxy(exports);
	KrollProxy::bindProxy(exports);
	KrollModule::bindProxy(exports);
	TitaniumModule::bindProxy(exports);
}

void KrollBindings::disposeTitanium()
{
	Proxy::dispose();
	KrollProxy::dispose();
	KrollModule::dispose();
	TitaniumModule::dispose();
}

static Persistent<Object> bindingCache;

Handle<Value> KrollBindings::getBinding(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0 || !args[0]->IsString()) {
		return JSException::Error("Invalid arguments to binding, expected String");
	}

	Handle<Object> binding = getBinding(args[0]->ToString());
	if (binding.IsEmpty()) {
		return Undefined();
	}

	return scope.Close(binding);
}

Handle<Value> KrollBindings::getExternalBinding(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0 || !args[0]->IsString()) {
		return JSException::Error("Invalid arguments to externalBinding, expected String");
	}

	Handle<String> binding = args[0]->ToString();

	if (bindingCache->Has(binding)) {
		return bindingCache->Get(binding)->ToObject();
	}

	String::AsciiValue bindingValue(binding);
	std::string key(*bindingValue);

	struct bindings::BindEntry *externalBinding = externalBindings[key];

	if (externalBinding) {
		Local<Object> exports = Object::New();
		externalBinding->bind(exports);
		bindingCache->Set(binding, exports);

		return scope.Close(exports);
	}

	return Undefined();
}

void KrollBindings::addExternalBinding(const char *name, struct bindings::BindEntry *binding)
{
	externalBindings[std::string(name)] = binding;
}

void KrollBindings::addExternalLookup(LookupFunction lookup)
{
	externalLookups.push_back(lookup);
}

Handle<Object> KrollBindings::getBinding(Handle<String> binding)
{
	if (bindingCache.IsEmpty()) {
		bindingCache = Persistent<Object>::New(Object::New());
	}

	String::Utf8Value bindingValue(binding);

	if (bindingCache->Has(binding)) {
		return bindingCache->Get(binding)->ToObject();
	}

	int length = bindingValue.length();

	struct bindings::BindEntry *native = bindings::native::lookupBindingInit(*bindingValue, length);
	if (native) {
		Local<Object> exports = Object::New();
		native->bind(exports);
		bindingCache->Set(binding, exports);

		return exports;
	}

	struct bindings::BindEntry* generated = bindings::generated::lookupGeneratedInit(*bindingValue, length);
	if (generated) {
		Local<Object> exports = Object::New();
		generated->bind(exports);
		bindingCache->Set(binding, exports);

		return exports;
	}

	for (int i = 0; i < KrollBindings::externalLookups.size(); i++) {
		titanium::LookupFunction lookupFunction = KrollBindings::externalLookups[i];

		struct bindings::BindEntry* external = (*lookupFunction)(*bindingValue, length);
		if (external) {
			Local<Object> exports = Object::New();
			external->bind(exports);
			bindingCache->Set(binding, exports);
			externalLookupBindings[*bindingValue] = external;

			return exports;
		}
	}

	return Handle<Object>();
}

// Dispose of all static function templates
// in the generated and native bindings. This
// clears out the module lookup cache
void KrollBindings::dispose()
{
	HandleScope scope;

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
			external->dispose();
		}
	}

	if (bindingCache.IsEmpty()) {
		return;
	}

	Local<Array> propertyNames = bindingCache->GetPropertyNames();
	uint32_t length = propertyNames->Length();

	for (uint32_t i = 0; i < length; i++) {
		String::Utf8Value binding(propertyNames->Get(i));
		int bindingLength = binding.length();

		struct titanium::bindings::BindEntry *generated = bindings::generated::lookupGeneratedInit(*binding, bindingLength);
		if (generated && generated->dispose) {
			generated->dispose();
			continue;
		}

		struct titanium::bindings::BindEntry *native = bindings::native::lookupBindingInit(*binding, bindingLength);
		if (native && native->dispose) {
			native->dispose();
			continue;
		}

		struct titanium::bindings::BindEntry *lookup = externalLookupBindings[*binding];
		if (lookup && lookup->dispose) {
			lookup->dispose();
			continue;
		}
	}

	externalLookupBindings.clear();

	bindingCache.Dispose();
	bindingCache = Persistent<Object>();
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
v8::Handle<v8::Value> KrollBindings::isExternalCommonJsModule(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0 || !args[0]->IsString()) {
		return JSException::Error("Invalid arguments to isExternalCommonJsModule, expected String");
	}

	v8::Handle<v8::String> name = args[0]->ToString();
	v8::String::Utf8Value nameVal(name);
	std::string nameKey(*nameVal);

	bool exists = (externalCommonJsModules.count(nameKey) > 0);
	v8::Handle<v8::Boolean> existsV8 = v8::Boolean::New(exists);
	return scope.Close(existsV8);
}

/*
 * Makes the KrollSourceCodeProvider's getSourceCode method call to grab
 * the source code of a CommonJS module stored in a native (java) external module.
 */
v8::Handle<v8::Value> KrollBindings::getExternalCommonJsModule(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0 || !args[0]->IsString()) {
		return JSException::Error("Invalid arguments to getExternalCommonJsBinding, expected String");
	}

	v8::Handle<v8::String> name = args[0]->ToString();
	v8::String::Utf8Value nameVal(name);
	std::string nameKey(*nameVal);
	std::string moduleRoot = nameKey;
	std::string subPath = nameKey;

	int slashPos = nameKey.find("/", 0);
	if (slashPos != std::string::npos) {
		moduleRoot = nameKey.substr(0, slashPos);
		subPath = nameKey.substr(slashPos + 1);
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

	v8::Handle<v8::Value> sourceCode = TypeConverter::javaStringToJsString(env, sourceJavaString);
	return scope.Close(sourceCode);
}

Handle<String> KrollBindings::getMainSource()
{
	return IMMUTABLE_STRING_LITERAL_FROM_ARRAY(kroll_native, sizeof(kroll_native)-1);
}

}
