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

public class EventEmitter extends V8Object implements Handler.Callback
{
	private static final String TAG = "EventEmitter";
	private static final int MSG_FIRE_EVENT = 100;
	public static final int MSG_LAST_ID = MSG_FIRE_EVENT + 1;

	public static final String PROPERTY_TYPE= "type";
	public static final String PROPERTY_RESULT = "eventResult";

	private Handler mainHandler;
	private HashMap<String, Boolean> hasListenersForEventType = new HashMap<String, Boolean>();

	public EventEmitter()
	{
		super(0);
		mainHandler = new Handler(Looper.getMainLooper(), this);
	}
	
	public boolean hasListeners(String event)
	{
		if (hasListenersForEventType.containsKey(event)) {
			return hasListenersForEventType.get(event);
		} else {
			return false;
		}
	}
	
	public boolean fireEvent(String event, Object data)
	{
		Message msg = mainHandler.obtainMessage(MSG_FIRE_EVENT, data);
		msg.getData().putString(PROPERTY_TYPE, event);
		msg.sendToTarget();
		return true;
	}

	public boolean fireSyncEvent(String event, Object data)
	{
		return nativeFireEvent(ptr, event, data);
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
		}
		return false;
	}

	private void handleFireEvent(Message msg)
	{
		boolean result = nativeFireEvent(ptr, msg.getData().getString(PROPERTY_TYPE), msg.obj);
		msg.getData().putBoolean(PROPERTY_RESULT, result);
	}

	private void hasListenersForEventType(String event, boolean hasListeners)
	{
		hasListenersForEventType.put(event, hasListeners);
	}

	private native boolean nativeFireEvent(long ptr, String event, Object data);
}
