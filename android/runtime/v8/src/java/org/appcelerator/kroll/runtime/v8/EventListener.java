package org.appcelerator.kroll.runtime.v8;

import android.os.Handler;
import android.os.Message;

public class EventListener extends ManagedV8Reference
{
	public static final String EVENT_LISTENER_ADDED = "listenerAdded";
	public static final String EVENT_LISTENER_REMOVED = "listenerRemoved";

	private Handler handler;
	private int msgId;

	public EventListener(Handler handler, int msgId)
	{
		super();
		this.ptr = nativeInit();
		this.handler = handler;
		this.msgId = msgId;
	}

	public void postEvent(String event, Object data)
	{
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
