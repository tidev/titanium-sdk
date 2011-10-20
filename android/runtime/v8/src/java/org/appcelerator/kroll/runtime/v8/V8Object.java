/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollObject;


public class V8Object extends KrollObject
{
	private volatile long ptr;


	public V8Object(long ptr)
	{
		this.ptr = ptr;
	}

	public long getPointer()
	{
		return ptr;
	}

	public void setPointer(long ptr)
	{
		this.ptr = ptr;
	}

	@Override
	public Object getNativeObject()
	{
		return this;
	}

	@Override
	public void setProperty(String name, Object value)
	{
		nativeSetProperty(ptr, name, value);
	}

	@Override
	public boolean fireEvent(String type, Object data)
	{
		return nativeFireEvent(ptr, type, data);
	}

	@Override
	public void doRelease()
	{
		nativeRelease(ptr);
	}

	@Override
	protected void finalize() throws Throwable
	{
		super.finalize();
		if (ptr != 0) {
			release();
		}
	}


	// JNI method prototypes
	protected static native void nativeInitObject(Class<?> proxyClass, Object proxyObject);
	private native void nativeSetProperty(long ptr, String name, Object value);
	private native boolean nativeFireEvent(long ptr, String event, Object data);
	private static native void nativeRelease(long ptr);
}

