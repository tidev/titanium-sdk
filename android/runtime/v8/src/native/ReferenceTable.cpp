/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>

#include "ReferenceTable.h"
#include "Proxy.h"
#include "JNIUtil.h"
#include "AndroidUtil.h"
#include "V8Runtime.h"

#include "org_appcelerator_kroll_runtime_v8_ReferenceTable.h"

#define TAG "ReferenceTable"

namespace titanium {

jint ReferenceTable::createReference(jobject object)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	return env->CallStaticIntMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableCreateReferenceMethod,
		object);
}

void ReferenceTable::destroyReference(jint key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	env->CallStaticVoidMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableDestroyReferenceMethod,
		key);
}

void ReferenceTable::makeWeakReference(jint key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	env->CallStaticVoidMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableMakeWeakReferenceMethod,
		key);
}

jobject ReferenceTable::clearWeakReference(jint key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	return env->CallStaticObjectMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableClearWeakReferenceMethod,
		key);
}

jobject ReferenceTable::getReference(jint key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	return env->CallStaticObjectMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableGetReferenceMethod,
		key);
}

} // namespace titanium

#ifdef __cplusplus
extern "C" {
#endif

using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_v8_ReferenceTable
 * Method:    nativeRelease
 * Signature: ???
 */
JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_v8_ReferenceTable_nativeRelease
	(JNIEnv *env, jclass clazz, jlong refPointer)
{
	LOGD(TAG, "ReferenceTable::nativeRelease");
	HandleScope scope(V8Runtime::v8_isolate);
	JNIScope jniScope(env);

	if (refPointer) {
		// FIXME What's the right way to cast the long long int as a pointer?
		titanium::Proxy* proxy = (titanium::Proxy*) refPointer;
		if (proxy) {
			LOGI(TAG, "!!!!! POSSIBLE memory leak! titanium::Proxy with pointer value: %p", refPointer);
			// delete proxy;
			return JNI_TRUE;
		}
	}

	return JNI_FALSE;
}

#ifdef __cplusplus
}
#endif
