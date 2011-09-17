/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef TI_KROLL_NATIVE_OBJECT_H
#define TI_KROLL_NATIVE_OBJECT_H

#include <assert.h>
#include <jni.h>

#include "NativeObject.h"

namespace titanium {

class JavaObject : public NativeObject
{
public:
	// Creates a new V8 proxy for a Java object.
	// This proxy keeps a reference to the Java object
	// and provides a bridge between Dalvik and V8.
	JavaObject(jobject javaObject)
		: NativeObject()
		, javaObject_(javaObject)
	{
	}

	virtual ~JavaObject()
	{
		// TODO: release jobject reference here.
	}

	static bool isJavaObject(v8::Handle<v8::Object> jsObject)
	{
		if (jsObject->InternalFieldCount() > 0) {
			return true;
		}
		return false;
	}

	jobject getJavaObject()
	{
		return javaObject_;
	}

private:
	jobject javaObject_;
};

} // namespace titanium

#endif
