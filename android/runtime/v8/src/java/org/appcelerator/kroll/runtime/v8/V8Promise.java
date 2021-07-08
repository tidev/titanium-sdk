package org.appcelerator.kroll.runtime.v8;

import android.os.Message;

import org.appcelerator.kroll.KrollPromise;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;

/**
 * This class wraps an underlying v8::Promise::Resolver which holds
 * the Promise but allows us to call resolve/reject on it.
 */
public class V8Promise<V extends Object> extends V8Object implements KrollPromise<V>
{
	private static final String TAG = "V8Promise";

	protected static final int MSG_RESOLVE = V8Object.MSG_LAST_ID + 100;
	protected static final int MSG_REJECT = V8Object.MSG_LAST_ID + 101;
	protected static final int MSG_LAST_ID = MSG_REJECT;

	public V8Promise()
	{
		super(nativeCreate());
	}

	public V8Promise(long ptr)
	{
		super(ptr);
	}

	@Override
	public void resolve(V value)
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			nativeResolve(getPointer(), value);
		} else {
			TiMessenger.sendBlockingRuntimeMessage(handler.obtainMessage(MSG_RESOLVE), value);
		}
	}

	@Override
	public void reject(Object value)
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			nativeReject(getPointer(), value);
		} else {
			TiMessenger.sendBlockingRuntimeMessage(handler.obtainMessage(MSG_REJECT), value);
		}
	}

	@Override
	public boolean handleMessage(Message message)
	{
		switch (message.what) {
			case MSG_RESOLVE: {
				AsyncResult asyncResult = ((AsyncResult) message.obj);
				Object value = asyncResult.getArg();
				nativeResolve(getPointer(), value);
				asyncResult.setResult(null);
				return true;
			}
			case MSG_REJECT: {
				AsyncResult asyncResult = ((AsyncResult) message.obj);
				Object value = asyncResult.getArg();
				nativeReject(getPointer(), value);
				asyncResult.setResult(null);
				return true;
			}
		}

		return super.handleMessage(message);
	}

	// JNI method prototypes
	private static native long nativeCreate();

	private native void nativeResolve(long resolver, Object value);

	private native void nativeReject(long resolver, Object value);

	protected native boolean nativeRelease(long resolver);
}
