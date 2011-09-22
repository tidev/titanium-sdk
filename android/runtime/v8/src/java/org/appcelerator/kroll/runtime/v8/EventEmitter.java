package org.appcelerator.kroll.runtime.v8;

import java.util.concurrent.Semaphore;

import android.os.Handler;
import android.os.Message;
import android.util.Log;

public class EventEmitter extends V8Object implements Handler.Callback
{
	public static final String EVENT_NAME = "eventName";
	public static final String EVENT_RESULT = "eventResult";
	public static final String EVENT_SYNC = "eventSync";

	private static final String TAG = "EventEmitter";
	private static final int MSG_FIRE_EVENT = 100;
	public static final int MSG_LAST_ID = MSG_FIRE_EVENT + 1;

	private Handler eventHandler;
	private Semaphore semaphore = new Semaphore(0);

	public EventEmitter(long ptr)
	{
		super(ptr);

		eventHandler = new Handler(V8Runtime.getInstance().getV8Looper(), this);
	}

	public void fireEvent(String event, Object data)
	{
		fireEvent(event, data, false);
	}

	public boolean fireSyncEvent(String event, Object data)
	{
		return fireEvent(event, data, true);
	}

	private boolean fireEvent(String event, Object data, boolean sync) {
		Message msg = eventHandler.obtainMessage(MSG_FIRE_EVENT, data);
		msg.getData().putString(EVENT_NAME, event);
		msg.getData().putBoolean(EVENT_SYNC, sync);
		msg.sendToTarget();

		if (sync) {
			try {
				semaphore.acquire();
			} catch (InterruptedException e) {
				Log.e(TAG, e.getMessage(), e);
			}
			return msg.getData().getBoolean(EVENT_RESULT, false);
		}
		return false;
	}


	public void addEventListener(String event, EventListener listener)
	{
		nativeAddEventListener(ptr, event, listener.getPointer());
	}

	public void removeEventListener(String event, EventListener listener)
	{
		nativeRemoveEventListener(ptr, event, listener.getPointer());
	}

	public boolean hasListeners(String event)
	{
		return nativeHasListeners(ptr, event);
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_FIRE_EVENT:
				handleFireEvent(msg);
				return true;
		}
		return false;
	}

	private void handleFireEvent(Message msg)
	{
		boolean result = nativeFireEvent(ptr, msg.getData().getString(EVENT_NAME), msg.obj);
		msg.getData().putBoolean(EVENT_RESULT, result);
		if (msg.getData().getBoolean(EVENT_SYNC, false)) {
			semaphore.release();
		}
	}

	private native boolean nativeFireEvent(long ptr, String event, Object data);
	private native void nativeAddEventListener(long ptr, String event, long listenerPtr);
	private native void nativeRemoveEventListener(long ptr, String event, long listenerPtr);
	private native boolean nativeHasListeners(long ptr, String event);
}
