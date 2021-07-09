/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>

#include "AndroidUtil.h"
#include "EvaluateModule.h"
#include "ModuleContext.h"
#include "V8Util.h"
#include "V8Runtime.h"

#define TAG "EvaluateModule"

namespace titanium {
	using namespace v8;

	Persistent<String> EvaluateModule::DEFAULT_STRING;
	Persistent<String> EvaluateModule::EXPORTS_STRING;
	Persistent<String> EvaluateModule::MODULE_STRING;
	Persistent<String> EvaluateModule::REQUIRE_STRING;

	static void assign(Local<Object> source, Local<Data> destination)
	{
		auto context = source->CreationContext();

		// Obtain source properties.
		auto keys = source->GetOwnPropertyNames(context).ToLocalChecked();

		for (int i = 0; i < keys->Length(); i++) {
			auto key = keys->Get(context, i).ToLocalChecked().As<String>();
			auto value = source->GetRealNamedProperty(context, key).ToLocalChecked();

			if (!key.IsEmpty() && !value.IsEmpty()) {

				if (destination->IsValue()) {

					// Destination is an object, set property from source.
					destination.As<Value>().As<Object>()->CreateDataProperty(context, key, value);

				} else if (destination->IsModule()) {

					// Destination is a synthetic module, set property from source.
					destination.As<Module>()->SetSyntheticModuleExport(context->GetIsolate(), key, value);
				} else {

					// Unknown destination, do not continue.
					break;
				}
			}
		}
	}

	void EvaluateModule::Initialize(Local<Object> target, Local<Context> context)
	{
		auto isolate = context->GetIsolate();

		if (DEFAULT_STRING.IsEmpty()) {
			DEFAULT_STRING.Reset(isolate, STRING_NEW(isolate, "default"));
		}
		if (EXPORTS_STRING.IsEmpty()) {
			EXPORTS_STRING.Reset(isolate, STRING_NEW(isolate, "exports"));
		}
		if (MODULE_STRING.IsEmpty()) {
			MODULE_STRING.Reset(isolate, STRING_NEW(isolate, "module"));
		}
		if (REQUIRE_STRING.IsEmpty()) {
			REQUIRE_STRING.Reset(isolate, STRING_NEW(isolate, "require"));
		}

		SetMethod(context, isolate, target, "runAsModule", EvaluateModule::RunAsModule);
	}

	MaybeLocal<Module> EvaluateModule::ModuleCallback(Local<Context> context, Local<String> specifier, Local<Module> referrer)
	{
		auto isolate = context->GetIsolate();
		auto global = context->Global();

		// Define constants.
		auto REQUIRE_STRING = EvaluateModule::REQUIRE_STRING.Get(isolate);
		auto DEFAULT_STRING = EvaluateModule::DEFAULT_STRING.Get(isolate);

		if (global->HasOwnProperty(context, REQUIRE_STRING).FromMaybe(false)) {

			// Obtain reference to `require` function defined in context.
			auto requireValue = global->GetRealNamedProperty(context, REQUIRE_STRING).ToLocalChecked();

			if (requireValue->IsFunction()) {
				auto requireFunction = requireValue.As<Function>();

				// Call `require` on specified module to obtain module object.
				auto result = requireFunction->Call(context, global, 1, new Local<Value>[]{ specifier })
					.FromMaybe(Object::New(isolate).As<Value>());

				// Define module export keys.
				std::vector<Local<String>> exports { DEFAULT_STRING };

				if (result->IsObject()) {
					auto keys = result.As<Object>()->GetOwnPropertyNames(context).ToLocalChecked();
					int keysLength = keys->Length();

					// Iterate through required module to grab exported keys.
					for (int i = 0; i < keysLength; i++) {
						auto key = keys->Get(context, i).ToLocalChecked().As<String>();

						if (!key->StringEquals(DEFAULT_STRING)) {
							exports.push_back(key);
						}
					}
				}

				// Reference module in context for synthetic module callback.
				context->SetEmbedderData(ModuleContext::EmbedderIndex::kReference, result);

				// Create synthetic module for the imported module.
				Local<Module> module = Module::CreateSyntheticModule(
					isolate,
					specifier,
					exports,
					[](Local<Context> context, Local<Module> module) -> MaybeLocal<Value> {
						auto isolate = context->GetIsolate();

						// Define constants.
						auto DEFAULT_STRING = EvaluateModule::DEFAULT_STRING.Get(isolate);

						// Obtain module reference from context.
						auto moduleRefValue = context->GetEmbedderData(ModuleContext::EmbedderIndex::kReference);

						if (!moduleRefValue.IsEmpty() && moduleRefValue->IsObject()) {
							auto moduleRefObject = moduleRefValue.As<Object>();

							// Add exports from required module to synthetic module.
							assign(moduleRefObject, module);

							if (!moduleRefObject->HasOwnProperty(context, DEFAULT_STRING).FromMaybe(false)) {

								// Always define default export.
								module->SetSyntheticModuleExport(isolate, DEFAULT_STRING, moduleRefObject);
							}
						} else {

							// Required module did not export object, set as default export anyway.
							module->SetSyntheticModuleExport(isolate, DEFAULT_STRING, moduleRefValue);
						}

						return Undefined(isolate);
					}
				);

				// Instantiate and evaluate to define synthetic module exports.
				module->InstantiateModule(context, nullptr);
				module->Evaluate(context);

				assert(module->GetModuleNamespace().As<Object>()->GetOwnPropertyNames(context).ToLocalChecked()->Length() == exports.size());

				return module;
			}
		}

		return {};
	}

	void EvaluateModule::RunAsModule(const FunctionCallbackInfo<Value>& args)
	{
		auto isolate = args.GetIsolate();
		auto context = isolate->GetEnteredContext();

		// Set result as undefined by default.
		args.GetReturnValue().Set(Undefined(isolate));

		if (args.Length() == 0) {
			isolate->ThrowException(
				Exception::SyntaxError(
					STRING_NEW(isolate, "Missing arguments, requires at least 'code' argument.")));
			return;
		}

		auto code = args[0].As<String>();
		auto filename = args.Length() > 1 && args[1]->IsString()
		 	? args[1].As<String>() : STRING_NEW(isolate, "<anonymous>");
		auto contextObj = args.Length() > 2 && args[2]->IsObject()
		   ? args[2].As<Object>() : Local<Object>();

		ScriptOrigin origin(filename,
			Local<Integer>(),
			Local<Integer>(),
			Local<Boolean>(),
			Local<Integer>(),
			Local<Value>(),
			Local<Boolean>(),
			Local<Boolean>(),
			Boolean::New(isolate, true));
		ScriptCompiler::Source source(code, origin);

		MaybeLocal<Module> maybeModule;
		{
			TryCatch tryCatch(isolate);

			// Attempt to compile module source code.
			maybeModule = ScriptCompiler::CompileModule(isolate, &source);
			if (tryCatch.HasCaught()) {
				tryCatch.ReThrow();
				return;
			}
		}
		if (maybeModule.IsEmpty()) {
			return;
		}
		auto module = maybeModule.ToLocalChecked();

		// Create new context for module to run in.
		auto moduleContext = ModuleContext::New(V8Runtime::GlobalContext(), contextObj);
		Context::Scope moduleScope(moduleContext);

		// Obtain module global context.
		auto moduleGlobal = moduleContext->Global();

		ModuleContext::CopyPrototypes(context, moduleContext);

		// Instantiate module and process imports via `ModuleCallback`.
		module->InstantiateModule(moduleContext, ModuleCallback);
		if (module->GetStatus() == Module::kErrored) {

			// Throw any exceptions from module instantiation.
			isolate->ThrowException(module->GetException());
			return;
		}
		if (module->GetStatus() != Module::kInstantiated) {
			LOGE(TAG, "Could not instantiate module '%s' (status: %d)", *String::Utf8Value(isolate, filename), module->GetStatus());
			isolate->TerminateExecution();
			return;
		}

		// Execute module, obtaining a result.
		auto maybeResult = module->Evaluate(moduleContext);
		if (module->GetStatus() == Module::kErrored) {

			// Throw any exceptions from module evaluation.
			isolate->ThrowException(module->GetException());
			return;
		}
		if (maybeResult.IsEmpty()) {

			// NOTE: This should never happen.
			LOGW(TAG, "Evaluating module '%s' returned no result.", *String::Utf8Value(isolate, filename));
			return;
		}
		auto result = maybeResult.ToLocalChecked();

		if(result->IsPromise()) {
			auto promise = result.As<Promise>();

			// When top-level-await is enabled, modules return a `Promise`.
			// Wait for the promise to fulfill before obtaining module exports.
			while (promise->State() == Promise::kPending) {

				// Allow promise to fulfill.
				isolate->PerformMicrotaskCheckpoint();
			}

			auto DEFAULT_STRING = EvaluateModule::DEFAULT_STRING.Get(isolate);
			auto EXPORTS_STRING = EvaluateModule::EXPORTS_STRING.Get(isolate);
			auto MODULE_STRING = EvaluateModule::MODULE_STRING.Get(isolate);

			// Obtain module exports as result.
			auto moduleNamespace = module->GetModuleNamespace().As<Object>();
			if (moduleNamespace->HasRealNamedProperty(context, DEFAULT_STRING).FromMaybe(false)) {
				result = moduleNamespace->GetRealNamedProperty(context, DEFAULT_STRING).FromMaybe(moduleNamespace.As<Value>());
			} else {
				result = moduleNamespace;
			}

			if (moduleGlobal->HasRealNamedProperty(context, MODULE_STRING).FromMaybe(false)) {
				auto moduleValue = moduleGlobal->GetRealNamedProperty(context, MODULE_STRING).ToLocalChecked();

				if (!moduleValue.IsEmpty() && moduleValue->IsObject()) {
					auto moduleObj = moduleValue.As<Object>();

					if (moduleObj->HasRealNamedProperty(context, EXPORTS_STRING).FromMaybe(false)) {
						auto exportsValue = moduleObj->GetRealNamedProperty(context, EXPORTS_STRING).ToLocalChecked();

						if (exportsValue->IsObject()) {

							// Include exports into 'module.exports'.
							V8Util::objectExtend(exportsValue.As<Object>(), result.As<Object>());
						}

						// Set result as 'module.exports'.
						result = exportsValue;
					}
				}
			}
		}

		ModuleContext::CopyPrototypes(moduleContext, context);

		// Return result.
		args.GetReturnValue().Set(result);
	}
}
