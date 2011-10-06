/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import java.util.HashMap;
import java.util.concurrent.Semaphore;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;

public class EventEmitter extends V8Object implements Handler.Callback
{
	private static final String TAG = "EventEmitter";
	private static final int MSG_FIRE_EVENT = 100;
	private static final int MSG_ADD_EVENT_LISTENER = 101;
	private static final int MSG_REMOVE_EVENT_LISTENER = 102;
	private static final int MSG_LISTENER_ADDED = 103;
	private static final int MSG_LISTENER_REMOVED = 104;
	public static final int MSG_LAST_ID = MSG_LISTENER_REMOVED + 1;

	public static final String PROPERTY_TYPE= "type";
	public static final String PROPERTY_RESULT = "eventResult";
	public static final String PROPERTY_SYNC = "eventSync";

	private Handler mainHandler;
	private EventListener eventChangeListener;
	private boolean needsRegister;
	private Semaphore semaphore = new Semaphore(0);
	private HashMap<String, Integer> listenerCount = new HashMap<String, Integer>();

	public EventEmitter()
	{
		super(0);
		needsRegister = false;
		mainHandler = new Handler(Looper.getMainLooper(), this);
	}

	@Override
	public void setPointer(long ptr)
	{
		super.setPointer(ptr);
		if (needsRegister) {
			registerListenerEvents();
		}
	}

	public void registerListenerEvents()
	{
		if (this.ptr != 0) {
			if (eventChangeListener == null) {
				eventChangeListener = new EventListener(mainHandler);
				eventChangeListener.addEventMessage(this, EventListener.EVENT_LISTENER_ADDED, MSG_LISTENER_ADDED);
				eventChangeListener.addEventMessage(this, EventListener.EVENT_LISTENER_REMOVED, MSG_LISTENER_REMOVED);
				needsRegister = false;
			}
		} else {
			needsRegister = true;
		}
	}

	public boolean fireEvent(String event, Object data)
	{
		/* TODO - take a closer look at how to fire events on proxies
		if (!hasListeners(event)) {
			return false;
		}*/

		/*if (V8Runtime.getInstance().isUiThread()) {
			return nativeFireEvent(ptr, event, data);
		} else {*/
			Message msg = mainHandler.obtainMessage(MSG_FIRE_EVENT, data);
			msg.getData().putString(PROPERTY_TYPE, event);
			msg.getData().putBoolean(PROPERTY_SYNC, false);
			msg.sendToTarget();
			return true;
		//}
	}

	public boolean fireSyncEvent(String event, Object data)
	{
		return nativeFireEvent(ptr, event, data);
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
		return getListenerCount(event) > 0;
	}

	public int getListenerCount(String event)
	{
		Integer count = listenerCount.get(event);
		if (count == null) return 0;
		return count;
	}

	public Handler getUIHandler()
	{
		return mainHandler;
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_FIRE_EVENT:
				handleFireEvent(msg);
				return true;
			case MSG_ADD_EVENT_LISTENER:
				nativeAddEventListener(ptr, msg.getData().getString(PROPERTY_TYPE),
					((EventListener) msg.obj).getPointer());
				return true;
			case MSG_REMOVE_EVENT_LISTENER:
				nativeRemoveEventListener(ptr, msg.getData().getString(PROPERTY_TYPE),
					((EventListener) msg.obj).getPointer());
				return true;
			case MSG_LISTENER_ADDED:
				handleListenerAdded(msg.getData().getString(PROPERTY_TYPE));
				return true;
			case MSG_LISTENER_REMOVED:
				handleListenerRemoved(msg.getData().getString(PROPERTY_TYPE));
				return true;
		}
		return false;
	}

	private void handleFireEvent(Message msg)
	{
		boolean result = nativeFireEvent(ptr, msg.getData().getString(PROPERTY_TYPE), msg.obj);
		msg.getData().putBoolean(PROPERTY_RESULT, result);
		if (msg.getData().getBoolean(PROPERTY_SYNC, false)) {
			semaphore.release();
		}
	}

	private void handleListenerCountChanged(String event, int count)
	{
		Integer eventCount = listenerCount.get(event);
		if (eventCount == null) {
			eventCount = count;
		} else {
			eventCount += count;
		}

		listenerCount.put(event, eventCount);
	}

	protected void handleListenerAdded(String event)
	{
		handleListenerCountChanged(event, 1);
	}

	protected void handleListenerRemoved(String event)
	{
		handleListenerCountChanged(event, -1);
	}

	private native boolean nativeFireEvent(long ptr, String event, Object data);
	private native void nativeAddEventListener(long ptr, String event, long listenerPtr);
	private native void nativeRemoveEventListener(long ptr, String event, long listenerPtr);
	private native boolean nativeHasListeners(long ptr, String event);
}
