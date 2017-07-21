/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ReferenceTable.h"

#include "JNIUtil.h"

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

