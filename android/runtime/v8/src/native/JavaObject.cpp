/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
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

// Callback for V8 letting us know the JavaScript object is no longer reachable.
// Once we receive this callback we can safely release our strong reference
// on the wrapped Java object so it can become eligible for collection.
static void DetachCallback(const v8::WeakCallbackData<v8::Object, JavaObject>& data)
{
	JavaObject* javaObject = data.GetParameter();
	javaObject->detach();
}

JavaObject::JavaObject(jobject javaObject)
	: EventEmitter()
	, javaObject_(NULL)
	, refTableKey_(0)
	, isWeakRef_(false)
{
	UPDATE_STATS(1, 1);

	if (javaObject) {
		attach(javaObject);
	}
}

// Create a strong reference to the wrapped Java object
// to prevent it from becoming garbage collected by Dalvik.
void JavaObject::newGlobalRef()
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	ASSERT(env != NULL);

	if (useGlobalRefs) {
		ASSERT(javaObject_ != NULL);
		jobject globalRef = env->NewGlobalRef(javaObject_);
		if (isWeakRef_) {
			env->DeleteWeakGlobalRef(javaObject_);
			isWeakRef_ = false;
		}
		javaObject_ = globalRef;
	} else {
		ASSERT(refTableKey_ == 0); // make sure we haven't already stored something
		refTableKey_ = ReferenceTable::createReference(javaObject_); // make strong ref on Java side
		javaObject_ = NULL; // toss out the java object copy here, it's in ReferenceTable's HashMap
	}
}

// Returns a global reference to the wrapped Java object.
// If the object has become "detached" this will re-attach
// it to ensure the Java object will not get collected.
jobject JavaObject::getJavaObject()
{
	if (useGlobalRefs) {
		ASSERT(javaObject_ != NULL);

		// We must always return a valid Java proxy reference.
		// Otherwise we risk crashing in the calling code.
		// If we are "detached" we will re-attach whenever the Java
		// proxy is requested.
		if (isDetached()) {
			attach(NULL);
		}

		return javaObject_;
	} else {
		if (isWeakRef_) { // Did JS side try to collect our object already?
			// OH SNAP, DON'T KILL OUR OBJECT YET JVM!
			// make reference strong again on Java side if we can...
			jobject javaObject = ReferenceTable::clearWeakReference(refTableKey_);
			UPDATE_STATS(0, -1);
			if (javaObject == NULL) {
				// SHIT! Java collected it. ummmm, not much we can do here.
				// Maybe we can... Nope. It's gone. Live with it.
				LOGE(TAG, "Java object reference has been invalidated.");
			}

			isWeakRef_ = false; // not weak on Java side anymore

			// tell V8 to let us know when it thinks the JS object can be collected again
			persistent().SetWeak(this, DetachCallback);
			persistent().MarkIndependent();

			return javaObject;
		}
		return ReferenceTable::getReference(refTableKey_);
	}
}

// Convert our strong reference to the Java object into a weak
// reference to allow it to become eligible for collection by Dalvik.
// This typically happens once V8 has detected the JavaScript object
// that wraps the Java object is no longer reachable.
void JavaObject::weakGlobalRef()
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	ASSERT(env != NULL);

	if (useGlobalRefs) {
		ASSERT(javaObject_ != NULL);
		jweak weakRef = env->NewWeakGlobalRef(javaObject_);
		env->DeleteGlobalRef(javaObject_);
		javaObject_ = weakRef;
	} else {
		// Make our strong reference weak on Java side
		// Dead man walking
		ReferenceTable::makeWeakReference(refTableKey_);
	}

	isWeakRef_ = true; // remember that our ref on Java side is weak
}

// Deletes the reference to the wrapped Java object.
// This should only happen once this object is no longer
// needed and about to be deleted.
void JavaObject::deleteGlobalRef()
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	ASSERT(env != NULL);

	if (useGlobalRefs) {
		ASSERT(javaObject_ != NULL);
		if (isWeakRef_) {
			env->DeleteWeakGlobalRef(javaObject_);
		} else {
			env->DeleteGlobalRef(javaObject_);
		}
		javaObject_ = NULL;
	} else {
		ReferenceTable::destroyReference(refTableKey_); // Kill the Java side
		refTableKey_ = 0; // throw away the key
	}
}

JavaObject::~JavaObject()
{
	UPDATE_STATS(-1, isDetached() ? -1 : 0);

	if (javaObject_ || refTableKey_ > 0) {
		deleteGlobalRef();
	}

	if (persistent().IsEmpty())
		return;
	assert(persistent().IsNearDeath());
	persistent().ClearWeak();
	persistent().Reset();
}

void JavaObject::wrap(Isolate* isolate, Local<Object> jsObject)
{
	ASSERT(persistent().IsEmpty());
	ASSERT(jsObject->InternalFieldCount() > 0);
	jsObject->SetAlignedPointerInInternalField(0, this);
	persistent().Reset(isolate, jsObject);
}

// Attaches the Java object to this native wrapper.
// This wrapper will create a global reference to the
// Java object and keep it from becoming collected by Dalvik
// until it is detached or made weak (weakGlobalRef()).
void JavaObject::attach(jobject javaObject)
{
	ASSERT((javaObject && javaObject_ == NULL) || javaObject == NULL);
	UPDATE_STATS(0, -1);

	if (javaObject) {
		javaObject_ = javaObject;
	}
	// make strong ref to Java object in JVM
	newGlobalRef();

	// So let's mark this JS object as independent and weak so V8 can tell us
	// when the JS object is ready to be GCed, which is first step in it's death
	persistent().SetWeak(this, DetachCallback);
	persistent().MarkIndependent();
}

void JavaObject::detach()
{
	// WAIT A SECOND V8!!! DON'T KILL MY OBJECT YET! THE JVM MAY STILL WANT IT!
	persistent().ClearWeak();

	if (isDetached()) {
		return;
	}

	// V8 says we don't need the object on the JS side
	// Let's make the object weak in the JVM now...
	UPDATE_STATS(0, 1);
	weakGlobalRef();
}

bool JavaObject::isDetached()
{
	return (javaObject_ == NULL && refTableKey_ == 0) || isWeakRef_;
}

}
