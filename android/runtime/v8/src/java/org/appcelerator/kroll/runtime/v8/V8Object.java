/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollRuntime;
import java.util.HashMap;

import android.util.Log;

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
		if (!KrollRuntime.isInitialized()) {
			Log.w(TAG, "Runtime disposed, cannot set property '" + name + "'");
			return;
		}
		nativeSetProperty(ptr, name, value);
	}

	private boolean toBoolean(Object value)
	{
		if (value instanceof Boolean) {
			return (Boolean) value;
		}
		if (value instanceof String) {
			return Boolean.parseBoolean(((String) value));
		}
		return false;
	}
	private int toInt(Object value)
	{
		if (value instanceof Integer) {
			return ((Integer) value);
		}
		if (value instanceof Double) {
			return ((Double) value).intValue();
		}
		if (value instanceof Long) {
			return ((Long) value).intValue();
		}
		if (value instanceof String) {
			return Integer.parseInt((String) value);
		}
		return 0;
	}


	@Override
	public boolean fireEvent(String type, Object data)
	{
		if (!KrollRuntime.isInitialized()) {
			Log.w(TAG, "Runtime disposed, cannot fire event '" + type + "'");
			return false;
		}
		boolean bubbles = false;
		boolean reportSuccess = false;
		int code = 0;
		Object source = null;
		String message = null;
		if (data instanceof HashMap) {
			HashMap hashData = (HashMap)data;
			Object hashValue = hashData.get("bubbles");
			if (hashValue != null) {
				bubbles = toBoolean(hashValue);
				hashData.remove("bubbles");
			}
			hashValue = hashData.get("success");
			if (hashValue != null) {
				reportSuccess = true;
				hashData.remove("success");
			}
			hashValue = hashData.get("code");
			if (hashValue != null) {
				reportSuccess = true;
				code = toInt(hashValue);
				hashData.remove("code");
			}
			hashValue = hashData.get("error");
			if (hashValue != null) {
				message = hashValue.toString();
				hashData.remove("error");
			}

			hashValue = hashData.get("source");
			if (hashValue != null) {
				source = hashValue;
				hashData.remove("source");
			}

			if(hashData.size() == 0){
				data = null;
			}
		}
		return nativeFireEvent(ptr, source, type, data,bubbles,reportSuccess,code,message);
	}

	@Override
	public Object callProperty(String propertyName, Object[] args) {
		return nativeCallProperty(ptr, propertyName, args);
	}

	@Override
	public void doRelease()
	{
		if (ptr == 0) {
			return;
		}

		if (nativeRelease(ptr)) {
			ptr = 0;
			KrollRuntime.suggestGC();
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
	private static native Object nativeCallProperty(long ptr, String propertyName, Object[] args);
	private static native boolean nativeRelease(long ptr);

	private native void nativeSetProperty(long ptr, String name, Object value);
	private native boolean nativeFireEvent(long ptr, Object source, String event, Object data, boolean bubble, boolean reportSuccess, int code, String errorMessage);
	private native void nativeSetWindow(long ptr, Object windowProxyObject);
}

