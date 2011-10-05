/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

/* package */abstract class ManagedV8Reference
{
	protected volatile long ptr;

	protected ManagedV8Reference() {}
	protected ManagedV8Reference(long ptr)
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
	protected void finalize() throws Throwable
	{
		super.finalize();
		V8Runtime.getInstance().release(this);
	}

	public synchronized void release()
	{
		nativeRelease(ptr);
		ptr = 0;
	}

	private static native void nativeRelease(long ptr);
}
