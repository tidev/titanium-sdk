/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.kroll.runtime.v8;

import java.util.HashMap;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;

public class V8Callback extends V8Object implements Handler.Callback
{
	private static final int MSG_INVOKE = 100;
	private Handler mainHandler;

	public V8Callback(long pointer)
	{
		super(pointer);
		mainHandler = new Handler(Looper.getMainLooper(), this);
	}

	public void invoke(V8Object thisObject, HashMap<?,?> functionArgs)
	{
		invoke(thisObject, new Object[]{ functionArgs });
	}

	public void invoke(V8Object thisObject, Object[] functionArgs)
	{
		V8Runtime v8Runtime = V8Runtime.getInstance();
		if (v8Runtime.isUiThread()) {
			nativeInvoke(thisObject.getPointer(), getPointer(), functionArgs);
		} else {
			final V8Object fThisObject = thisObject;
			final Object[] fFunctionArgs = functionArgs;
			mainHandler.post(new Runnable() {
				public void run()
				{
					nativeInvoke(fThisObject.getPointer(), getPointer(), fFunctionArgs);
				}
			});
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		// TODO Auto-generated method stub
		return false;
	}

	private native void nativeInvoke(long thisPointer, long functionPointer, Object[] functionArgs);
}

