/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_KROLL_REFERENCE_TABLE_H
#define TI_KROLL_REFERENCE_TABLE_H

#include <jni.h>

namespace titanium {

/*
 * A reference table for Java objects. The purpose
 * of this is to workaround JNI global reference limits
 * put in place on certain devices (ex: emulator).
 * It is implemented by placing the referenced
 * objects into a container (HashMap) and accessing
 * them later by an unique integer key. See
 * ReferenceTable.java in kroll-v8 project.
 */
class ReferenceTable
{
public:
	static jlong createReference(jobject object);
	static void destroyReference(jlong key);
	static void makeWeakReference(jlong key);
	static void makeSoftReference(jlong key);
	static jobject clearReference(jlong key);
	static jobject getReference(jlong key);
	static jboolean isStrongReference(jlong key);
};

} // namespace titanium

#endif
