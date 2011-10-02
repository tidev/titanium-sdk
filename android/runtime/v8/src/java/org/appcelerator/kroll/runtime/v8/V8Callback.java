/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.kroll.runtime.v8;

import java.util.HashMap;

public class V8Callback extends V8Object
{
	public V8Callback(long pointer)
	{
		super(pointer);
	}

	public void invoke(HashMap functionArgs)
	{
		nativeInvoke(getPointer(), new Object[]{ functionArgs });
	}

	public void invoke(Object[] functionArgs)
	{
		nativeInvoke(getPointer(), functionArgs);
	}

	private native void nativeInvoke(long functionPointer, Object[] functionArgs);
}

