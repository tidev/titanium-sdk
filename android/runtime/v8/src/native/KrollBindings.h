/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef KROLL_BINDINGS_H
#define KROLL_BINDINGS_H

#include <map>
#include <string>
#include <vector>

#include <v8.h>
#include <jni.h>

namespace titanium {

namespace bindings {
	typedef void (*BindCallback)(v8::Local<v8::Object> exports, v8::Local<v8::Context> context);
	typedef void (*DisposeCallback)(v8::Isolate* isolate);

	struct BindEntry {
		const char *name;
		BindCallback bind;
		DisposeCallback dispose;
	};

} // namespace bindings

typedef bindings::BindEntry* (*LookupFunction)(const char *binding, unsigned int bindingLength);


class KrollBindings
{
private:
	static std::map<std::string, bindings::BindEntry*> externalBindings;
	static std::map<std::string, jobject> externalCommonJsModules;
	static std::map<std::string, jmethodID> commonJsSourceRetrievalMethods;
	static std::vector<LookupFunction> externalLookups;
	static std::map<std::string, bindings::BindEntry*> externalLookupBindings;

public:
	static void initFunctions(v8::Local<v8::Object> exports, v8::Local<v8::Context> context);

	static void initNatives(v8::Local<v8::Object> exports, v8::Local<v8::Context> context);
	static void initTitanium(v8::Local<v8::Object> exports, v8::Local<v8::Context> context);
	static void disposeTitanium(v8::Isolate* isolate);

	static v8::Local<v8::String> getMainSource(v8::Isolate* isolate);

	/**
	 * Helper method to instantiate a native binding instance and stick it in our cache.
	 *
	 * @param isolate Current V8 Isolate
	 * @param binding The native binding entry we looked up. May be empty, in
	 *                which case we'll skip all the work and return an empty
	 *                object reference.
	 * @param key The "name" of the binding to use as the key in our cache.
	 * @param cache The binding cache.
	 */
	static v8::Local<v8::Object> instantiateBinding(v8::Isolate* isolate, bindings::BindEntry* binding, v8::Local<v8::String> key, v8::Local<v8::Object> cache);

	/**
	 * The JS callback. Used when we call kroll.binding('name') in JS code.
	 *
	 * @param args Function arguments
	 */
	static void getBinding(const v8::FunctionCallbackInfo<v8::Value>& args);

	/**
	 * Retrieve and instance a native binding by name/id.
	 *
	 * @param isolate Current V8 Isolate
	 * @param binding The name/id of the native binding.
	 * @return The instantiated binding as a JS object. Empty reference if unable to lookup binding.
	 */
	static v8::Local<v8::Object> getBinding(v8::Isolate* isolate, v8::Local<v8::String> binding);

	/**
	 * The JS callback. Used when we call kroll.externalBinding('name') in JS code.
	 * This looks up 'external' bindings specifically (i.e. it won't look at the natives/titanium proxies)
	 *
	 * @param args Function arguments
	 */
	static void getExternalBinding(const v8::FunctionCallbackInfo<v8::Value>& args);

	/**
	 * Grabs the external binding by name. Binding must have been added via
	 * #addExternalBinding(char*, bindings::BindEntry)
	 *
	 * @param  name   Name/id of the external binding
	 * @param  length Length of the character array/name
	 * @return        The native binding registered. NULL if none found.
	 */
	static bindings::BindEntry* getExternalBinding(const char *name, unsigned int length);

	/**
	 * Used by native modules to register a binding by name/id.
	 *
	 * @param name    Name/id of the binding.
	 * @param binding The entry used to instantiate/dispose of the binding.
	 */
	static void addExternalBinding(const char *name, bindings::BindEntry *binding);

	/**
	 * Used by native modules to register a function that can look up native
	 * bindings. This can effectively register multiple bindings at once.
	 *
	 * @param lookup The LookupFunction used to retrieve bindings.
	 */
	static void addExternalLookup(LookupFunction lookup);

	static void addExternalCommonJsModule(const char *name, jobject sourceProvider, jmethodID sourceRetrievalMethod);
	static void isExternalCommonJsModule(const v8::FunctionCallbackInfo<v8::Value>& args);
	static void getExternalCommonJsModule(const v8::FunctionCallbackInfo<v8::Value>& args);

	static void dispose(v8::Isolate* isolate);
};

} // namespace titanium

#endif
