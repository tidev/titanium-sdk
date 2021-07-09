/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef MODULE_CONTEXT_H
#define MODULE_CONTEXT_H

namespace titanium {
	using namespace v8;

	class ModuleContext {
	public:
			enum EmbedderIndex {
				kReference = 0,
				kData = 1
			};
			enum DataIndex {
				kHandlersEnabled = 0,
				kParentGlobal = 1,
				kExtensions = 2
			};

			static void CopyPrototypes(Local<Context> sourceContext, Local<Context> destinationContext);
			static Local<Context> New(Local<Context> context, Local<Object> extensions = Local<Object>());

		private:
			static Persistent<String> PROTOTYPE_STRING;
			static Persistent<Set, CopyablePersistentTraits<Set>> BUILTINS;

			static Local<Object> GetPrototype(Local<Context> context, Local<Object> object);
			static bool SetHandlersEnabled(Local<Context> context, bool enabled);

			static void GetterCallback(Local<Name> property, const PropertyCallbackInfo<Value>& info);
			static void SetterCallback(Local<Name> property, Local<Value> value, const PropertyCallbackInfo<Value>& info);
			static void QueryCallback(Local<Name> property, const PropertyCallbackInfo<Integer>& info);
			static void DeleterCallback(Local<Name> property, const PropertyCallbackInfo<Boolean>& info);
			static void EnumeratorCallback(const PropertyCallbackInfo<Array>& info);
			static void DefinerCallback(Local<Name> property, const PropertyDescriptor& desc, const PropertyCallbackInfo<Value>& info);
			static void DescriptorCallback(Local<Name> property, const PropertyCallbackInfo<Value>& info);

			static void IndexedGetterCallback(uint32_t index, const PropertyCallbackInfo<Value>& info);
			static void IndexedSetterCallback(uint32_t index, Local<Value> value, const PropertyCallbackInfo<Value>& info);
			static void IndexedQueryCallback(uint32_t index, const PropertyCallbackInfo<Integer>& info);
			static void IndexedDeleterCallback(uint32_t index, const PropertyCallbackInfo<Boolean>& info);
			static void IndexedEnumeratorCallback(const PropertyCallbackInfo<Array>& info);
			static void IndexedDefinerCallback(uint32_t index, const PropertyDescriptor& desc, const PropertyCallbackInfo<Value>& info);
			static void IndexedDescriptorCallback(uint32_t index, const PropertyCallbackInfo<Value>& info);
	};
}
#endif
