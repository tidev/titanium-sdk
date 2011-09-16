/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef TI_KROLL_NATIVE_OBJECT_H
#define TI_KROLL_NATIVE_OBJECT_H

#include <assert.h>
#include <jni.h>
#include <v8.h>

namespace titanium {

class NativeObject
{
public:
	// Creates a new V8 proxy for a Java object.
	// This proxy keeps a reference to the Java object
	// and provides a bridge between Dalvik and V8.
	NativeObject(jobject javaObject)
			: javaObject_(javaObject)
	{
	}

	virtual ~NativeObject()
	{
		if (!handle_.IsEmpty()) {
			assert(handle_.IsNearDeath());
			handle_.ClearWeak();
			handle_->SetInternalField(0, v8::Undefined());
			handle_.Dispose();
			handle_.Clear();
		}
	}

	template<class T>
	static inline T* Unwrap(v8::Handle<v8::Object> handle)
	{
		assert(!handle.IsEmpty());
		assert(handle->InternalFieldCount() > 0);
		return static_cast<T*>(handle->GetPointerFromInternalField(0));
	}

	static bool isNativeObject(v8::Handle<v8::Object> jsObject)
	{
		if (jsObject->InternalFieldCount() > 0) {
			return true;
		}
		return false;
	}

	jobject getJavaObject()
	{
		return javaObject_;
	}


protected:
	inline void Wrap(v8::Handle<v8::Object> handle)
	{
		assert(handle_.IsEmpty());
		assert(handle->InternalFieldCount() > 0);
		handle_ = v8::Persistent < v8::Object > ::New(handle);
		handle_->SetPointerInInternalField(0, this);
		MakeWeak();
	}

	inline void MakeWeak()
	{
		handle_.MakeWeak(this, WeakCallback);
		handle_.MarkIndependent();
	}

	v8::Persistent<v8::Object> handle_;
	jobject javaObject_;

private:

	static void WeakCallback(v8::Persistent<v8::Value> value, void *data)
	{
		NativeObject *obj = static_cast<NativeObject*>(data);
		assert(value == obj->handle_);
		assert(value.IsNearDeath());
		delete obj;
	}
};

} // namespace titanium

#endif
