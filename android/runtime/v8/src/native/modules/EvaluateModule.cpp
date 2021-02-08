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
	Persistent<String> EvaluateModule::MODULE_REF_STRING;
	Persistent<String> EvaluateModule::REQUIRE_STRING;

	static void assign(Local<Object> source, Local<Data> destination)
	{
		Local<Context> context = source->CreationContext();

		// Obtain source properties.
		Local<Array> keys = source->GetOwnPropertyNames(context).ToLocalChecked();

		for (int i = 0; i < keys->Length(); i++) {
			Local<String> key = keys->Get(context, i).ToLocalChecked().As<String>();
			Local<Value> value = source->Get(context, key).ToLocalChecked();

			if (!key.IsEmpty() && !value.IsEmpty()) {

				if (destination->IsValue()) {

					// Destination is an object, set property from source.
					destination.As<Value>().As<Object>()->Set(context, key, value);

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
		Isolate* isolate = context->GetIsolate();

		if (DEFAULT_STRING.IsEmpty()) {
			DEFAULT_STRING.Reset(isolate, STRING_NEW(isolate, "default"));
		}
		if (EXPORTS_STRING.IsEmpty()) {
			EXPORTS_STRING.Reset(isolate, STRING_NEW(isolate, "exports"));
		}
		if (MODULE_STRING.IsEmpty()) {
			MODULE_STRING.Reset(isolate, STRING_NEW(isolate, "module"));
		}
		if (MODULE_REF_STRING.IsEmpty()) {
			MODULE_REF_STRING.Reset(isolate, STRING_NEW(isolate, "__module_ref"));
		}
		if (REQUIRE_STRING.IsEmpty()) {
			REQUIRE_STRING.Reset(isolate, STRING_NEW(isolate, "require"));
		}

		SetMethod(context, isolate, target, "runAsModule", EvaluateModule::RunAsModule);
	}

	MaybeLocal<Module> EvaluateModule::ModuleCallback(Local<Context> context, Local<String> specifier, Local<Module> referrer)
	{
		Isolate* isolate = context->GetIsolate();
		Local<Object> global = context->Global();

		// Define constants.
		Local<String> REQUIRE_STRING = EvaluateModule::REQUIRE_STRING.Get(isolate);
		Local<String> DEFAULT_STRING = EvaluateModule::DEFAULT_STRING.Get(isolate);
		Local<String> MODULE_REF_STRING = EvaluateModule::MODULE_REF_STRING.Get(isolate);

		if (global->Has(context, REQUIRE_STRING).FromMaybe(false)) {

			// Obtain reference to `require` function defined in context.
			Local<Value> requireValue = global->Get(context, REQUIRE_STRING).ToLocalChecked();

			if (requireValue->IsFunction()) {
				Local<Function> requireFunction = requireValue.As<Function>();

				// Call `require` on specified module to obtain module object.
				Local<Value> result = requireFunction->Call(context, global, 1, new Local<Value>[]{ specifier })
					.FromMaybe(Object::New(isolate).As<Value>());

				// Define module export keys.
				std::vector<Local<String>> exports { DEFAULT_STRING };

				if (result->IsObject()) {
					Local<Array> keys = result.As<Object>()->GetOwnPropertyNames(context).ToLocalChecked();

					// Iterate through required module to grab exported keys.
					for (int i = 0; i < keys->Length(); i++) {
						Local<String> key = keys->Get(context, i).ToLocalChecked().As<String>();

						LOGE(TAG, "export.%s", *String::Utf8Value(isolate, key));

						if (!key->StringEquals(DEFAULT_STRING)) {
							exports.push_back(key);
						}
					}
				}

				// Reference module in context for synthetic module callback.
				global->Set(context, MODULE_REF_STRING, result);

				// Create synthetic module for the imported module.
				Local<Module> module = Module::CreateSyntheticModule(
					isolate,
					specifier,
					exports,
					[](Local<Context> context, Local<Module> module) -> MaybeLocal<Value> {
						Isolate* isolate = context->GetIsolate();
						Local<Object> global = context->Global();

						// Define constants.
						Local<String> DEFAULT_STRING = EvaluateModule::DEFAULT_STRING.Get(isolate);
						Local<String> MODULE_REF_STRING = EvaluateModule::MODULE_REF_STRING.Get(isolate);

						// Obtain module reference from context.
						Local<Value> moduleRefValue = global->Get(context, MODULE_REF_STRING).FromMaybe(Undefined(isolate).As<Value>());
						global->Delete(context, MODULE_REF_STRING);

						if (!moduleRefValue.IsEmpty() && moduleRefValue->IsObject()) {
							Local<Object> moduleRefObject = moduleRefValue.As<Object>();

							// Add exports from required module to synthetic module.
							assign(moduleRefObject, module);

							if (!moduleRefObject->GetOwnPropertyNames(context).ToLocalChecked()->Has(context, DEFAULT_STRING).FromMaybe(false)) {

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

		return MaybeLocal<Module>();
	}

	void EvaluateModule::RunAsModule(const FunctionCallbackInfo<Value>& args)
	{
		Isolate *isolate = args.GetIsolate();
		Local<Context> context = isolate->GetCurrentContext();
		// EscapableHandleScope scope(isolate);

		// Set result as undefined by default.
		args.GetReturnValue().Set(Undefined(isolate));

		if (args.Length() == 0) {
			isolate->ThrowException(
				Exception::SyntaxError(
					STRING_NEW(isolate, "Missing arguments, requires at least 'code' argument.")));
			return;
		}

		Local<String> code = args[0].As<String>();
		Local<String> filename = args.Length() > 1 && args[1]->IsString()
		 	? args[1].As<String>() : STRING_NEW(isolate, "<anonymous>");
		Local<Object> contextObj = args.Length() > 2 && args[2]->IsObject()
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
		Local<Module> module = maybeModule.ToLocalChecked();

		// Obtain runtime global context.
		Local<Context> runtimeContext = V8Runtime::GlobalContext();

		// Create new context for module to run in.
		Local<Context> moduleContext = ModuleContext::New(runtimeContext, contextObj);
		Context::Scope contextScope(moduleContext);

		// Obtain module global context.
		Local<Object> moduleGlobal = moduleContext->Global();

		// Instantiate module and process imports via `ModuleCallback`.
		module->InstantiateModule(moduleContext, ModuleCallback);
		if (module->GetStatus() == Module::kErrored) {

			// Throw any exceptions from module instantiation.
			isolate->ThrowException(module->GetException());
			return;
		}
		if (module->GetStatus() != Module::kInstantiated) {
			LOGE(TAG, "Could not instantiate module '%s' (Status: %d)", *String::Utf8Value(isolate, filename), module->GetStatus());
			isolate->TerminateExecution();
			return;
		}

		LOGE(TAG, "Evaluating '%s'...", *String::Utf8Value(isolate, filename));

		// Execute module, obtaining a result.
		MaybeLocal<Value> maybeResult = module->Evaluate(moduleContext);
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
		Local<Value> result = maybeResult.ToLocalChecked();

		if(result->IsPromise()) {
			Local<Promise> promise = result.As<Promise>();

			// When top-level-await is enabled, modules return a `Promise`.
			// Wait for the promise to fulfill before obtaining module exports.
			while (promise->State() == Promise::kPending) {

				// Allow promise to fulfill.
				isolate->PerformMicrotaskCheckpoint();
			}

			Local<String> DEFAULT_STRING = EvaluateModule::DEFAULT_STRING.Get(isolate);
			Local<String> EXPORTS_STRING = EvaluateModule::EXPORTS_STRING.Get(isolate);
			Local<String> MODULE_STRING = EvaluateModule::MODULE_STRING.Get(isolate);

			// Obtain module exports as result.
			Local<Object> moduleNamespace = module->GetModuleNamespace().As<Object>();
			if (moduleNamespace->Has(context, DEFAULT_STRING).FromMaybe(false)) {
				result = moduleNamespace->Get(context, DEFAULT_STRING).FromMaybe(moduleNamespace.As<Value>());
			} else {
				result = moduleNamespace;
			}

			// Include exports into 'module.exports'.
			if (moduleGlobal->HasRealNamedProperty(context, MODULE_STRING).FromMaybe(false)) {
				Local<Value> moduleValue = moduleGlobal->GetRealNamedProperty(context, MODULE_STRING).ToLocalChecked();

				if (!moduleValue.IsEmpty() && moduleValue->IsObject()) {
					Local<Object> moduleObj = moduleValue.As<Object>();

					if (moduleObj->HasRealNamedProperty(context, EXPORTS_STRING).FromMaybe(false)) {
						Local<Value> exportsValue = moduleObj->GetRealNamedProperty(context, EXPORTS_STRING).ToLocalChecked();

						if (!exportsValue.IsEmpty() && exportsValue->IsObject()) {
							Local<Object> exportsObj = exportsValue.As<Object>();

							if (exportsObj->GetPropertyNames()->Length() == 0) {
								moduleObj->Set(context, EXPORTS_STRING, result);
							}
						}
					}
				}
			}
		}

		// Return result.
		args.GetReturnValue().Set(result);
	}
}
