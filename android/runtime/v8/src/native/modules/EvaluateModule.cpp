/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>

#include "AndroidUtil.h"
#include "EvaluateModule.h"
#include "V8Util.h"
#include "V8Runtime.h"

#define TAG "EvaluateModule"

namespace titanium {
	using namespace v8;

	Persistent<String> EvaluateModule::DEFAULT_STRING;
	Persistent<String> EvaluateModule::REQUIRE_STRING;
	Persistent<String> EvaluateModule::MODULE_REF_STRING;

	static void assign(Local<Object> source, Local<Data> destination)
	{
		Local<Array> keys = source->GetOwnPropertyNames();

		for (int i = 0; i < keys->Length(); i++) {
			Local<String> key = keys->Get(i).As<String>();
			Local<Value> value = source->Get(key);

			if (!key.IsEmpty() && !value.IsEmpty()) {
				if (destination->IsValue()) {
					destination.As<Value>().As<Object>()->Set(key, value);
				} else if (destination->IsModule()) {
					destination.As<Module>()->SetSyntheticModuleExport(V8Runtime::v8_isolate, key, value);
				} else {
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
		if (REQUIRE_STRING.IsEmpty()) {
			REQUIRE_STRING.Reset(isolate, STRING_NEW(isolate, "require"));
		}
		if (MODULE_REF_STRING.IsEmpty()) {
			MODULE_REF_STRING.Reset(isolate, STRING_NEW(isolate, "__module_ref"));
		}

		SetMethod(context, isolate, target, "runAsModule", EvaluateModule::RunAsModule);
		SetMethod(context, isolate, target, "runAsScript", EvaluateModule::RunAsScript);
	}

	MaybeLocal<Module> EvaluateModule::ModuleCallback(Local<Context> context, Local<String> specifier, Local<Module> referrer)
	{
		Isolate* isolate = context->GetIsolate();
		Local<Object> global = context->Global();

		// Define constants.
		Local<String> REQUIRE_STRING = EvaluateModule::REQUIRE_STRING.Get(isolate);
		Local<String> DEFAULT_STRING = EvaluateModule::DEFAULT_STRING.Get(isolate);
		Local<String> MODULE_REF_STRING = EvaluateModule::MODULE_REF_STRING.Get(isolate);

		if (global->Has(REQUIRE_STRING)) {

			// Obtain reference to `require` function defined in context.
			Local<Value> requireValue = global->Get(REQUIRE_STRING);

			if (requireValue->IsFunction()) {
				Local<Function> requireFunction = requireValue.As<Function>();

				// Call `require` on specified module to obtain module object.
				Local<Value> result = requireFunction->Call(context, global, 1, new Local<Value>[]{ specifier }).ToLocalChecked();

				// Define module export keys.
				std::vector<Local<String>> exports { DEFAULT_STRING };

				if (result->IsObject()) {
					Local<Array> keys = result.As<Object>()->GetOwnPropertyNames();

					// Iterate through required module to grab exported keys.
					for (int i = 0; i < keys->Length(); i++) {
						Local<String> key = keys->Get(i).As<String>();

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

						TryCatch tryCatch(isolate);

						// Obtain module reference from context.
						Local<Value> moduleRefValue = global->Get(context, MODULE_REF_STRING).ToLocalChecked();
						global->Delete(context, MODULE_REF_STRING).FromJust();

						if (moduleRefValue->IsObject()) {
							Local<Object> moduleRefObject = moduleRefValue.As<Object>();

							// Add exports from required module to synthetic module.
							assign(moduleRefObject, module);

							if (!moduleRefObject->GetOwnPropertyNames()->Has(DEFAULT_STRING)) {

								// Always define default export.
								module->SetSyntheticModuleExport(isolate, DEFAULT_STRING, moduleRefObject);
							}
						} else {

							// Required module did not export object, set as default export anyway.
							module->SetSyntheticModuleExport(isolate, DEFAULT_STRING, moduleRefValue);
						}

						if (tryCatch.HasCaught()) {
							V8Util::openJSErrorDialog(isolate, tryCatch);
							V8Util::reportException(isolate, tryCatch, true);
						}

						return Undefined(isolate);
					}
				);

				return module;
			}
		}

		return MaybeLocal<Module>();
	}

	void EvaluateModule::RunAsModule(const FunctionCallbackInfo<Value>& args)
	{
		Isolate* isolate = args.GetIsolate();
		Local<Context> context = isolate->GetCurrentContext();

		if (args.Length() == 0) {
			isolate->ThrowException(
				Exception::TypeError(
					STRING_NEW(isolate, "Missing arguments, requires at least 'code' argument.")));
			return;
		}

		Local<String> code = args[0].As<String>();
		Local<String> filename = args.Length() > 1
			&& args[1]->IsString()
				? args[1].As<String>() : STRING_NEW(isolate, "<anonymous>");
		Local<Object> contextObj = args.Length() > 2
			&& args[2]->IsObject()
				? args[2].As<Object>() : Local<Object>();

		TryCatch tryCatch(isolate);
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

		// Attempt to compile module source code.
		MaybeLocal<Module> maybeModule = ScriptCompiler::CompileModule(isolate, &source);
		if (tryCatch.HasCaught()) {
			V8Util::openJSErrorDialog(isolate, tryCatch);
			V8Util::reportException(isolate, tryCatch, true);
			return;
		}
		if (maybeModule.IsEmpty()) {
			args.GetReturnValue().Set(v8::Undefined(isolate));
			return;
		}
		Local<Module> module = maybeModule.ToLocalChecked();

		// Obtain runtime global context.
		Local<Context> runtimeContext = V8Runtime::GlobalContext();
		Local<Object> runtimeGlobal = runtimeContext->Global();

		// Create new context for module to run in.
		Local<Context> moduleContext = Context::New(isolate);
		Context::Scope contextScope(moduleContext);

		// Obtain module global context.
		Local<Object> moduleGlobal = moduleContext->Global();

		// Set security token from previous context to access properties.
		moduleContext->SetSecurityToken(context->GetSecurityToken());

		// Set runtime global properties in module global context.
		assign(runtimeGlobal, moduleGlobal);

		if (!contextObj.IsEmpty()) {

			// Context object has been provided, set context properties in module global context.
			assign(contextObj, moduleGlobal);
		}

		// Instantiate module and process imports via `ModuleCallback`.
		module->InstantiateModule(moduleContext, ModuleCallback);

		if (module->GetStatus() == Module::kErrored) {

			// Throw any exceptions from module instantiation.
			isolate->ThrowException(module->GetException());
		}
		if (tryCatch.HasCaught()) {
			V8Util::openJSErrorDialog(isolate, tryCatch);
			V8Util::reportException(isolate, tryCatch, true);
			return;
		}

		// Execute module, obtaining a result.
		MaybeLocal<Value> maybeResult = module->Evaluate(moduleContext);

		if (module->GetStatus() == Module::kErrored) {

			// Throw any exceptions from module evaluation.
			isolate->ThrowException(module->GetException());
		}
		if (tryCatch.HasCaught()) {
			V8Util::openJSErrorDialog(isolate, tryCatch);
			V8Util::reportException(isolate, tryCatch, true);
			return;
		}
		if (maybeResult.IsEmpty()) {

			// NOTE: This should never happen.
			LOGW(TAG, "Evaluating module '%s' returned no result.", *String::Utf8Value(isolate, filename));

			// No result found, return undefined.
			args.GetReturnValue().Set(Undefined(isolate));
			return;
		}
		Local<Value> result = maybeResult.ToLocalChecked();

		if(result->IsPromise()) {
			Local<Promise> promise = result.As<Promise>();

			// When top-level-await is enabled, modules return a `Promise`.
			// Wait for the promise to fulfill before obtaining module exports.
			if (promise->State() == Promise::kPending) {

				// Allow promise to fulfill.
				isolate->PerformMicrotaskCheckpoint();
			}
			if (module->GetStatus() == Module::kErrored) {

				// Throw any exceptions from promise.
				isolate->ThrowException(module->GetException());
			}
			if (tryCatch.HasCaught()) {
				V8Util::openJSErrorDialog(isolate, tryCatch);
				V8Util::reportException(isolate, tryCatch, true);
				return;
			}

			// Obtain module exports as result.
			result = module->GetModuleNamespace().As<Object>();
		}

		// Return result.
		args.GetReturnValue().Set(result);
	}

	void EvaluateModule::RunAsScript(const FunctionCallbackInfo<Value>& args)
	{
		Isolate* isolate = args.GetIsolate();
		Local<Context> context = isolate->GetCurrentContext();

		if (args.Length() < 1) {
			isolate->ThrowException(
				Exception::TypeError(
					STRING_NEW(isolate, "Missing arguments, requires at least 'code' argument.")));
			return;
		}

		Local<String> code = args[0].As<String>();
		Local<String> filename = args.Length() > 1
			&& args[1]->IsString()
				? args[1].As<String>() : STRING_NEW(isolate, "<anonymous>");
		Local<Object> contextObj = args.Length() > 2
			&& args[2]->IsObject()
				? args[2].As<Object>() : Local<Object>();

		TryCatch tryCatch(isolate);

		// Obtain runtime global context.
		Local<Context> runtimeContext = V8Runtime::GlobalContext();
		Local<Object> runtimeGlobal = runtimeContext->Global();

		// Create new context for script to run in.
		Local<Context> scriptContext = Context::New(isolate);
		Context::Scope scope(scriptContext);

		// Obtain script global context.
		Local<Object> scriptGlobal = scriptContext->Global();

		// Set security token from previous context to access properties.
		scriptContext->SetSecurityToken(context->GetSecurityToken());

		// Set runtime global properties in script global context.
		assign(runtimeGlobal, scriptGlobal);

		if (!contextObj.IsEmpty()) {

			// Context object has been provided, set context properties in script global context.
			assign(contextObj, scriptGlobal);
		}

		ScriptOrigin origin(filename);

		// Compile script.
		MaybeLocal<Script> maybeScript = Script::Compile(scriptContext, code, &origin);
		if (tryCatch.HasCaught()) {
			V8Util::openJSErrorDialog(isolate, tryCatch);
			V8Util::reportException(isolate, tryCatch, true);
			return;
		}
		if (maybeScript.IsEmpty()) {
			isolate->ThrowException(Exception::TypeError(STRING_NEW(isolate, "Failed to compile script.")));
			args.GetReturnValue().Set(v8::Undefined(isolate));
			return;
		}
		Local<Script> script = maybeScript.ToLocalChecked();

		// Execute script.
		MaybeLocal<Value> maybeResult = script->Run(scriptContext);
		if (tryCatch.HasCaught()) {
			V8Util::openJSErrorDialog(isolate, tryCatch);
			V8Util::reportException(isolate, tryCatch, true);
			return;
		}
		if (maybeResult.IsEmpty()) {

			// No result found, return undefined.
			args.GetReturnValue().Set(v8::Undefined(isolate));
			return;
		}

		args.GetReturnValue().Set(maybeResult.ToLocalChecked());
	}
}
