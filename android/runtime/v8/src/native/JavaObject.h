/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef TI_KROLL_NATIVE_OBJECT_H
#define TI_KROLL_NATIVE_OBJECT_H

#include <jni.h>

#include "EventEmitter.h"

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

	/**
	 * Attach to the given Java object. A reference to this object will be held until it is detached.
	 * You may only call this method once with a Java object.
	 * We will call JavaObject::MakeJavaStrong() to create a strong reference to the Java object in the JVM-side.
	 * We'll also call NativeObject::Ref() to increment our internal reference counter to avoid getting GC'd on the V8/JS side.
	 *
	 * @param javaObject [description]
	 */
	void attach(jobject javaObject);

	/**
	 * Convert to a weak reference on the Java object so it may be collected (by the JVM)
	 * Called through the DetachCallback when the associated JS object was triggered for GC.
	 */
	void detach();

	/**
	 * Determines if we are 'detached'. In real terms this means we either:
	 * - Are wrapping no java object (so javaObject_ == NULL && refTableKey_ == 0)
	 * - OR we've been informed by V8 that the JS object is GC-able and we've made the Java reference a weak one
	 *
	 * This is useful to know if we're being asked to release the proxy, then we can truly kill it if this is true. Otherwise we should wait until V8 and the JVM want it dead.
	 */
	bool isDetached();

	/**
	 * Determines if our Java object maintains a weak reference
	 */
	bool isWeak();

	/**
	 * If possible call #unreferenceJavaObject() when done with the object so we can clean up the local JNI reference
	 *
	 * @return The wrapped jobject if it's still alive, NULL otherwise
	 */
	jobject getJavaObject();

	/**
	 * Must be paired with #getJavaObject(); This releases local refs in JNI,
	 * decrements our reference counter, may make the JS object weak (eligible for GC)
	 */
	void unreferenceJavaObject(jobject ref);

private:
	/**
	 * If we're using global references, this will hold the wrapped object. Otherwise it's NULL
	 */
	jobject javaObject_;

	/**
	 * If we're not using global references, this will hold the key to look up the java object in our ReferenceTable. Otherwise it is 0.
	 */
	jlong refTableKey_;

	/**
	 * If we've converted the Java side reference to a weak once, this will be true. If it is strong, this will be false.
	 */
	bool isWeakRef_;

	/**
	 * Create a strong reference to the wrapped Java object in the JVM
	 * to prevent it from becoming GC'd.
	 */
	void MakeJavaStrong();

	/**
	 * Convert our strong reference to the Java object into a weak
	 * reference to allow it to become eligible for GC by JVM.
	 * This typically happens once V8 has detected the JavaScript object
	 * that wraps the Java object is no longer reachable via DetachCallback (after a MakeJSWeak() registers it).
	 * The next step in truly GC'ing/killing the object would be an explicit V8Object.nativeRelease() call,
	 * or the WeakReference getting GC'd by the JVM, and us collecting that info
	 * from V8Runtime.java's idle looper, and funneling it down through
	 * ReferenceTable.nativeRelease to release the corresponding titanium::Proxy.
	 */
	void MakeJavaWeak();

	/**
	 * Delete any references to the Java object in our Reference Table or JNI.
	 * This is to clean up the Java side when this Proxy pair has been deleted.
	 */
	void DeleteJavaRef();

	/**
	 * Registers the JS object as weak, so we get a callback when it thinks it can be GC'd.
	 * This is the first 'step' in really killing off the pairing. We typically follow up by calling MakeJavaWeak().
	 */
	void MakeJSWeak();
};

} // namespace titanium

#endif
