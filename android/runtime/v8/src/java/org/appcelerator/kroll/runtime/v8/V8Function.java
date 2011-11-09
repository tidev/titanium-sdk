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
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;

import android.os.Handler;
import android.os.Message;


public class V8Function extends V8Object implements KrollFunction, Handler.Callback
{
	private Handler handler;

	protected static final int MSG_CALL_SYNC = V8Object.MSG_LAST_ID + 100;
	protected static final int MSG_LAST_ID = MSG_CALL_SYNC;


	public V8Function(long pointer)
	{
		super(pointer);
		handler = new Handler(TiMessenger.getRuntimeMessenger().getLooper(), this);
	}

	public void call(KrollObject krollObject, HashMap args)
	{
		call(krollObject, new Object[] { args });
	}

	public void call(KrollObject krollObject, Object[] args)
	{
		if (KrollRuntime.getInstance().isRuntimeThread())
		{
			callSync(krollObject, args);

		} else {
			TiMessenger.sendBlockingRuntimeMessage(handler.obtainMessage(MSG_CALL_SYNC), new FunctionArgs(krollObject, args));
		}
	}

	public void callSync(KrollObject krollObject, Object[] args)
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

	public boolean handleMessage(Message message)
	{
		switch (message.what) {
			case MSG_CALL_SYNC: {
				AsyncResult asyncResult = ((AsyncResult) message.obj);
				FunctionArgs functionArgs = (FunctionArgs) asyncResult.getArg();
				callSync(functionArgs.krollObject, functionArgs.args);
				asyncResult.setResult(null);

				return true;
			}
		}

		return false;
	}


	// JNI method prototypes
	private native void nativeInvoke(long thisPointer, long functionPointer, Object[] functionArgs);
}

