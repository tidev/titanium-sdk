/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef TI_KROLL_NATIVE_OBJECT_H
#define TI_KROLL_NATIVE_OBJECT_H

#include <assert.h>
#include <jni.h>

#include "EventEmitter.h"
#include "NativeObject.h"

// FIXME This and NativeObject duplicate a lot of functionality!
// We should be using NativeObject to Wrap/Unwrap
// but we need some of the Java specifics this provides with managing the
// reference table - moving java objects to weak or strong - and reviving
// them when getJavaObject is called, or destroying when destructor is called!
namespace titanium {

// Provides an interface between a JavaScript object
// and a Java object instance. This class is also responsible
// for mangaging the lifetime of the Java object reference
// so that it is properly collected once becoming unreachable
// from the JavaScript code.
class JavaObject : public EventEmitter
{
public:
	JavaObject();

	// Delete this object once the Java object has been finalized.
	virtual ~JavaObject();

	// Test if the JavaScript object wraps a Java object.
	static bool isJavaObject(v8::Local<v8::Object> jsObject)
	{
		return jsObject->InternalFieldCount() > 0;
	}

	// Attach to the given Java object. A reference
	// to this object will be held until it is detached.
	// You may only call this method once with a Java object.
	// Future calls are only allowed by passing NULL for javaObject
	// to trigger a re-attachment.
	void attach(jobject javaObject);

	/**
	 * MUST CALL #unreferenceJavaObject() when done with the object!
	 * @return The wrapped jobject if it's still alive, NULL otherwise
	 */
	jobject getJavaObject();

	/**
	 * Must be paired with #getJavaObject(); This releases local refs in JNI,
	 * decrements our reference counter, may make the JS object weak (eligible for GC)
	 */
	void unreferenceJavaObject();

	// True when we use global refs for the wrapped jobject.
	// This is false for the emulator since it has a low limit
	// of how many global refs you can hold. Instead we use an internal
	// hash map for holding onto references to avoid this limit.
	static bool useGlobalRefs;
private:
	/**
	 * If we're using global references, this will hold the wrapped object. Otherwise it's NULL
	 */
	jobject javaObject_;

	/**
	 * If we're not using global references, this will hold the key to look up the java object in our ReferenceTable
	 */
	jint refTableKey_;

	void newGlobalRef();
	void deleteGlobalRef();
};

} // namespace titanium

#endif
