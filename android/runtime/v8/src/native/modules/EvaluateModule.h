/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef EVALUATE_MODULE_H
#define EVALUATE_MODULE_H

#include "../NativeObject.h"

namespace titanium {
	using namespace  v8;

	class EvaluateModule {
		public:
			static void Initialize(Local<Object> target, Local<Context> context);
			static void Dispose(Isolate* isolate);

			static void GlobalSetterCallback(Local<String> key, Local<Value> value, const PropertyCallbackInfo<Value>& info);
			static MaybeLocal<Module> ModuleCallback(Local<Context> context, Local<String> specifier, Local<Module> referrer);

			static void RunAsModule(const FunctionCallbackInfo<Value> &args);

		private:
			static Persistent<String> DEFAULT_STRING;
			static Persistent<String> EXPORTS_STRING;
			static Persistent<String> MODULE_REF_STRING;
			static Persistent<String> REQUIRE_STRING;

			static std::vector<Persistent<Context, CopyablePersistentTraits<Context>>> module_contexts;
	};
}
#endif
