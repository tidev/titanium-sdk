/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
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

// A native object which is wrapped by a JavaScript object.
// Once the wrapping JavaScript object is no longer reachable
// this native object will be automatically deleted. This is
// used to store "user data" in the JavaScript object for use
// inside method and property callbacks.

// https://github.com/nodejs/node/blob/master/src/node_object_wrap.h
class NativeObject
{
 public:
  NativeObject() {
    refs_ = 0;
  }


  virtual ~NativeObject() {
    if (persistent().IsEmpty())
      return;
    assert(persistent().IsNearDeath());
    persistent().ClearWeak();
    persistent().Reset();
  }


  template <class T>
  static inline T* Unwrap(v8::Local<v8::Object> handle) {
    assert(!handle.IsEmpty());
    assert(handle->InternalFieldCount() > 0);
    // Cast to NativeObject before casting to T.  A direct cast from void
    // to T won't work right when T has more than one base class.
    void* ptr = handle->GetAlignedPointerFromInternalField(0);
    NativeObject* wrap = static_cast<NativeObject*>(ptr);
    return static_cast<T*>(wrap);
  }


  inline v8::Local<v8::Object> handle() {
    return handle(v8::Isolate::GetCurrent());
  }


  inline v8::Local<v8::Object> handle(v8::Isolate* isolate) {
    return persistent().Get(isolate);
  }


  inline v8::Persistent<v8::Object>& persistent() {
    return handle_;
  }


 protected:
  inline void Wrap(v8::Local<v8::Object> handle) {
    assert(persistent().IsEmpty());
    assert(handle->InternalFieldCount() > 0);
    handle->SetAlignedPointerInInternalField(0, this);
    persistent().Reset(v8::Isolate::GetCurrent(), handle);
    MakeWeak();
  }


  inline void MakeWeak(void) {
    persistent().SetWeak(this, WeakCallback, v8::WeakCallbackType::kParameter);
  }

  /* Ref() marks the object as being attached to an event loop.
   * Refed objects will not be garbage collected, even if
   * all references are lost.
   */
  virtual void Ref() {
    assert(!persistent().IsEmpty());
    persistent().ClearWeak();
    refs_++;
  }

  /* Unref() marks an object as detached from the event loop.  This is its
   * default state.  When an object with a "weak" reference changes from
   * attached to detached state it will be freed. Be careful not to access
   * the object after making this call as it might be gone!
   * (A "weak reference" means an object that only has a
   * persistent handle.)
   *
   * DO NOT CALL THIS FROM DESTRUCTOR
   */
  virtual void Unref() {
    assert(!persistent().IsEmpty());
    if (refs_ > 0) {
      refs_--;
      if (0 == refs_) {
        MakeWeak();
      }
    }
  }

  int refs_;  // ro

 private:
  static void WeakCallback(const v8::WeakCallbackInfo<NativeObject>& data) {
    NativeObject* wrap = data.GetParameter();
    assert(wrap->refs_ == 0);
    assert(wrap->handle_.IsNearDeath());
    wrap->handle_.Reset();
    delete wrap;
  }

  v8::Persistent<v8::Object> handle_;

	friend class ProxyFactory;
};

}

#endif /* NATIVEOBJECT_H_ */
