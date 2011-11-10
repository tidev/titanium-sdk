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

#include "EventEmitter.h"
#include "NativeObject.h"

namespace titanium {

class JavaObject : public EventEmitter
{
public:
	// Creates a new V8 proxy for a Java object.
	// This proxy keeps a reference to the Java object
	// and provides a bridge between Dalvik and V8.
	JavaObject(jobject javaObject);
	virtual ~JavaObject();

	static bool isJavaObject(v8::Handle<v8::Object> jsObject)
	{
		if (jsObject->InternalFieldCount() > 0) {
			return true;
		}
		return false;
	}

	// When useGlobalRefs is false, you MUST DeleteLocalRef()
	// the returned jobject when you are done using it.
	jobject getJavaObject();

	// True when we use global refs for the wrapped jobject.
	// This is false for the emulator since it has a low limit
	// of how many global refs you can hold. Instead we use an internal
	// hash map for holding onto references to avoid this limit.
	static bool useGlobalRefs;
private:
	jobject javaObject_;
	int refIndex;

	void newGlobalRef();
	void deleteGlobalRef();
};

} // namespace titanium

#endif
