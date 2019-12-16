/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef V8_RUNTIME_H
#define V8_RUNTIME_H

#include <jni.h>
#include <v8.h>

using namespace v8;

namespace titanium {
class V8Runtime
{
public:
	static Persistent<Context> globalContext;
	static Persistent<Object> krollGlobalObject;
	static Persistent<Array> moduleContexts;
	
	static Isolate* v8_isolate;
	static std::unique_ptr<v8::Platform> platform;

	static jobject javaInstance;

	static void collectWeakRef(Persistent<Value> ref, void *parameter);
	static void bootstrap(Local<Context> globalContext);

	static bool debuggerEnabled;
	static bool DBG;
	static bool initialized;

	static Persistent<Object> moduleObject;
	static Persistent<Function> runModuleFunction;

	static Local<Object> Global();
	static Local<Object> ModuleObject();
	static Local<Context> GlobalContext();
	static Local<Function> RunModuleFunction();
	static Local<Array> ModuleContexts();
};
}
;

#endif
