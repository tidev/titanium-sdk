/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"

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

JavaObject::JavaObject(jobject javaObject)
	: EventEmitter()
	, javaObject_(NULL)
{
	UPDATE_STATS(1, 1);

	if (javaObject) {
		attach(javaObject);
	}
}

void JavaObject::newGlobalRef()
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!env) {
		LOGE(TAG, "Failed to get JNI environment.");
		return;
	}

	if (useGlobalRefs) {
		javaObject_ = env->NewGlobalRef(javaObject_);
	} else {
		// We store a single global reference to an object list that holds our actual ref list for the emulator
		// (or whenever the reference limit is artificially limited)
		if (!objectMap) {
			objectMap = env->NewGlobalRef(
				env->NewObject(JNIUtil::hashMapClass, JNIUtil::hashMapInitMethod, 2000));
		}
		jobject longObject = env->NewObject(JNIUtil::longClass, JNIUtil::longInitMethod, (jlong) this);
		jobject r = env->CallObjectMethod(objectMap, JNIUtil::hashMapPutMethod, longObject, javaObject_);
		env->DeleteLocalRef(r);
		env->DeleteLocalRef(longObject);

		// This will be requeried from getJavaObject()
		javaObject_ = NULL;
	}
}

jobject JavaObject::getJavaObject()
{
	if (useGlobalRefs) {
		return javaObject_;
	} else {
		// Pull from the global object list. This is inefficient, but it's probably
		// the only workaround for hard limits on the JNI global reference count
		JNIEnv *env = JNIUtil::getJNIEnv();
		if (!env) {
			LOGE(TAG, "Failed to get JNI environment.");
			return NULL;
		}

		jobject longObject = env->NewObject(JNIUtil::longClass, JNIUtil::longInitMethod, (jlong) this);
		jobject javaObject = env->CallObjectMethod(objectMap, JNIUtil::hashMapGetMethod, longObject);
		env->DeleteLocalRef(longObject);
		return javaObject;
	}
}

void JavaObject::deleteGlobalRef()
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!env) {
		// TODO error
		return;
	}

	if (useGlobalRefs) {
		env->DeleteGlobalRef(javaObject_);
		javaObject_ = NULL;
	} else {
		// Clear from the global object list
		if (objectMap) {
			jobject longObject = env->NewObject(JNIUtil::longClass, JNIUtil::longInitMethod, (jlong) this);
			env->CallObjectMethod(objectMap, JNIUtil::hashMapRemoveMethod, longObject);
			env->DeleteLocalRef(longObject);
		}
	}
}

JavaObject::~JavaObject()
{
	UPDATE_STATS(-1, isDetached() ? -1 : 0);

	if (javaObject_) {
		deleteGlobalRef();
	}
}

static void DetachCallback(v8::Persistent<v8::Value> value, void *data)
{
	JavaObject *javaObject = static_cast<JavaObject*>(data);
	javaObject->detach();
}

void JavaObject::wrap(Handle<Object> jsObject)
{
	assert(handle_.IsEmpty());
	assert(handle->InternalFieldCount() > 0);
	handle_ = v8::Persistent<v8::Object>::New(jsObject);
	handle_->SetPointerInInternalField(0, this);
}

void JavaObject::attach(jobject javaObject)
{
	UPDATE_STATS(0, -1);

	handle_.MakeWeak(this, DetachCallback);

	javaObject_ = javaObject;
	newGlobalRef();
}

void JavaObject::detach()
{
	UPDATE_STATS(0, 1);

	// Keep JavaScript object around until finalization.
	handle_.ClearWeak();

	// Release reference to Java object so it can get finalized.
	deleteGlobalRef();
}

bool JavaObject::isDetached()
{
	// Quick and direct if not using global ref hack for emulator.
	if (useGlobalRefs) {
		return javaObject_ == NULL;
	}

	jobject javaObject = getJavaObject();
	if (javaObject == NULL) {
		return true;
	}
	JNIEnv *env = JNIUtil::getJNIEnv();
	env->DeleteLocalRef(javaObject);
	return false;
}

}

