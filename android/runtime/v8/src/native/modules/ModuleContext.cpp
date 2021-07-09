/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>

#include "AndroidUtil.h"
#include "ModuleContext.h"
#include "V8Util.h"

#define TAG "ModuleContext"

namespace titanium {
	using namespace v8;

	Persistent<String> ModuleContext::PROTOTYPE_STRING;
	Persistent<Set, CopyablePersistentTraits<Set>> ModuleContext::BUILTINS;

	Local<Name> Uint32ToName(Local<Context> context, uint32_t index)
	{
		return Uint32::New(context->GetIsolate(), index)->ToString(context).ToLocalChecked();
	}

	bool IsModule(Local<Context> context)
	{
		return context->GetNumberOfEmbedderDataFields() > 0;
	}

	Local<Object> ModuleContext::GetPrototype(Local<Context> context, Local<Object> object)
	{
		auto isolate = context->GetIsolate();

		if (ModuleContext::PROTOTYPE_STRING.IsEmpty()) {
			ModuleContext::PROTOTYPE_STRING.Reset(isolate, STRING_NEW(isolate, "prototype"));
		}
		auto prototypeString = ModuleContext::PROTOTYPE_STRING.Get(isolate);

		if (!object.IsEmpty() && object->IsObject() && object->HasRealNamedProperty(prototypeString)) {
			auto prototypeValue = object->GetRealNamedProperty(context, prototypeString);

			if (!prototypeValue.IsEmpty()) {
				auto prototype = prototypeValue.ToLocalChecked();

				if (!prototype.IsEmpty() && prototype->IsObject()) {
					return prototype.As<Object>();
				}
			}
		}
		return {};
	}

	bool ModuleContext::SetHandlersEnabled(Local<Context> context, bool enabled)
	{
		bool current = true;

		if (IsModule(context)) {
			auto data = context->GetEmbedderData(EmbedderIndex::kData).As<Array>();

			current = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>()->Value();
			data->Set(context, DataIndex::kHandlersEnabled, Boolean::New(context->GetIsolate(), enabled));
		}
		return current;
	}

	void ModuleContext::CopyPrototypes(Local<Context> sourceContext, Local<Context> destinationContext)
	{
		if (ModuleContext::BUILTINS.IsEmpty()) {
			return;
		}

		auto isolate = destinationContext->GetIsolate();
		auto context = IsModule(destinationContext) ? destinationContext : sourceContext;
		auto builtins = ModuleContext::BUILTINS.Get(isolate)->AsArray();
		int builtinsLength = builtins->Length();

		// Temporarily disable context callback handlers.
		bool sourceHandlersEnabled = SetHandlersEnabled(sourceContext, false);
		bool destinationHandlersEnabled = SetHandlersEnabled(destinationContext, false);

		for (int i = 0; i < builtinsLength; i++) {
			auto key = builtins->Get(context, i).ToLocalChecked().As<String>();

			auto sourceBuiltins = sourceContext->Global();
			auto destinationBuiltins = destinationContext->Global();

			if (destinationBuiltins->HasRealNamedProperty(key)) {
				auto sourceBuiltinValue = sourceBuiltins->GetRealNamedProperty(context, key).ToLocalChecked();
				auto destinationBuiltinValue = destinationBuiltins->GetRealNamedProperty(context, key).ToLocalChecked();

				auto sourceBuiltinPrototype = GetPrototype(context, sourceBuiltinValue.As<Object>());
				auto destinationBuiltinPrototype = GetPrototype(context, destinationBuiltinValue.As<Object>());

				if (!sourceBuiltinPrototype.IsEmpty() && !destinationBuiltinPrototype.IsEmpty()) {
					auto sourceProperties = sourceBuiltinPrototype->GetOwnPropertyNames(
						context,
						static_cast<v8::PropertyFilter>(ALL_PROPERTIES),
						KeyConversionMode::kConvertToString
					).ToLocalChecked();
					int sourcePropertiesLength = sourceProperties->Length();

					for (int i = 0; i < sourcePropertiesLength; i++) {
						auto key = sourceProperties->Get(context, i).ToLocalChecked().As<String>();

						if (key->IsSymbol()) {
							continue;
						}

						if (destinationBuiltinPrototype->HasRealNamedProperty(context, key).FromMaybe(false)) {
							auto destinationDescriptorValue = destinationBuiltinPrototype->GetOwnPropertyDescriptor(context, key).ToLocalChecked().As<Object>();
							std::unique_ptr<PropertyDescriptor> destinationDescriptor(V8Util::objectToDescriptor(context, destinationDescriptorValue));

							if (destinationDescriptor && !destinationDescriptor->writable()) {

								// Destination is not writable, skip.
								continue;
							}
						}

						auto sourceDescriptorValue = sourceBuiltinPrototype->GetOwnPropertyDescriptor(context, key).ToLocalChecked().As<Object>();
						std::unique_ptr<PropertyDescriptor> sourceDescriptor(V8Util::objectToDescriptor(context, sourceDescriptorValue));
						if (sourceDescriptor == nullptr) {
							continue;
						}

						destinationBuiltinPrototype->DefineProperty(context, key, *sourceDescriptor);
					}
				}
			}
		}

		// Restore context callback handler state.
		SetHandlersEnabled(sourceContext, sourceHandlersEnabled);
		SetHandlersEnabled(destinationContext, destinationHandlersEnabled);
	}

	Local<Context> ModuleContext::New(Local<Context> context, Local<Object> extensions)
	{
		auto isolate = context->GetIsolate();
		EscapableHandleScope scope(isolate);

		// Create template for callbacks.
		auto callbackTemplate = ObjectTemplate::New(isolate);

		// Setup data array for handlers.
		auto data = Array::New(isolate, 3);

		// Determine if handlers should be active.
		data->Set(context, DataIndex::kHandlersEnabled, Boolean::New(isolate, false));
		data->Set(context, DataIndex::kParentGlobal, context->Global());
		data->Set(context, DataIndex::kExtensions, extensions);

		callbackTemplate->SetHandler(
			NamedPropertyHandlerConfiguration(
				GetterCallback,
				SetterCallback,
				QueryCallback,
				DeleterCallback,
				EnumeratorCallback,
				DefinerCallback,
				DescriptorCallback,
				data
			)
		);
		callbackTemplate->SetHandler(
			IndexedPropertyHandlerConfiguration(
				IndexedGetterCallback,
				IndexedSetterCallback,
				IndexedQueryCallback,
				IndexedDeleterCallback,
				IndexedEnumeratorCallback,
				IndexedDefinerCallback,
				IndexedDescriptorCallback,
				data
			)
		);

		// Create new module context with callback template.
		auto moduleContext = Context::New(isolate, nullptr, callbackTemplate);

		// Use same security token as parent context.
		moduleContext->SetSecurityToken(context->GetSecurityToken());

		auto moduleGlobal = moduleContext->Global();

		// Obtain builtin names.
		if (ModuleContext::BUILTINS.IsEmpty()) {
			auto prototype = moduleGlobal->GetPrototype().As<Object>();
			auto prototypes = prototype->GetOwnPropertyNames(
				moduleContext,
				static_cast<v8::PropertyFilter>(ALL_PROPERTIES),
				KeyConversionMode::kConvertToString
			).FromMaybe(Local<Array>());
			int prototypesLength = prototypes->Length();

			auto names = Set::New(isolate);
			for (int i = 0; i < prototypesLength; i++) {
				auto name = prototypes->Get(moduleContext, i).ToLocalChecked().As<String>();

				names->Add(context, name);
			}

			// Remove context dependent builtins.
			names->Delete(moduleContext, STRING_NEW(isolate, "globalThis"));
			names->Delete(moduleContext, STRING_NEW(isolate, "console"));

			ModuleContext::BUILTINS.Reset(isolate, names);
		}

		// Embed data array.
		moduleContext->SetEmbedderData(EmbedderIndex::kData, data);

		// Extend module context with extensions.
		if (!extensions.IsEmpty()) {
			V8Util::objectExtend(moduleGlobal, extensions);
		}

		// Activate handlers.
		data->Set(context, DataIndex::kHandlersEnabled, Boolean::New(isolate, true));

		return scope.Escape(moduleContext);
	}

	void ModuleContext::GetterCallback(Local<Name> property, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		auto data = info.Data().As<Array>();
		auto handlersEnabled = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>();
		auto parentGlobal = data->Get(context, DataIndex::kParentGlobal).ToLocalChecked().As<Object>();
		auto extensions = data->Get(context, DataIndex::kExtensions).ToLocalChecked().As<Object>();

		if (!handlersEnabled->Value()) {
			return;
		}

		if (!ModuleContext::BUILTINS.IsEmpty()
				&& ModuleContext::BUILTINS.Get(isolate)->Has(context, property).FromMaybe(false)) {
			return;
		}

		if (!extensions->HasRealNamedProperty(context, property).FromMaybe(false)
				&& parentGlobal->HasRealNamedProperty(context, property).FromMaybe(false)) {
			auto value = parentGlobal->GetRealNamedProperty(context, property).ToLocalChecked();

			// Property defined on parent global, return property.
			info.GetReturnValue().Set(value);
		}
	}

	void ModuleContext::SetterCallback(Local<Name> property, Local<Value> value, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		auto data = info.Data().As<Array>();
		auto handlersEnabled = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>();
		auto parentGlobal = data->Get(context, DataIndex::kParentGlobal).ToLocalChecked().As<Object>();
		auto extensions = data->Get(context, DataIndex::kExtensions).ToLocalChecked().As<Object>();

		if (!handlersEnabled->Value()) {
			return;
		}

		if (!ModuleContext::BUILTINS.IsEmpty()
				&& ModuleContext::BUILTINS.Get(isolate)->Has(context, property).FromMaybe(false)) {
			return;
		}

		auto attributes = PropertyAttribute::None;

		if (!extensions->HasRealNamedProperty(context, property).FromMaybe(false)
				&& parentGlobal->GetRealNamedPropertyAttributes(context, property).To(&attributes)) {
			bool readOnly = static_cast<int>(attributes) & static_cast<int>(PropertyAttribute::ReadOnly);

			if (!readOnly) {

				// Property defined on parent global, overwrite property.
				parentGlobal->CreateDataProperty(context, property, value);

				// Do not set on module global.
				info.GetReturnValue().Set(false);
			}
		}
	}

	void ModuleContext::QueryCallback(Local<Name> property, const PropertyCallbackInfo<Integer>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		auto data = info.Data().As<Array>();
		auto handlersEnabled = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>();
		auto parentGlobal = data->Get(context, DataIndex::kParentGlobal).ToLocalChecked().As<Object>();
		auto extensions = data->Get(context, DataIndex::kExtensions).ToLocalChecked().As<Object>();

		if (!handlersEnabled->Value()) {
			return;
		}

		if (!ModuleContext::BUILTINS.IsEmpty()
				&& ModuleContext::BUILTINS.Get(isolate)->Has(context, property).FromMaybe(false)) {
			return;
		}

		auto attributes = PropertyAttribute::None;

		if (!extensions->HasRealNamedProperty(context, property).FromMaybe(false)
				&& parentGlobal->GetRealNamedPropertyAttributes(context, property).To(&attributes)) {

			// Property defined on parent global, return attributes.
			info.GetReturnValue().Set(attributes);
		}
	}

	void ModuleContext::DeleterCallback(Local<Name> property, const PropertyCallbackInfo<Boolean>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		auto data = info.Data().As<Array>();
		auto handlersEnabled = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>();
		auto parentGlobal = data->Get(context, DataIndex::kParentGlobal).ToLocalChecked().As<Object>();
		auto extensions = data->Get(context, DataIndex::kExtensions).ToLocalChecked().As<Object>();

		if (!handlersEnabled->Value()) {
			return;
		}

		if (!ModuleContext::BUILTINS.IsEmpty()
				&& ModuleContext::BUILTINS.Get(isolate)->Has(context, property).FromMaybe(false)) {
			return;
		}

		if (!extensions->HasRealNamedProperty(context, property).FromMaybe(false)
				&& parentGlobal->HasRealNamedProperty(context, property).FromMaybe(false)) {

			// Delete property from parent global.
			parentGlobal->Delete(context, property);
		}
	}

	void ModuleContext::EnumeratorCallback(const PropertyCallbackInfo<Array>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();
		auto moduleGlobal = context->Global();

		auto data = info.Data().As<Array>();
		auto handlersEnabled = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>();
		auto parentGlobal = data->Get(context, DataIndex::kParentGlobal).ToLocalChecked().As<Object>();

		if (!handlersEnabled->Value()) {
			return;
		}

		// Obtain properties from parent global.
		auto parentProperties = parentGlobal->GetPropertyNames(context).ToLocalChecked();
		
		// Obtain properties from module global.
		auto moduleProperties = moduleGlobal->GetPropertyNames(context).ToLocalChecked();

		// Create set to store all property names.
		auto properties = Set::New(isolate);
		for (int i = 0; i < parentProperties->Length(); i++) {
			auto name = parentProperties->Get(context, i).ToLocalChecked().As<String>();

			properties->Add(context, name);
		}
		for (int i = 0; i < moduleProperties->Length(); i++) {
			auto name = moduleProperties->Get(context, i).ToLocalChecked().As<String>();

			properties->Add(context, name);
		}

		// Return all properties.
		info.GetReturnValue().Set(properties->AsArray());
	}

	void ModuleContext::DefinerCallback(Local<Name> property, const PropertyDescriptor& desc, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		auto data = info.Data().As<Array>();
		auto handlersEnabled = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>();
		auto parentGlobal = data->Get(context, DataIndex::kParentGlobal).ToLocalChecked().As<Object>();
		auto extensions = data->Get(context, DataIndex::kExtensions).ToLocalChecked().As<Object>();

		if (!handlersEnabled->Value()) {
			return;
		}

		if (!ModuleContext::BUILTINS.IsEmpty()
				&& ModuleContext::BUILTINS.Get(isolate)->Has(context, property).FromMaybe(false)) {
			return;
		}

		auto attributes = PropertyAttribute::None;

		if (!extensions->HasRealNamedProperty(context, property).FromMaybe(false)
				&& parentGlobal->GetRealNamedPropertyAttributes(context, property).To(&attributes)) {
			bool readOnly = static_cast<int>(attributes) & static_cast<int>(PropertyAttribute::ReadOnly);

			if (!readOnly) {

				// Property defined on main global, overwrite property.
				parentGlobal->DefineProperty(context, property, const_cast<PropertyDescriptor &>(desc));

				// Do not set on module global.
				info.GetReturnValue().Set(false);
			}
		}
	}

	void ModuleContext::DescriptorCallback(Local<Name> property, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		auto data = info.Data().As<Array>();
		auto handlersEnabled = data->Get(context, DataIndex::kHandlersEnabled).ToLocalChecked().As<Boolean>();
		auto parentGlobal = data->Get(context, DataIndex::kParentGlobal).ToLocalChecked().As<Object>();
		auto extensions = data->Get(context, DataIndex::kExtensions).ToLocalChecked().As<Object>();

		if (!handlersEnabled->Value()) {
			return;
		}

		if (!ModuleContext::BUILTINS.IsEmpty()
				&& ModuleContext::BUILTINS.Get(isolate)->Has(context, property).FromMaybe(false)) {
			return;
		}

		if (!extensions->HasRealNamedProperty(context, property).FromMaybe(false)
				&& parentGlobal->HasRealNamedProperty(context, property).FromMaybe(false)) {
			auto descriptor = parentGlobal->GetOwnPropertyDescriptor(context, property).ToLocalChecked();

			// Property defined on parent global, return descriptor.
			info.GetReturnValue().Set(descriptor);
		}
	}

	void ModuleContext::IndexedGetterCallback(uint32_t index, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		ModuleContext::GetterCallback(Uint32ToName(context, index), info);
	}

	void ModuleContext::IndexedSetterCallback(uint32_t index, Local<Value> value, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		ModuleContext::SetterCallback(Uint32ToName(context, index), value, info);
	}

	void ModuleContext::IndexedQueryCallback(uint32_t index, const PropertyCallbackInfo<Integer>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		ModuleContext::QueryCallback(Uint32ToName(context, index), info);
	}

	void ModuleContext::IndexedDeleterCallback(uint32_t index, const PropertyCallbackInfo<Boolean>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		ModuleContext::DeleterCallback(Uint32ToName(context, index), info);
	}

	void ModuleContext::IndexedEnumeratorCallback(const PropertyCallbackInfo<Array>& info)
	{
		ModuleContext::EnumeratorCallback(info);
	}

	void ModuleContext::IndexedDefinerCallback(uint32_t index, const PropertyDescriptor& desc, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		ModuleContext::DefinerCallback(Uint32ToName(context, index), desc, info);
	}

	void ModuleContext::IndexedDescriptorCallback(uint32_t index, const PropertyCallbackInfo<Value>& info)
	{
		auto isolate = info.GetIsolate();
		auto context = isolate->GetCurrentContext();

		ModuleContext::DescriptorCallback(Uint32ToName(context, index), info);
	}
}
