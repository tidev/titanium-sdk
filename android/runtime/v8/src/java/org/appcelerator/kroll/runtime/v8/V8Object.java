/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollRuntime;

import android.util.Log;


public class V8Object extends KrollObject
{
	private static final String LCAT = "V8Object";

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
		if (!KrollRuntime.isInitialized()) {
			Log.w(LCAT, "Runtime disposed, cannot set property '" + name + "'");
			return;
		}
		nativeSetProperty(ptr, name, value);
	}

	@Override
	public boolean fireEvent(String type, Object data)
	{
		if (!KrollRuntime.isInitialized()) {
			Log.w(LCAT, "Runtime disposed, cannot fire event '" + type + "'");
			return false;
		}
		return nativeFireEvent(ptr, type, data);
	}

	@Override
	public void doRelease()
	{
		nativeRelease(ptr);
		KrollRuntime.suggestGC();
	}

	@Override
	public void doSetWindow(Object windowProxyObject)
	{
		nativeSetWindow(ptr, windowProxyObject);
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
	private static native void nativeRelease(long ptr);

	private native void nativeSetProperty(long ptr, String name, Object value);
	private native boolean nativeFireEvent(long ptr, String event, Object data);
	private native void nativeSetWindow(long ptr, Object windowProxyObject);
}

