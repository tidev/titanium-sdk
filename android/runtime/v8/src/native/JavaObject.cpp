/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "AndroidUtil.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "ReferenceTable.h"

using namespace v8;

#define TAG "JavaObject"

namespace titanium {

bool JavaObject::useGlobalRefs = true;

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
	UPDATE_STATS(1, 1); // add one to total counter, and 'detached' counter
}

JavaObject::~JavaObject()
{
	UPDATE_STATS(-1, 0); // remove one from total counter

	// If we have anything wrapped, get rid of it in JNI/JVM
	if (javaObject_ || refTableKey_ != 0) {
		DeleteJavaRef();
	}

	// Make sure we wipe the persistent, in case we called delete on the proxy and didn't get deleted as a result of the NativeObject WeakCallback
	if (persistent().IsEmpty())
		return;
	persistent().Reset();
}

jobject JavaObject::getJavaObject()
{
	if (isWeakRef_) { // Did JS side try to collect our object already?
		MakeJavaStrong(); // move back to strong reference on Java side
		MakeJSWeak(); // ask V8 to let us know when it thinks it's dead again
	}
	if (useGlobalRefs) {
		return javaObject_;
	} else {
		ASSERT(refTableKey_ != 0);
		jobject ref = ReferenceTable::getReference(refTableKey_);
		if (ref == NULL) {
			// Sanity check. Did we get into a state where it was weak on Java, got GC'd but the C++ proxy didn't get deleted yet?
			LOGE(TAG, "!!! OH NO! We tried to grab a Java Object back out of the reference table, but it must have been GC'd, because it's null! Key: %d", refTableKey_);
		}
		return ref;
	}
}

void JavaObject::unreferenceJavaObject(jobject ref) {
	// Delete ref in JNI
	if (!useGlobalRefs) {
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		env->DeleteLocalRef(ref);
	}
}

// Attaches the Java object to this native wrapper.
// This wrapper will create a global reference to the
// Java object and keep it from becoming collected by Dalvik
// until it is detached or made weak (weakGlobalRef()).
void JavaObject::attach(jobject javaObject)
{
	// Make sure we're wrapping something
	ASSERT(javaObject != NULL);
	UPDATE_STATS(0, -1); // subtract one from the 'detached' counter

	javaObject_ = javaObject;

	Ref(); // increment our reference counter to represent that we are...
	MakeJavaStrong(); // adding a strong reference to the the Java object we wrap in JVM-land
	// Now we should never truly kill the JS object unless the destructor is called for this Proxy explicitly,
	// or we get a notification from ReferenceTable that our Java object was GC'd and we therefore remove our reference!

	MakeJSWeak();
}

void JavaObject::MakeJSWeak()
{
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
	persistent().ClearWeak(); // Make JS Strong Again!

	// if the JVM side is a weak reference or we have no object wrapped, don't do anything else
	if (isDetached()) {
		return;
	}

	// V8 says we don't need the object on the JS side
	// Let's make the object weak in the JVM now...
	MakeJavaWeak();
}

bool JavaObject::isDetached()
{
	return (javaObject_ == NULL && refTableKey_ == 0) || isWeakRef_;
}

void JavaObject::MakeJavaStrong()
{
	if (useGlobalRefs) {
		ASSERT(javaObject_ != NULL);
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		jobject globalRef = env->NewGlobalRef(javaObject_);
		if (isWeakRef_) { // if we're going from weak back to strong...
			env->DeleteWeakGlobalRef(javaObject_); // delete the weak ref we had
		}
		javaObject_ = globalRef;

		// When we're done we should always have an object, but no key
		ASSERT(refTableKey_ == 0);
		ASSERT(javaObject_ != NULL);
	} else {
		if (isWeakRef_) { // if we are weak, upgrade back to strong
			// Make sure we have a key
			ASSERT(refTableKey_ != 0);
			JNIEnv *env = JNIUtil::getJNIEnv();
			ASSERT(env != NULL);
			jobject stored = ReferenceTable::clearWeakReference(refTableKey_);
			if (stored == NULL) {
				// Sanity check. Did we get into a state where it was weak on Java, got GC'd but the C++ proxy didn't get deleted yet?
				LOGE(TAG, "!!! OH NO! We tried to move a weak Java object back to strong, but it's aleady been GC'd by JVM! We're in a bad state! Key: %d", refTableKey_);
			}
			env->DeleteLocalRef(stored);
		} else {
			// New entry, make sure we have no key, have an object, get a new key
			ASSERT(javaObject_ != NULL);
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
	UPDATE_STATS(0, -1); // one less detached
}

void JavaObject::MakeJavaWeak()
{
	// Make sure we're not trying to make a weak reference weak again!
	ASSERT(!isWeakRef_);
	if (useGlobalRefs) {
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		ASSERT(javaObject_ != NULL);
		// Convert our global ref to a weak global ref
		jweak weakRef = env->NewWeakGlobalRef(javaObject_);
		env->DeleteGlobalRef(javaObject_);
		javaObject_ = weakRef;
	} else {
		ASSERT(refTableKey_ != 0);
		ReferenceTable::makeWeakReference(refTableKey_);
	}

	UPDATE_STATS(0, 1); // add one to "detached" counter
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
		if (isWeakRef_) {
			env->DeleteWeakGlobalRef(javaObject_);
		} else {
			env->DeleteGlobalRef(javaObject_);
		}
		javaObject_ = NULL;
	} else {
		LOGD(TAG, "Deleting ref in ReferenceTable for key: %d, pointer: %p", refTableKey_, this);
		ReferenceTable::destroyReference(refTableKey_); // Kill the Java side
		refTableKey_ = 0; // throw away the key
	}
	// When we're done we should be wrapping nothing!
	ASSERT(javaObject_ == NULL);
	ASSERT(refTableKey_ == 0);
}

}
