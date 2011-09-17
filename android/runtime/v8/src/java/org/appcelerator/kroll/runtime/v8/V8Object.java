/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

public class V8Object
{
	protected long ptr;

	public V8Object(long ptr) {
		this.ptr = ptr;
	}

	public long getPointer() {
		return ptr;
	}

	public Object get(String name) {
		return nativeGet(ptr, name);
	}

	public Object get(int index) {
		return nativeGetIndex(ptr, index);
	}

	public void set(String name, int value) {
		nativeSetNumber(ptr, name, (double) value);
	}

	public void set(String name, long value) {
		nativeSetNumber(ptr, name, (double) value);
	}

	public void set(String name, float value) {
		nativeSetNumber(ptr, name, (double) value);
	}

	public void set(String name, double value) {
		nativeSetNumber(ptr, name, value);
	}

	public void set(String name, boolean value) {
		nativeSetBoolean(ptr, name, value);
	}

	public void set(String name, Object value) {
		if (value instanceof Number) {
			nativeSetNumber(ptr, name, ((Number) value).doubleValue());
		} else {
			nativeSetObject(ptr, name, value);
		}
	}

	public boolean has(String name) {
		return nativeHas(ptr, name);
	}

	public Object[] keys() {
		return nativeKeys(ptr);
	}

	@Override
	protected void finalize() throws Throwable {
		super.finalize();
		nativeRelease(ptr);
		ptr = 0;
	}

	private native Object nativeGet(long ptr, String name);

	private native Object nativeGetIndex(long ptr, int index);

	private native void nativeSetObject(long ptr, String name, Object value);

	private native void nativeSetNumber(long ptr, String name, double number);

	private native void nativeSetBoolean(long ptr, String name, boolean b);

	private native boolean nativeHas(long ptr, String name);

	private native Object[] nativeKeys(long ptr);

	private static native void nativeRelease(long ptr);
}
