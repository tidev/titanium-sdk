/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.kroll.IKrollCallable;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;

public class TiProxy implements Handler.Callback, TiDynamicMethod, OnEventListenerChange

{
	private static final String LCAT = "TiProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected static final int MSG_MODEL_PROPERTY_CHANGE = 100;
	protected static final int MSG_LISTENER_ADDED = 101;
	protected static final int MSG_LISTENER_REMOVED = 102;
	protected static final int MSG_MODEL_PROPERTIES_CHANGED = 103;

	protected static final int MSG_LAST_ID = 999;

	private TiContext tiContext;
	protected TiContext creatingContext;
	private Handler uiHandler;
	private CountDownLatch waitForHandler;

	public TiDict getConstants() {
		return null;
	}

	// TODO consider using a single object or a pool of them.
	private static class PropertyChangeHolder
	{
		private TiProxyListener modelListener;
		private String key;
		private Object current;
		private Object value;
		private TiProxy proxy;

		PropertyChangeHolder(TiProxyListener modelListener, String key, Object current, Object value, TiProxy proxy)
		{
			this.modelListener = modelListener;
			this.key = key;
			this.current = current;
			this.value = value;
			this.proxy = proxy;
		}

		public void fireEvent() {
			try {
				modelListener.propertyChanged(key, current, value, proxy);
			} finally {
				modelListener = null;
				proxy = null;
			}
		}
	}

	protected TiDict dynprops; // Dynamic properties
	protected static AtomicInteger proxyCounter;
	protected String proxyId; //TODO implement
	protected TiProxyListener modelListener;

	public TiProxy(TiContext tiContext)
	{
		if (proxyCounter == null) {
			proxyCounter = new AtomicInteger();
		}
		if (DBG) {
			Log.d(LCAT, "New: " + getClass().getSimpleName());
		}
		this.tiContext = tiContext;
		this.proxyId = "proxy$" + proxyCounter.incrementAndGet();

		final TiProxy me = this;
		waitForHandler = new CountDownLatch(1);

		if (tiContext.isUIThread()) {
			uiHandler = new Handler(me);
			waitForHandler.countDown();
		} else {
			Activity activity = tiContext.getActivity();
			if (activity == null || activity.isFinishing()) {
				if (DBG) {
					Log.w(LCAT, "Proxy created in context with no activity.  Activity finished?  Context is effectively dead.");
				}
				return;
			}
			activity.runOnUiThread(new Runnable()
			{
				public void run() {
					if (DBG) {
						Log.i(LCAT, "Creating handler on UI thread for Proxy");
					}
					uiHandler = new Handler(me);
					waitForHandler.countDown();
				}
			});
		}
	}

	public void setModelListener(TiProxyListener modelListener) {
		this.modelListener = modelListener;
		if (modelListener != null) {
			this.modelListener.processProperties(dynprops != null ? new TiDict(dynprops) : new TiDict());
		}
	}

	public TiContext switchContext(TiContext tiContext) {
		TiContext oldContext = this.tiContext;
		this.tiContext = tiContext;
		if (creatingContext == null) {
			// We'll assume for now that if we're switching contexts,
			// it's because the creation of a window forced a new context
			// In that case, we need to hold on to the original / creating
			// context so that event listeners registered there still receive events.
			creatingContext = oldContext;
		}
		return oldContext;
	}
	
	public void switchToCreatingContext() {
		if (creatingContext != null && tiContext != null && !creatingContext.equals(tiContext)) {
			switchContext(creatingContext);
		}
	}
	
	protected Handler getUIHandler() {
		try {
			waitForHandler.await();
		} catch (InterruptedException e) {
			// ignore
		}
		return uiHandler;
	}
	
	public TiContext getTiContext() {
		return tiContext;
	}

	public String getProxyId() {
		return proxyId;
	}

	public boolean handleMessage(Message msg) {
		switch (msg.what) {
			case MSG_MODEL_PROPERTY_CHANGE : {
				PropertyChangeHolder pch = (PropertyChangeHolder) msg.obj;
				pch.fireEvent();
				return true;
			}
			case MSG_LISTENER_ADDED : {
				if (modelListener != null) {
					modelListener.listenerAdded(msg.getData().getString("eventName"), msg.arg1, (TiProxy) msg.obj);
				}
				return true;
			}
			case MSG_LISTENER_REMOVED : {
				if (modelListener != null) {
					modelListener.listenerRemoved(msg.getData().getString("eventName"), msg.arg1, (TiProxy) msg.obj);
				}
				return true;
			}
			case MSG_MODEL_PROPERTIES_CHANGED: {
				firePropertiesChanged((List<PropertyChangeHolder>)msg.obj);
				return true;
			}
		}
		return false;
	}

	public Object getDynamicValue(String key)
	{
		Object result = null;

		if (dynprops != null) {
			result = dynprops.get(key);
		}
		return result;
	}

	public boolean hasDynamicValue(String key) {
		if (dynprops == null) {
			return false;
		}
		return dynprops.containsKey(key);
	}

	public void setDynamicValue(String key, Object value) {
		internalSetDynamicValue(key, value, true);
	}

	public void internalSetDynamicValue(String key, Object value, boolean fireChange)
	{
		if (dynprops == null) {
			dynprops = new TiDict();
		}

		// Get the current value if it exists.
		Object current = dynprops.get(key);
		value = TiConvert.putInTiDict(dynprops, key, value);

		if (fireChange && !(current == null && value == null)) {
			if ((current == null && value != null) || (value == null && current != null) || (!current.equals(value))) {
				if (modelListener != null) {
					if (tiContext.isUIThread()) {
						modelListener.propertyChanged(key, current, value, this);
					} else {
						PropertyChangeHolder pch = new PropertyChangeHolder(modelListener, key, current, value, this);
						getUIHandler().obtainMessage(MSG_MODEL_PROPERTY_CHANGE, pch).sendToTarget();
					}
				}
			}
		}
	}

	public TiDict getDynamicProperties() {
		if (dynprops == null) {
			dynprops = new TiDict();
		}
		return dynprops;
	}

	public int addEventListener(String eventName, Object listener) {
		int listenerId = -1;

		if (DBG) {
			Log.i(LCAT, "Adding listener for \"" + eventName + "\": " + listener.getClass().getName());
		}
		TiContext ctx = getTiContext();
		if (ctx != null) {
			listenerId = ctx.addEventListener(eventName, this, listener);
		}

		return listenerId;
	}

	public void removeEventListener(String eventName, Object listener)
	{
		TiContext ctx = getTiContext();
		if (ctx != null) {
			ctx.removeEventListener(eventName, listener);
		}
		// If context was switched (this occurs when heavy window opens)
		// and event listeners existed on the old context, we do NOT move
		// those event listeners over.  So we need to check to remove them
		// in the old context as well.
		if (creatingContext != null && !creatingContext.equals(ctx)) {
			creatingContext.removeEventListener(eventName, listener );
		}
	}
	
	public void removeEventListenersFromContext(TiContext listeningContext)
	{
		TiContext ctx = getTiContext();
		if (ctx != null) {
			ctx.removeEventListenersFromContext(listeningContext);
		}
	}

	protected void setProperties(TiDict options)
	{
		if (options != null) {
			for (String key : options.keySet()) {
				setDynamicValue(key, options.get(key));
			}
		}
	}

	public void eventListenerAdded(String eventName, int count, TiProxy proxy)
	{
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_ADDED, count, -1, proxy);
			m.getData().putString("eventName", eventName);
			m.sendToTarget();
		}
	}

	public void eventListenerRemoved(String eventName, int count, TiProxy proxy) {
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_REMOVED, count, -1, proxy);
			m.getData().putString("eventName", eventName);
			m.sendToTarget();
		}
	}

	public boolean fireEvent(String eventName, TiDict data) {
		TiContext ctx = getTiContext();
		boolean handled = false;
		
		if (data == null) {
			data = new TiDict();
		}
		if (!data.containsKey("type")) {
			data.put("type", eventName);
		}
		if (!data.containsKey("source")) {
			data.put("source", this);
		}

		if (ctx != null) {
			handled = ctx.dispatchEvent(eventName, data, this);
		}
		if (creatingContext != null) {
			handled = creatingContext.dispatchEvent(eventName, data, this) || handled;
		}
		return handled;
	}

	public void fireSingleEvent(String eventName, Object listener, TiDict data)
	{
		if (listener != null) {
			IKrollCallable callable = (IKrollCallable) listener;
			if (data == null) {
				data = new TiDict();
			}
			callable.callWithProperties(data);
		}
	}

	public boolean hasListeners(String eventName)
	{
		boolean hasListeners = getTiContext().hasEventListener(eventName, this);
		if (creatingContext != null) {
			hasListeners = hasListeners || creatingContext.hasEventListener(eventName, this);
		}
		return hasListeners;
	}

	public Object resultForUndefinedMethod(String name, Object[] args) {
		throw new UnsupportedOperationException("Method: " + name + " not supported by " + getClass().getSimpleName());
	}

	protected TiDict createErrorResponse(int code, String message)
	{
		TiDict error = new TiDict();

		error.put("code", code);
		error.put("message", message);

		return error;
	}
	
	protected boolean shouldFireChange(Object oldValue, Object newValue) {
		if (!(oldValue == null && newValue == null)) {
			if ((oldValue == null && newValue != null)
					|| (newValue == null && oldValue != null)
					|| (!oldValue.equals(newValue))) {
				return true;
			}
		}
		return false;
	}
	
	public void extend(TiDict options) {
		ArrayList<PropertyChangeHolder> propertyChanges = new ArrayList<PropertyChangeHolder>();

		for (String name : options.keySet()) {
			Object oldValue = getDynamicValue(name);
			Object value = options.get(name);
			internalSetDynamicValue(name, value, false);

			if (shouldFireChange(oldValue, value)) {
				PropertyChangeHolder pch = new PropertyChangeHolder(modelListener, name, oldValue, value, this);
				propertyChanges.add(pch);
			}
		}

		if (getTiContext().isUIThread()) {
			firePropertiesChanged(propertyChanges);
		} else {
			Message msg = getUIHandler().obtainMessage(MSG_MODEL_PROPERTIES_CHANGED, propertyChanges);
			msg.sendToTarget();
		}
	}
	
	protected void firePropertiesChanged(List<PropertyChangeHolder> changes) {
		if (modelListener != null) {
			for (PropertyChangeHolder change : changes) {
				modelListener.propertyChanged(change.key, change.current, change.value, this);
			}
		}
	}
}
