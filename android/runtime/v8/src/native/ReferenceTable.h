/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016-2017 by Appcelerator, Inc. All Rights Reserved.
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
	static jobject clearWeakReference(jlong key);
	static jobject getReference(jlong key);
};

} // namespace titanium

#endif
