/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.hermes;

import java.util.HashMap;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;

import android.os.Handler;
import android.os.Message;
import android.util.Log;

public class HermesFunction extends HermesObject implements KrollFunction, Handler.Callback
{
	private static final String TAG = "HermesFunction";

	protected static final int MSG_CALL_SYNC = HermesObject.MSG_LAST_ID + 100;
	protected static final int MSG_LAST_ID = MSG_CALL_SYNC;

	public HermesFunction(long pointer)
	{
		super(pointer);
	}

	public Object call(KrollObject krollObject, HashMap args)
	{
		return call(krollObject, new Object[] { args });
	}

	public Object call(KrollObject krollObject, Object[] args)
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			return callSync(krollObject, args);

		} else {
			return TiMessenger.sendBlockingRuntimeMessage(handler.obtainMessage(MSG_CALL_SYNC),
														  new FunctionArgs(krollObject, args));
		}
	}

	public Object callSync(KrollObject krollObject, Object[] args)
	{
		if (KrollRuntime.isDisposed()) {
			Log.w(TAG, "Runtime disposed, cannot call function.");
			return null;
		}
		if (isStale() || ((krollObject instanceof HermesObject) && ((HermesObject) krollObject).isStale())) {
			Log.w(TAG, "Runtime restarted, cannot call function from previous runtime.");
			return null;
		}
		HermesObject thisObject = (HermesObject) krollObject;
		if (thisObject.getPointer() == 0) {
			// Hermes collected the JS object of the proxy. The proxy gets a new one.
			HermesObject renewed = thisObject.renew();
			if (renewed != null) {
				thisObject = renewed;
			}
		}
		return nativeInvoke(thisObject.getPointer(), getPointer(), args);
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

	@Override
	public boolean handleMessage(Message message)
	{
		switch (message.what) {
			case MSG_CALL_SYNC: {
				AsyncResult asyncResult = ((AsyncResult) message.obj);
				FunctionArgs functionArgs = (FunctionArgs) asyncResult.getArg();
				asyncResult.setResult(callSync(functionArgs.krollObject, functionArgs.args));

				return true;
			}
		}

		return super.handleMessage(message);
	}

	// JNI method prototypes
	private native Object nativeInvoke(long thisPointer, long functionPointer, Object[] functionArgs);

	@Override
	protected void finalize() throws Throwable
	{
		try {
			// The runtime holds the JS value in a table until Java gives up the key.
			if (getPointer() != 0) {
				release();
			}
		} finally {
			super.finalize();
		}
	}

	protected native boolean nativeRelease(long functionPointer);
}
