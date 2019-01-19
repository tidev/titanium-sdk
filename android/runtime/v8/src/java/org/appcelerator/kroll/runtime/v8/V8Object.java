/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;

public class V8Object extends KrollObject
{
	private static final String TAG = "V8Object";

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
		if (KrollRuntime.isDisposed()) {
			Log.w(TAG, "Runtime disposed, cannot set property '" + name + "'");
			return;
		}
		nativeSetProperty(ptr, name, value);
	}

	@Override
	public boolean fireEvent(KrollObject source, String type, Object data, boolean bubbles, boolean reportSuccess,
							 int code, String message)
	{
		if (KrollRuntime.isDisposed()) {
			Log.w(TAG, "Runtime disposed, cannot fire event '" + type + "'");
			return false;
		}

		long sourceptr = 0;
		if (source instanceof V8Object) {
			sourceptr = ((V8Object) source).getPointer();
		}
		return nativeFireEvent(ptr, source, sourceptr, type, data, bubbles, reportSuccess, code, message);
	}

	@Override
	public Object callProperty(String propertyName, Object[] args)
	{
		if (KrollRuntime.isDisposed()) {
			if (Log.isDebugModeEnabled()) {
				Log.w(TAG, "Runtime disposed, cannot call property '" + propertyName + "'");
			}
			return null;
		}
		return nativeCallProperty(ptr, propertyName, args);
	}

	@Override
	public void doRelease()
	{
		if (ptr == 0) {
			return;
		}

		if (!KrollRuntime.isDisposed() && nativeRelease(ptr)) {
			ptr = 0;
		}
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

	private static native boolean nativeRelease(long ptr);

	private native Object nativeCallProperty(long ptr, String propertyName, Object[] args);

	private native void nativeSetProperty(long ptr, String name, Object value);

	private native boolean nativeFireEvent(long ptr, Object source, long sourcePtr, String event, Object data,
										   boolean bubble, boolean reportSuccess, int code, String errorMessage);

	private native void nativeSetWindow(long ptr, Object windowProxyObject);
}
