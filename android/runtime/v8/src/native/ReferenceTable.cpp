/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ReferenceTable.h"
#include "JNIUtil.h"

namespace titanium {

jlong ReferenceTable::createReference(jobject object)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	return env->CallStaticLongMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableCreateReferenceMethod,
		object);
}

void ReferenceTable::destroyReference(jlong key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	env->CallStaticVoidMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableDestroyReferenceMethod,
		key);
}

void ReferenceTable::makeWeakReference(jlong key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	env->CallStaticVoidMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableMakeWeakReferenceMethod,
		key);
}

void ReferenceTable::makeSoftReference(jlong key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	env->CallStaticVoidMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableMakeSoftReferenceMethod,
		key);
}

jobject ReferenceTable::clearReference(jlong key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	return env->CallStaticObjectMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableClearReferenceMethod,
		key);
}

jobject ReferenceTable::getReference(jlong key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	return env->CallStaticObjectMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableGetReferenceMethod,
		key);
}

jboolean ReferenceTable::isStrongReference(jlong key)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	return env->CallStaticBooleanMethod(
		JNIUtil::referenceTableClass,
		JNIUtil::referenceTableIsStrongReferenceMethod,
		key);
}

} // namespace titanium
