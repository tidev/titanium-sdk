package org.appcelerator.kroll.runtime.v8;

import java.util.HashMap;

import android.os.Handler;
import android.os.Message;
import android.util.Log;

public class EventListener extends ManagedV8Reference
{
	private static final String TAG = "EventListener";

	public static final String EVENT_LISTENER_ADDED = "listenerAdded";
	public static final String EVENT_LISTENER_REMOVED = "listenerRemoved";

	private Handler handler;
	private HashMap<String, Integer> eventMessages = new HashMap<String, Integer>();

	public EventListener(Handler handler)
	{
		super();
		this.ptr = nativeInit();
		this.handler = handler;
	}

	public void addEventMessage(EventEmitter emitter, String event, int msgId)
	{
		eventMessages.put(event, msgId);
		emitter.addEventListener(event, this);
	}

	public void postEvent(String event, Object data)
	{
		Integer msgId = eventMessages.get(event);
		if (msgId == null) {
			Log.w(TAG, "No msgId found for event \"" + event  + "\"");
			return;
		}

		Message msg = handler.obtainMessage(msgId, data);
		msg.getData().putString(EventEmitter.EVENT_NAME, event);
		msg.sendToTarget();
	}

	@Override
	protected void finalize() throws Throwable
	{
		super.finalize();
		nativeDispose(ptr);
	}

	private native long nativeInit();
	private native void nativeDispose(long ptr);
}
