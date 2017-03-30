/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "AndroidUtil.h"
#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "ReferenceTable.h"

#include <v8.h>

using namespace v8;

#define TAG "JavaObject"

namespace titanium {

bool JavaObject::useGlobalRefs = true;

static jobject objectMap;

#ifdef TI_DEBUG
static struct {
	int total;
	int detached;
} stats = {0, 0};

#define UPDATE_STATS(_total, _detached) \
	stats.total += _total; \
	stats.detached += _detached; \
	LOGD(TAG, ">>> JavaObject: total=%i detached=%i <<<", stats.total, stats.detached);
#else
#define UPDATE_STATS(total, detached)
#endif

/**
 * Callback for V8 letting us know the JS object is no longer reachable.
 * Once we receive this callback we can shift from a strong to a weak Java reference
 * on the wrapped Java object so it can become eligible for GC.
 */
static void DetachCallback(const v8::WeakCallbackInfo<JavaObject>& data)
{
	JavaObject* javaObject = data.GetParameter();
	javaObject->detach();
}

JavaObject::JavaObject()
	: EventEmitter()
	, javaObject_(NULL)
	, refTableKey_(0)
	, isWeakRef_(false)
{
	UPDATE_STATS(1, 1);
}

JavaObject::~JavaObject()
{
	UPDATE_STATS(-1, 0);

	// If we have anything wrapped, get rid of it in JNI/JVM
	if (javaObject_ || refTableKey_ > 0) {
		DeleteJavaRef();
	}

	// Make sure we wipe the persistent, in case we called delete on the proxy and didn't get deleted as a result of the NativeObject WeakCallback
	persistent().Reset();
	// LOGD(TAG, "Is near death? %s", persistent().IsNearDeath() ? "true" : "false");
}

jobject JavaObject::getJavaObject()
{
	// FIXME We have issues where calling TypeConverter::jsValueToJavaObject make make a strong ref ehre that never gets cleaned up!
	// How can we handle this?
	// - Add new method that doesn't call Ref(), keep the ref weak in V8-land and it may get GC'd whenever...
	// - Improve tracking the object's usage better in our code so we eventually will unref it

	// Adding a reference implicitly to caller
	Ref();
	return getDanglingJavaObject();
}

jobject JavaObject::getDanglingJavaObject()
{
	if (useGlobalRefs) {
		return javaObject_;
	} else {
		return ReferenceTable::getReference(refTableKey_);
	}
}

void JavaObject::unreferenceJavaObject(jobject ref) {
	// Delete ref in JNI
	if (!useGlobalRefs) {
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		env->DeleteLocalRef(ref);
	}
	// unreference and make weak if no more refs
	Unref();
}

// Attaches the Java object to this native wrapper.
// This wrapper will create a global reference to the
// Java object and keep it from becoming collected by Dalvik
// until it is detached or made weak (weakGlobalRef()).
void JavaObject::attach(jobject javaObject)
{
	// Make sure we're wrapping something
	ASSERT(javaObject != NULL);
	UPDATE_STATS(0, -1);

	javaObject_ = javaObject;

	Ref(); // increment our reference counter to represent that we are...
	MakeJavaStrong(); // adding a strong reference to the the Java object we wrap in JVM-land
	// Now we should never truly kill the JS object unless the destructor is called for this Proxy explicitly,
	// or we get a notification from ReferenceTable that our Java object was GC'd and we therefore remove our reference!

	// So we've stopped the JS object from being marked fully weak for GC.
	// Now, as an ugly hack, we mark this JS object as weak in a different way so taht V8 can tell us
	// when the JS object is ready to be GCed (the first step in it's death)
	// but this time, we say call us back as a finalizer so we can resurrect the
	// object (save it from really being GCd by V8) and move it's Java object twin
	// to a weak reference in the JVM. (where we can track when that gets GC'd by the JVM to call back and kill this)
	persistent().SetWeak(this, DetachCallback, v8::WeakCallbackType::kFinalizer); // MUST BE kFinalizer or our object cannot be resurrected!
	persistent().MarkIndependent();
}

void JavaObject::detach()
{
	// WAIT A SECOND V8!!! DON'T KILL MY OBJECT YET! THE JVM MAY STILL WANT IT!
	persistent().ClearWeak();

	// if the JVM side is a weak reference or we have no object wrapped, don't do anything else
	if (isDetached()) {
		return;
	}

	// V8 says we don't need the object on the JS side
	// Let's make the object weak in the JVM now...
	UPDATE_STATS(0, 1);
	MakeJavaWeak();
}

bool JavaObject::isDetached()
{
	return (javaObject_ == NULL && refTableKey_ == 0) || isWeakRef_;
}

void JavaObject::MakeJavaStrong()
{
	ASSERT(javaObject_ != NULL);

	if (useGlobalRefs) {
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		jobject globalRef = env->NewGlobalRef(javaObject_);
		if (isWeakRef_) { // if we're going from weak back to strong...
			env->DeleteWeakGlobalRef(javaObject_);
		}
		javaObject_ = globalRef;

		// When we're done we should always have an object, but no key
		ASSERT(refTableKey_ == 0);
		ASSERT(javaObject_ != NULL);
	} else {
		if (isWeakRef_) { // if we are weak, upgrade back to strong
			ASSERT(refTableKey_ != 0);
			ReferenceTable::clearWeakReference(refTableKey_);
		} else {
			// New entry, make sure we have no key, get a new key
			ASSERT(refTableKey_ == 0); // make sure we haven't already stored something
			refTableKey_ = ReferenceTable::createReference(javaObject_); // make strong ref on Java side
			javaObject_ = NULL; // toss out the java object copy here, it's in ReferenceTable's HashMap
		}
		// When we're done we should always have a reference key, but no object
		ASSERT(refTableKey_ != 0);
		ASSERT(javaObject_ == NULL);
	}
	// no longer a weak reference
	isWeakRef_ = false;
}

void JavaObject::MakeJavaWeak()
{
	if (useGlobalRefs) {
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		ASSERT(javaObject_ != NULL);
		jweak weakRef = env->NewWeakGlobalRef(javaObject_);
		env->DeleteGlobalRef(javaObject_);
		javaObject_ = weakRef;
	} else {
		ASSERT(refTableKey_ != 0);
		ReferenceTable::makeWeakReference(refTableKey_);
	}

	isWeakRef_ = true; // remember that our ref on Java side is weak
}

void JavaObject::DeleteJavaRef()
{
	if (useGlobalRefs) {
		LOGD(TAG, "Deleting global ref");
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		ASSERT(javaObject_ != NULL);
		// Wipe the V8Object ptr value back to 0, to denote that the native C++ proxy is gone
		JNIUtil::removePointer(javaObject_);
		env->DeleteGlobalRef(javaObject_);
		javaObject_ = NULL;
	} else {
		LOGD(TAG, "Deleting ref in ReferenceTable");
		ReferenceTable::destroyReference(refTableKey_); // Kill the Java side
		refTableKey_ = 0; // throw away the key
	}
	// When we're done we should be wrapping nothing!
	ASSERT(javaObject_ == NULL);
	ASSERT(refTableKey_ == 0);
}

}
