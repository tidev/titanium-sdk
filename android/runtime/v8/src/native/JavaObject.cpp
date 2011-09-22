/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "EventEmitter.h"
#include "JavaObject.h"
#include "JNIUtil.h"

namespace titanium {

bool JavaObject::useGlobalRefs = true;

static jobject objectMap;

JavaObject::JavaObject(jobject javaObject)
	: EventEmitter(), javaObject_(javaObject)
{
	if (javaObject_) {
		newGlobalRef();
	}
}

void JavaObject::newGlobalRef()
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!env) {
		// TODO error
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
		env->CallObjectMethod(objectMap, JNIUtil::hashMapPutMethod, longObject, javaObject_);
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
			// TODO error
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
	} else {
		// Clear from the global object list
		if (objectMap) {
			jobject longObject = env->NewObject(JNIUtil::longClass, JNIUtil::longInitMethod, (jlong) this);
			env->CallObjectMethod(objectMap, JNIUtil::hashMapRemoveMethod, (jint) refIndex);
			env->DeleteLocalRef(longObject);
		}
	}
}

JavaObject::~JavaObject()
{
	if (javaObject_) {
		deleteGlobalRef();
	}
}

}

