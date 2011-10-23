/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.kroll.runtime.v8;

import java.util.HashMap;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.TiMessenger;


public class V8Function extends V8Object implements KrollFunction
{
	public V8Function(long pointer)
	{
		super(pointer);
	}

	public void call(KrollObject krollObject, HashMap args)
	{
		call(krollObject, new Object[] { args });
	}

	public void call(KrollObject krollObject, Object[] args)
	{
		nativeInvoke(((V8Object) krollObject).getPointer(), getPointer(), args);
	}

	public void callAsync(KrollObject krollObject, HashMap args)
	{
		callAsync(krollObject, new Object[] { args });
	}

	public void callAsync(final KrollObject krollObject, final Object[] args)
	{
		TiMessenger.postOnRuntime(new Runnable() {
			public void run()
			{
				call(krollObject, args);
			}
		});
	}


	// JNI method prototypes
	private native void nativeInvoke(long thisPointer, long functionPointer, Object[] functionArgs);
}

