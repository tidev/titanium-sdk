/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Original code Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
 */

#ifndef NATIVEOBJECT_H_
#define NATIVEOBJECT_H_

#include <v8.h>
#include <assert.h>

namespace titanium {

class ProxyFactory;

class NativeObject
{
public:
	NativeObject()
	{
		refs_ = 0;
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

	inline v8::Local<v8::Object> getHandle()
	{
		return v8::Local<v8::Object>::New(handle_);
	}

	template<class T>
	static inline T* Unwrap(v8::Handle<v8::Object> handle)
	{
		assert(!handle.IsEmpty());
		assert(handle->InternalFieldCount() > 0);

		return static_cast<T*>(handle->GetPointerFromInternalField(0));
	}

	v8::Persistent<v8::Object> handle_; // ro

protected:
	inline void Wrap(v8::Handle<v8::Object> handle)
	{
		assert(handle_.IsEmpty());
		assert(handle->InternalFieldCount() > 0);
		handle_ = v8::Persistent<v8::Object>::New(handle);
		handle_->SetPointerInInternalField(0, this);
		MakeWeak();
	}

	inline void MakeWeak(void)
	{
		handle_.MakeWeak(this, WeakCallback);
	}

	/* Ref() marks the object as being attached to an event loop.
	 * Refed objects will not be garbage collected, even if
	 * all references are lost.
	 */
	virtual void Ref()
	{
		assert(!handle_.IsEmpty());
		refs_++;
		handle_.ClearWeak();
	}

	/* Unref() marks an object as detached from the event loop.  This is its
	 * default state.  When an object with a "weak" reference changes from
	 * attached to detached state it will be freed. Be careful not to access
	 * the object after making this call as it might be gone!
	 * (A "weak reference" means an object that only has a
	 * persistant handle.)
	 *
	 * DO NOT CALL THIS FROM DESTRUCTOR
	 */
	virtual void Unref()
	{
		assert(!handle_.IsEmpty());
		assert(!handle_.IsWeak());
		assert(refs_ > 0);
		if (--refs_ == 0) {
			MakeWeak();
		}
	}

	int refs_; // ro

private:
	static void WeakCallback(v8::Persistent<v8::Value> value, void *data)
	{
		NativeObject *obj = static_cast<NativeObject*>(data);
		assert(value == obj->handle_);
		assert(!obj->refs_);
		assert(value.IsNearDeath());
		delete obj;
	}

	friend class ProxyFactory;
};

}

#endif /* NATIVEOBJECT_H_ */
