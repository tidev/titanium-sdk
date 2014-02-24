/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
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
	typedef void (*BindCallback)(v8::Handle<v8::Object> exports);
	typedef void (*DisposeCallback)();

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
	static void initFunctions(v8::Handle<v8::Object> exports);

	static void initNatives(v8::Handle<v8::Object> exports);
	static void initTitanium(v8::Handle<v8::Object> exports);
	static void disposeTitanium();

	static v8::Handle<v8::String> getMainSource();

	static v8::Handle<v8::Value> getBinding(const v8::Arguments& args);
	static v8::Handle<v8::Object> getBinding(v8::Handle<v8::String> binding);

	static v8::Handle<v8::Value> getExternalBinding(const v8::Arguments& args);
	static void addExternalBinding(const char *name, bindings::BindEntry *binding);
	static void addExternalLookup(LookupFunction lookup);

	static void addExternalCommonJsModule(const char *name, jobject sourceProvider, jmethodID sourceRetrievalMethod);
	static v8::Handle<v8::Value> isExternalCommonJsModule(const v8::Arguments& args);
	static v8::Handle<v8::Value> getExternalCommonJsModule(const v8::Arguments& args);

	static void dispose();
};

} // namespace titanium

#endif
