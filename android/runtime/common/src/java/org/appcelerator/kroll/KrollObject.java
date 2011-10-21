/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;


/**
 * A representation of the native JS object that corresponds with a Kroll proxy
 */
public abstract class KrollObject implements Handler.Callback
{
	private static final String TAG = "KrollObject";

	protected static final int MSG_RELEASE = 100;
	protected static final int MSG_LAST_ID = MSG_RELEASE;

	protected HashMap<String, Boolean> hasListenersForEventType = new HashMap<String, Boolean>();
	protected Handler runtimeHandler = null;

	public KrollObject()
	{
		runtimeHandler = new Handler(KrollRuntime.getInstance().getRuntimeLooper(), this);	
	}

	public boolean hasListeners(String event)
	{
		Boolean hasListeners = hasListenersForEventType.get(event);
		if (hasListeners == null) {
			return false;
		}

		return hasListeners.booleanValue();
	}

	public void setHasListenersForEventType(String event, boolean hasListeners)
	{
		hasListenersForEventType.put(event, hasListeners);
	}

	protected void release()
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			doRelease();

		} else {
			Message message = runtimeHandler.obtainMessage(MSG_RELEASE, null);
			message.sendToTarget();
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_RELEASE: {
				doRelease();

				return true;
			}
		}

		return false;
	}

	public abstract Object getNativeObject();

	protected abstract void setProperty(String name, Object value);
	protected abstract boolean fireEvent(String type, Object data);
	protected abstract void doRelease();
}

