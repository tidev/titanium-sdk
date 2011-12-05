/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;

import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;

import android.os.Handler;
import android.os.Message;


public abstract class KrollObject implements Handler.Callback
{
	private static final String TAG = "KrollObject";

	protected static final int MSG_RELEASE = 100;
	protected static final int MSG_SET_WINDOW = 101;
	protected static final int MSG_LAST_ID = MSG_SET_WINDOW;

	protected HashMap<String, Boolean> hasListenersForEventType = new HashMap<String, Boolean>();
	protected Handler handler;

	private KrollProxySupport proxySupport;

	public KrollObject()
	{
		handler = new Handler(TiMessenger.getRuntimeMessenger().getLooper(), this);	
	}

	public void setProxySupport(KrollProxySupport proxySupport)
	{
		this.proxySupport = proxySupport;
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
		if (proxySupport != null) {
			proxySupport.onHasListenersChanged(event, hasListeners);
		}
	}
	
	public void onEventFired(String event, String data)
	{
		if(proxySupport != null) {
			proxySupport.onEventFired(event, data);
		}
	}

	protected void release()
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			doRelease();

		} else {
			Message message = handler.obtainMessage(MSG_RELEASE, null);
			message.sendToTarget();
		}
	}

	public void setWindow(Object windowProxyObject)
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			doSetWindow(windowProxyObject);

		} else {
			TiMessenger.sendBlockingRuntimeMessage(handler.obtainMessage(MSG_SET_WINDOW), windowProxyObject);
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_RELEASE: {
				doRelease();

				return true;
			}
			case MSG_SET_WINDOW: {
				AsyncResult result = (AsyncResult) msg.obj;
				doSetWindow(result.getArg());
				result.setResult(null);

				return true;
			}
		}

		return false;
	}

	public abstract Object getNativeObject();
	protected abstract void setProperty(String name, Object value);
	protected abstract boolean fireEvent(String type, Object data);
	protected abstract void doRelease();
	protected abstract void doSetWindow(Object windowProxyObject);
}

