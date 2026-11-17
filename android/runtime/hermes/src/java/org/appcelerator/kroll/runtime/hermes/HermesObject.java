/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.hermes;

import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;

public class HermesObject extends KrollObject
{
	private static final String TAG = "HermesObject";

	// The id of the native titanium::Proxy, or the key of a function or promise in the native
	// tables of the runtime. It is not a memory address.
	private volatile long ptr;

	// Set by ReferenceTable.armReference(). Only the proxy may reach the canary.
	Object canary;
	private final int generation;

	public HermesObject(long ptr)
	{
		this.ptr = ptr;
		this.generation = HermesRuntime.getGeneration();
	}

	/**
	 * Determines if this object belongs to a runtime that has since been disposed, such as by a soft restart.
	 * The JavaScript side of a stale object lives in a detached context and must not be used.
	 * @return true if the object was created by a previous runtime instance.
	 */
	public boolean isStale()
	{
		return this.generation != HermesRuntime.getGeneration();
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
		if (isStale()) {
			Log.w(TAG, "Runtime restarted, cannot set property '" + name + "' on object from previous runtime",
				  Log.DEBUG_MODE);
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
		if (isStale()) {
			Log.w(TAG, "Runtime restarted, cannot fire event '" + type + "' on object from previous runtime",
				  Log.DEBUG_MODE);
			return false;
		}

		long sourceptr = 0;
		if (source instanceof HermesObject) {
			sourceptr = ((HermesObject) source).getPointer();
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
		if (isStale()) {
			Log.w(TAG, "Runtime restarted, cannot call property '" + propertyName + "' on object from previous runtime",
				  Log.DEBUG_MODE);
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
		if (KrollRuntime.isDisposed() || isStale()) {
			return;
		}
		nativeSetWindow(ptr, windowProxyObject);
	}

	// JNI method prototypes
	protected static native void nativeInitObject(Class<?> proxyClass, Object proxyObject);

	protected native boolean nativeRelease(long ptr);

	private native Object nativeCallProperty(long ptr, String propertyName, Object[] args);

	private native void nativeSetProperty(long ptr, String name, Object value);

	private native boolean nativeFireEvent(long ptr, Object source, long sourcePtr, String event, Object data,
										   boolean bubble, boolean reportSuccess, int code, String errorMessage);

	private native void nativeSetWindow(long ptr, Object windowProxyObject);
}
