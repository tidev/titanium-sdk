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

JavaObject::JavaObject()
	: EventEmitter()
	, javaObject_(NULL)
	, refTableKey_(0)
{
	UPDATE_STATS(1, 1);
}

JavaObject::~JavaObject()
{
	UPDATE_STATS(-1, 0);

	// If we have anything wrapped, get rid of it in JNI/JVM
	if (javaObject_ || refTableKey_ > 0) {
		deleteGlobalRef();
	}
  LOGD(TAG, "Is near death? %s", persistent().IsNearDeath() ? "true" : "false");
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
	// make strong ref to Java object in JVM
	newGlobalRef();
}

// Create a strong reference to the wrapped Java object
// to prevent it from becoming garbage collected by Dalvik.
void JavaObject::newGlobalRef()
{
	ASSERT(javaObject_ != NULL);

	if (useGlobalRefs) {
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		javaObject_ = env->NewGlobalRef(javaObject_);
		ASSERT(javaObject_ != NULL);
	} else {
		ASSERT(refTableKey_ == 0); // make sure we haven't already stored something
		refTableKey_ = ReferenceTable::createReference(javaObject_); // make strong ref on Java side
		javaObject_ = NULL; // toss out the java object copy here, it's in ReferenceTable's HashMap
		ASSERT(refTableKey_ != 0);
		ASSERT(javaObject_ == NULL);
	}
}

// Deletes the reference to the wrapped Java object.
// This should only happen once this object is no longer
// needed and about to be deleted.
void JavaObject::deleteGlobalRef()
{
	if (useGlobalRefs) {
    LOGD(TAG, "Deleting global ref");
		JNIEnv *env = JNIUtil::getJNIEnv();
		ASSERT(env != NULL);
		ASSERT(javaObject_ != NULL);
		JNIUtil::removePointer(javaObject_);
		env->DeleteGlobalRef(javaObject_);
		javaObject_ = NULL;
	} else {
    LOGD(TAG, "Deleting ref in ReferenceTable");
		ReferenceTable::destroyReference(refTableKey_); // Kill the Java side
		refTableKey_ = 0; // throw away the key
	}
	// When we're done we should be wrapping nothing!
	LOGD(TAG, "Making sure javaObject_ is NULL");
	ASSERT(javaObject_ == NULL);
  LOGD(TAG, "Making sure refKey is 0");
	ASSERT(refTableKey_ == 0);
}

}
