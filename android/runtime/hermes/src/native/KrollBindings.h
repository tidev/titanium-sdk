/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef KROLL_BINDINGS_H
#define KROLL_BINDINGS_H

#include <jni.h>
#include <map>
#include <string>
#include <vector>

#include <jsi/jsi.h>

namespace titanium {

using namespace facebook;

namespace bindings {
	// Fills the exports object of one binding.
	typedef void (*BindCallback)(jsi::Runtime& rt, const jsi::Object& exports);
	// Drops what the binding cached for this runtime.
	typedef void (*DisposeCallback)(jsi::Runtime& rt);

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

	static jsi::Value instantiateBinding(jsi::Runtime& rt, bindings::BindEntry* binding, const std::string& key);

public:
	// Adds binding(), externalBinding(), isExternalCommonJsModule() and getExternalCommonJsModule()
	// to the "kroll" object.
	static void initFunctions(jsi::Runtime& rt, const jsi::Object& exports);

	// The "natives" binding: the source text of the built-in JS files.
	static void initNatives(jsi::Runtime& rt, const jsi::Object& exports);

	// The "Titanium" binding: the Proxy base class and the top-level module.
	static void initTitanium(jsi::Runtime& rt, const jsi::Object& exports);
	static void disposeTitanium(jsi::Runtime& rt);

	// The source text of kroll.js.
	static std::string getMainSource();

	// Retrieves and instances a native binding by name.
	// Returns the exports object, or undefined if no binding has this name.
	static jsi::Value getBinding(jsi::Runtime& rt, const std::string& binding);

	// Grabs the external binding by name. Binding must have been added via addExternalBinding().
	static bindings::BindEntry* getExternalBinding(const char *name, unsigned int length);

	// Used by native modules to register a binding by name.
	static void addExternalBinding(const char *name, bindings::BindEntry *binding);

	// Used by native modules to register a function that can look up native
	// bindings. This can effectively register multiple bindings at once.
	static void addExternalLookup(LookupFunction lookup);

	static void addExternalCommonJsModule(const char *name, jobject sourceProvider, jmethodID sourceRetrievalMethod);

	static void dispose(jsi::Runtime& rt);
};

} // namespace titanium

#endif
