/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;

public class V8Function extends V8Object implements KrollFunction
{
	public V8Function(long pointer)
	{
		super(pointer);
	}

	public Object call(KrollObject thisObject, Object[] args)
	{
		V8Object v8Object = (V8Object) thisObject;
		nativeInvoke(v8Object.getPointer(), getPointer(), args);

		return null;
	}

	private native void nativeInvoke(long thisPointer, long functionPointer, Object[] functionArgs);
}

