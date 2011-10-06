/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

public class V8Object extends ManagedV8Reference
{
	public V8Object(long ptr)
	{
		super(ptr);
	}

	public V8Object()
	{
		super(nativeCreateObject());
	}

	void doSetProperty(String name, Object value)
	{
		nativeSetProperty(ptr, name, value);
	}

	private static native long nativeCreateObject();
	private native void nativeSetProperty(long ptr, String name, Object value);
}
