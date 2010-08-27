/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.mozilla.javascript.Scriptable;

import android.os.Handler;
import android.os.Message;

@Kroll.proxy
public class KrollProxy implements Handler.Callback, OnEventListenerChange {
	
	private static final String TAG = "KrollProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected static final int MSG_LISTENER_ADDED = 101;
	protected static final int MSG_LISTENER_REMOVED = 102;
	protected static final int MSG_LAST_ID = 999;
	protected static AtomicInteger proxyCounter = new AtomicInteger();
	
	public static final Object UNDEFINED = new Object();
	
	protected KrollDict properties = new KrollDict();
	protected TiContext context, creatingContext;
	
	protected Handler uiHandler;
	protected CountDownLatch waitForHandler;
	protected String proxyId;
	protected KrollProxyListener modelListener;
	
	public KrollProxy(TiContext context) {
		this.context = context;
		if (DBG) {
			Log.d(TAG, "New: " + getClass().getSimpleName());
		}
		this.proxyId = "proxy$" + proxyCounter.incrementAndGet();

		final KrollProxy me = this;
		waitForHandler = new CountDownLatch(1);

		if (context.isUIThread()) {
			uiHandler = new Handler(me);
			waitForHandler.countDown();
		} else {
			context.getActivity().runOnUiThread(new Runnable()
			{
				public void run() {
					if (DBG) {
						Log.i(TAG, "Creating handler on UI thread for Proxy");
					}
					uiHandler = new Handler(me);
					waitForHandler.countDown();
				}
			});
		}
	}
	
	public String getAPIClassName() {
		return getClass().getSimpleName();
	}
	
	public boolean has(Scriptable scope, String name) {
		try {
			get(scope, name);
			return true;
		} catch (NoSuchFieldException e) {
			return false;
		}
	}
	
	public void bind(Scriptable scope, KrollProxy rootObject) {
		KrollBindings bindings = context.getTiApp().getBindings();
		
		if (bindings != null) {
			bindings.getBinding(getClass()).bind(scope, rootObject, this);
		}
	}
	
	public Object get(Scriptable scope, String name) throws NoSuchFieldException {
		if (properties.containsKey(name)) {
			Object value = properties.get(name);
			if (value instanceof KrollDynamicProperty) {
				return getDynamicProperty(scope, name, (KrollDynamicProperty)value);
			} else {
				return value;
			}
		}
		return UNDEFINED;
	}
	
	public void set(Scriptable scope, String name, Object value) throws NoSuchFieldException {
		if (properties.containsKey(name)) {
			Object currentValue = properties.get(name);
			if (currentValue instanceof KrollDynamicProperty) {
				setDynamicProperty(scope, name, (KrollDynamicProperty)currentValue, value);
				return;
			}
		}
		properties.put(name, value);
	}
	
	public Object call(Scriptable scope, String name, Object[] args) throws Exception {
		Object value = UNDEFINED;
		try {
			value = get(scope, name);
		} catch (NoSuchFieldException e) {}
		
		if (value != UNDEFINED && value instanceof KrollMethod) {
			KrollMethod method = (KrollMethod)value;
			KrollInvocation inv = KrollInvocation.createMethodInvocation(getTiContext(), scope, name, method, this);
			
			return method.invoke(inv, args);
		} else throw new NoSuchMethodException("method \""+name+"\" of proxy \""+
			getAPIClassName()+"\" wasn't found");
	}
	
	protected Object getDynamicProperty(Scriptable scope, String name, KrollDynamicProperty dynprop)
		throws NoSuchFieldException {
		if (dynprop.supportsGet(name)) {
			KrollInvocation inv = KrollInvocation.createPropertyGetInvocation(getTiContext(), scope, name, dynprop, this);
			return dynprop.get(inv, name);
		} else {
			throw new NoSuchFieldException("dynamic property \""+name+"\" of proxy \""+
				getAPIClassName()+"\" doesn't have read support");
		}
	}
	
	protected void setDynamicProperty(Scriptable scope, String name, KrollDynamicProperty dynprop, Object value)
		throws NoSuchFieldException {
		if (dynprop.supportsSet(name)) {
			KrollInvocation inv = KrollInvocation.createPropertySetInvocation(getTiContext(), scope, name, dynprop, this);
			dynprop.set(inv, name, value);
		} else {
			throw new NoSuchFieldException("dynamic property \""+name+"\" of proxy \""+
				getAPIClassName()+"\" doesn't have write support");
		}
	}
	
	// direct-access accessors (these circumvent programmatic accessors and go straight to the internal map)
	public KrollDict getProperties() {
		return properties;
	}
	
	public boolean hasProperty(String name) {
		return properties.containsKey(name);
	}
	
	public Object getProperty(String name) {
		return properties.get(name);
	}
	
	public void setProperty(String name, Object value) {
		properties.put(name, value);
	}
	
	// Handler.Callback
	public boolean handleMessage(Message msg) {
		switch (msg.what) {
			case MSG_LISTENER_ADDED : {
				if (modelListener != null) {
					modelListener.listenerAdded(msg.getData().getString("eventName"), msg.arg1, (KrollProxy) msg.obj);
				}
				return true;
			}
			case MSG_LISTENER_REMOVED : {
				if (modelListener != null) {
					modelListener.listenerRemoved(msg.getData().getString("eventName"), msg.arg1, (KrollProxy) msg.obj);
				}
				return true;
			}
		}
		return false;
	}
	
	public void setModelListener(KrollProxyListener modelListener) {
		this.modelListener = modelListener;
	}

	public TiContext switchContext(TiContext tiContext) {
		TiContext oldContext = this.context;
		this.context = tiContext;
		if (creatingContext == null) {
			// We'll assume for now that if we're switching contexts,
			// it's because the creation of a window forced a new context
			// In that case, we need to hold on to the original / creating
			// context so that event listeners registered there still receive events.
			creatingContext = oldContext;
		}
		return oldContext;
	}
	
	public Handler getUIHandler() {
		try {
			waitForHandler.await();
		} catch (InterruptedException e) {
			// ignore
		}
		return uiHandler;
	}
	
	public TiContext getTiContext() {
		return context;
	}
	
	public String getProxyId() {
		return proxyId;
	}
	
	/// Events
	
	@Kroll.method
	public int addEventListener(KrollInvocation invocation, String eventName, Object listener) {
		int listenerId = -1;

		if (DBG) {
			Log.i(TAG, "Adding listener for \"" + eventName + "\": " + listener.getClass().getName());
		}
		TiContext ctx = getTiContext();
		if (ctx != null) {
			listenerId = ctx.addEventListener(eventName, this, listener);
		}

		return listenerId;
	}

	@Kroll.method
	public void removeEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		TiContext ctx = getTiContext();
		if (ctx != null) {
			ctx.removeEventListener(eventName, listener);
		}
	}

	public void eventListenerAdded(String eventName, int count, KrollProxy proxy)
	{
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_ADDED, count, -1, proxy);
			m.getData().putString("eventName", eventName);
			m.sendToTarget();
		}
	}

	public void eventListenerRemoved(String eventName, int count, KrollProxy proxy) {
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_REMOVED, count, -1, proxy);
			m.getData().putString("eventName", eventName);
			m.sendToTarget();
		}
	}

	@Kroll.method
	public boolean fireEvent(KrollInvocation invocation, String eventName, KrollDict data) {
		TiContext ctx = getTiContext();
		boolean handled = false;
		if (ctx != null) {
			handled = ctx.dispatchEvent(invocation, eventName, data, this);
		}
		if (creatingContext != null) {
			handled = creatingContext.dispatchEvent(invocation, eventName, data, this) || handled;
		}
		return handled;
	}
	
	// Convenience for internal code
	public boolean fireEvent(String eventName, KrollDict data) {
		KrollInvocation inv = KrollInvocation.createMethodInvocation(
			getTiContext(),
			getTiContext().getJSContext().getScope(),
			getAPIClassName()+":event:"+eventName, null, this);
		return fireEvent(inv, eventName, data);
	}

	@Kroll.method
	public void fireSingleEvent(KrollInvocation invocation, String eventName, Object listener, KrollDict data)
	{
		if (listener != null) {
			KrollMethod method = (KrollMethod) listener;
			if (data == null) {
				data = new KrollDict();
			}
			
			method.invoke(invocation, new Object[] { data });
		}
	}
	
	// Convenience for internal code
	public void fireSingleEvent(String eventName, Object listener, KrollDict data) {
		KrollInvocation inv = KrollInvocation.createMethodInvocation(
			getTiContext(),
			getTiContext().getJSContext().getScope(),
			getAPIClassName()+":event:"+eventName, null, this);
		fireSingleEvent(inv, eventName, listener, data);
	}

	public boolean hasListeners(String eventName)
	{
		boolean hasListeners = getTiContext().hasAnyEventListener(eventName);
		if (creatingContext != null) {
			hasListeners = hasListeners || creatingContext.hasAnyEventListener(eventName);
		}
		return hasListeners;
	}
	
	public Object resultForUndefinedMethod(String name, Object[] args) {
		throw new UnsupportedOperationException("Method: " + name + " not supported by " + getClass().getSimpleName());
	}
	
	protected KrollDict createErrorResponse(int code, String message)
	{
		KrollDict error = new KrollDict();
		error.put("code", code);
		error.put("message", message);

		return error;
	}
}
