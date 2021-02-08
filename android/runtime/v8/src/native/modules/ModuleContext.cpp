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

	Local<Name> Uint32ToName(Local<Context> context, uint32_t index)
	{
		return Uint32::New(context->GetIsolate(), index)->ToString(context).ToLocalChecked();
	}

	Local<Context> ModuleContext::New(Local<Context> context, Local<Object> extensions)
	{
		Isolate *isolate = context->GetIsolate();
		EscapableHandleScope scope(isolate);

		// Create template for callbacks.
		Local<ObjectTemplate> module_template = ObjectTemplate::New(isolate);

		module_template->SetHandler(
			NamedPropertyHandlerConfiguration(
				GetterCallback,
				SetterCallback,
				QueryCallback,
				DeleterCallback,
				EnumeratorCallback,
				DefinerCallback,
				DescriptorCallback,
				context->Global().As<Value>()
			)
		);
		module_template->SetHandler(
			IndexedPropertyHandlerConfiguration(
				IndexedGetterCallback,
				IndexedSetterCallback,
				IndexedQueryCallback,
				IndexedDeleterCallback,
				IndexedEnumeratorCallback,
				IndexedDefinerCallback,
				IndexedDescriptorCallback,
				context->Global().As<Value>()
			)
		);

		// Create new module context with template.
		Local<Context> module_context = Context::New(isolate, nullptr, module_template);

		// Set same security token of main context.
		module_context->SetSecurityToken(context->GetSecurityToken());

		// Extend module context with extensions.
		if (!extensions.IsEmpty()) {
			V8Util::objectExtend(module_context->Global(), extensions);
		}

		return scope.Escape(module_context);
	}

	void ModuleContext::GetterCallback(Local<Name> property, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();
		Local<Object> main_global = info.Data().As<Object>();

		if (main_global->HasRealNamedProperty(context, property).FromMaybe(false)) {
			Local<Value> value = main_global->GetRealNamedProperty(context, property).ToLocalChecked();

			// Property defined on main global, return property.
			info.GetReturnValue().Set(value);
		}
	}

	void ModuleContext::SetterCallback(Local<Name> property, Local<Value> value, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();
		Local<Object> main_global = info.Data().As<Object>();

		auto attributes = PropertyAttribute::None;

		if (main_global->GetRealNamedPropertyAttributes(context, property).To(&attributes)) {
			bool readOnly = static_cast<int>(attributes) & static_cast<int>(PropertyAttribute::ReadOnly);

			if (!readOnly) {

				// Property defined on main global, overwrite property.
				main_global->Set(context, property, value);

				// Do not set on module global.
				info.GetReturnValue().Set(false);
			}
		}
	}

	void ModuleContext::QueryCallback(Local<Name> property, const PropertyCallbackInfo<Integer>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();
		Local<Object> main_global = info.Data().As<Object>();

		auto attributes = PropertyAttribute::None;

		if (main_global->GetRealNamedPropertyAttributes(context, property).To(&attributes)) {

			// Property defined on main global, return attributes.
			info.GetReturnValue().Set(attributes);
		}
	}

	void ModuleContext::DeleterCallback(Local<Name> property, const PropertyCallbackInfo<Boolean>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();
		Local<Object> main_global = info.Data().As<Object>();

		if (main_global->HasRealNamedProperty(context, property).FromMaybe(false)) {

			// Delete property from main global.
			main_global->Delete(context, property);
		}
	}

	void ModuleContext::EnumeratorCallback(const PropertyCallbackInfo<Array>& info)
	{
		Isolate* isolate = info.GetIsolate();
		Local<Context> context = info.Holder()->CreationContext();
		Local<Object> main_global = info.Data().As<Object>();
		Local<Object> module_global = context->Global();

		// Obtain properties from main global.
		Local<Array> main_properties = main_global->GetPropertyNames(context).ToLocalChecked();
		
		// Obtain properties from module global.
		Local<Array> module_properties = module_global->GetPropertyNames(context).ToLocalChecked();

		// Create object to store all property names.
		// This is an easy way to remove duplicate entries.
		Local<Object> properties = Object::New(isolate);

		for (int i = 0; i < main_properties->Length(); i++) {
			Local<String> name = main_properties->Get(context, i).ToLocalChecked().As<String>();

			properties->Set(context, name, Local<Value>());
		}
		for (int i = 0; i < module_properties->Length(); i++) {
			Local<String> name = module_properties->Get(context, i).ToLocalChecked().As<String>();

			properties->Set(context, name, Local<Value>());
		}

		// Return all properties.
		info.GetReturnValue().Set(properties->GetPropertyNames(context).ToLocalChecked());
	}

	void ModuleContext::DefinerCallback(Local<Name> property, const PropertyDescriptor& desc, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();
		Local<Object> main_global = info.Data().As<Object>();

		auto attributes = PropertyAttribute::None;

		if (main_global->GetRealNamedPropertyAttributes(context, property).To(&attributes)) {
			bool readOnly = static_cast<int>(attributes) & static_cast<int>(PropertyAttribute::ReadOnly);

			if (!readOnly) {

				// Property defined on main global, overwrite property.
				main_global->DefineProperty(context, property, const_cast<PropertyDescriptor &>(desc));

				// Do not set on module global.
				info.GetReturnValue().Set(false);
			}
		}
	}

	void ModuleContext::DescriptorCallback(Local<Name> property, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();
		Local<Object> main_global = info.Data().As<Object>();

		if (main_global->HasRealNamedProperty(context, property).FromMaybe(false)) {

			// Property defined on main global, return descriptor.
			info.GetReturnValue().Set(main_global->GetOwnPropertyDescriptor(context, property).ToLocalChecked());
		}
	}

	void ModuleContext::IndexedGetterCallback(uint32_t index, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();

		ModuleContext::GetterCallback(Uint32ToName(context, index), info);
	}

	void ModuleContext::IndexedSetterCallback(uint32_t index, Local<Value> value, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();

		ModuleContext::SetterCallback(Uint32ToName(context, index), value, info);
	}

	void ModuleContext::IndexedQueryCallback(uint32_t index, const PropertyCallbackInfo<Integer>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();

		ModuleContext::QueryCallback(Uint32ToName(context, index), info);
	}

	void ModuleContext::IndexedDeleterCallback(uint32_t index, const PropertyCallbackInfo<Boolean>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();

		ModuleContext::DeleterCallback(Uint32ToName(context, index), info);
	}

	void ModuleContext::IndexedEnumeratorCallback(const PropertyCallbackInfo<Array>& info)
	{
		ModuleContext::EnumeratorCallback(info);
	}

	void ModuleContext::IndexedDefinerCallback(uint32_t index, const PropertyDescriptor& desc, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();

		ModuleContext::DefinerCallback(Uint32ToName(context, index), desc, info);
	}

	void ModuleContext::IndexedDescriptorCallback(uint32_t index, const PropertyCallbackInfo<Value>& info)
	{
		Local<Context> context = info.Holder()->CreationContext();

		ModuleContext::DescriptorCallback(Uint32ToName(context, index), info);
	}
}
