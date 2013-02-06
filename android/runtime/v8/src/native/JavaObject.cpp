/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
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

static void DetachCallback(v8::Persistent<v8::Value> value, void *data)
{
	JavaObject *javaObject = static_cast<JavaObject*>(data);
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
		ASSERT(refTableKey_ == 0);
		refTableKey_ = ReferenceTable::createReference(javaObject_);
		javaObject_ = NULL;
	}
}

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
		if (isWeakRef_) {
			UPDATE_STATS(0, -1);
			jobject javaObject = ReferenceTable::clearWeakReference(refTableKey_);
			if (javaObject == NULL) {
				LOGE(TAG, "Java object reference has been invalidated.");
			}
			isWeakRef_ = false;
			handle_.MakeWeak(this, DetachCallback);
			return javaObject;
		}
		return ReferenceTable::getReference(refTableKey_);
	}
}

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
		ReferenceTable::makeWeakReference(refTableKey_);
	}

	isWeakRef_ = true;
}

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
		ReferenceTable::destroyReference(refTableKey_);
		refTableKey_ = 0;
	}
}

JavaObject::~JavaObject()
{
	UPDATE_STATS(-1, isDetached() ? -1 : 0);

	if (javaObject_ || refTableKey_ > 0) {
		deleteGlobalRef();
	}
}

void JavaObject::wrap(Handle<Object> jsObject)
{
	ASSERT(handle_.IsEmpty());
	ASSERT(jsObject->InternalFieldCount() > 0);
	handle_ = v8::Persistent<v8::Object>::New(jsObject);
	handle_->SetPointerInInternalField(0, this);
}

void JavaObject::attach(jobject javaObject)
{
	ASSERT((javaObject && javaObject_ == NULL) || javaObject == NULL);
	UPDATE_STATS(0, -1);

	handle_.MakeWeak(this, DetachCallback);
	handle_.MarkIndependent();

	if (javaObject) {
		javaObject_ = javaObject;
	}
	newGlobalRef();
}

void JavaObject::detach()
{
	handle_.MakeWeak(this, DetachCallback);

	if (isDetached()) {
		return;
	}

	UPDATE_STATS(0, 1);

	weakGlobalRef();
}

bool JavaObject::isDetached()
{
	return (javaObject_ == NULL && refTableKey_ == 0) || isWeakRef_;
}

}

