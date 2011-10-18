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

	private static final int MSG_SET_PROPERTY = 100;
	private static final int MSG_FIRE_EVENT = 101;
	private static final int MSG_RELEASE = 102;
	public static final int MSG_LAST_ID = MSG_RELEASE + 100;

	private static final String PROPERTY_NAME = "name";

	protected Handler mainHandler;
	protected Handler.Callback delegate;
	protected HashMap<String, Boolean> hasListenersForEventType = new HashMap<String, Boolean>();

	public KrollObject()
	{
		Looper mainLooper = Looper.getMainLooper();
		mainHandler = new Handler(mainLooper, this);
	}

	public void setDelegate(Handler.Callback delegate)
	{
		this.delegate = delegate;
	}

	public Handler getMainHandler()
	{
		return mainHandler;
	}

	/**
	 * Sets the internally named property to value
	 * @param name A property name (usually tracked internally)
	 * @param value The value of the property 
	 */
	public void setProperty(String property, Object value)
	{
		if (KrollRuntime.getInstance().isUiThread()) {
			doSetProperty(property, value);
		} else {
			Message msg = mainHandler.obtainMessage(MSG_SET_PROPERTY, value);
			msg.getData().putString(PROPERTY_NAME, property);
			msg.sendToTarget();
		}
	}

	/**
	 * @param event The event type
	 * @return Whether or not this object has listeners for the specified event
	 */
	public boolean hasListeners(String event)
	{
		Boolean hasListeners = hasListenersForEventType.get(event);
		if (hasListeners == null) {
			return false;
		}

		return hasListeners.booleanValue();
	}

	/**
	 * Fires the passed in event asynchronously with the specified data
	 * @param event The event type
	 * @param data The event data
	 * @return Whether or not the event was fired
	 */
	public boolean fireEvent(String event, Object data)
	{
		Message msg = mainHandler.obtainMessage(MSG_FIRE_EVENT, data);
		msg.getData().putString(PROPERTY_NAME, event);
		msg.sendToTarget();
		return true;
	}

	/**
	 * Fires the passed in event synchronously on the current thread
	 * @param event The event type
	 * @param data The event data
	 * @return Whether or not the event was fired
	 */
	public boolean fireSyncEvent(String event, Object data)
	{
		return doFireEvent(event, data);
	}

	public void setHasListenersForEventType(String event, boolean hasListeners)
	{
		hasListenersForEventType.put(event, hasListeners);
	}

	public Object call(KrollFunction fn, Object[] args)
	{
		return fn.call(this, args);
	}

	public void callAsync(final KrollFunction fn, final Object[] args)
	{
		mainHandler.post(new Runnable() {
			public void run()
			{
				fn.call(KrollObject.this, args);
			}
		});
	}

	public void release()
	{
		if (KrollRuntime.getInstance().isUiThread()) {
			doRelease();
		} else {
			mainHandler.sendEmptyMessage(MSG_RELEASE);
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_SET_PROPERTY:
				Object value = msg.obj;
				String property = msg.getData().getString(PROPERTY_NAME);
				doSetProperty(property, value);
				return true;
			case MSG_FIRE_EVENT:
				Object data = msg.obj;
				String event = msg.getData().getString(PROPERTY_NAME);
				doFireEvent(event, data);
				return true;
			case MSG_RELEASE:
				doRelease();
				return true;
		}

		if (delegate == null) {
			return false;
		}
		return delegate.handleMessage(msg);
	}

	public abstract Object getNativeObject();
	protected abstract void doSetProperty(String name, Object value);
	protected abstract boolean doFireEvent(String type, Object data);
	protected abstract void doRelease();
}
