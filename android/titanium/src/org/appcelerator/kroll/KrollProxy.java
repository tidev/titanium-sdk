/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.mozilla.javascript.Scriptable;

import ti.modules.titanium.TitaniumModule;
import android.os.Handler;
import android.os.Message;

@Kroll.proxy
public class KrollProxy implements Handler.Callback, OnEventListenerChange {

	private static final String TAG = "KrollProxy";
	private static final boolean DBG = TiConfig.LOGD;
	
	protected static final int MSG_MODEL_PROPERTY_CHANGE = 100;
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
	protected static HashMap<Class<? extends KrollProxy>, KrollProxyBinding> bindings = new HashMap<Class<? extends KrollProxy>, KrollProxyBinding>();
	
	@Kroll.inject
	protected KrollInvocation currentInvocation;

	public KrollProxy(TiContext context) {
		this(context, true);
	}
	
	public KrollProxy(TiContext context, boolean autoBind) {
		this.context = context;
		
		if (DBG) {
			Log.d(TAG, "New: " + getClass().getSimpleName());
		}
		this.proxyId = "proxy$" + proxyCounter.incrementAndGet();
		if (autoBind) {
			bind(context.getScope(), null);
		}

		final KrollProxy me = this;
		waitForHandler = new CountDownLatch(1);

		if (context.isUIThread()) {
			uiHandler = new Handler(me);
			waitForHandler.countDown();
		} else {
			context.getActivity().runOnUiThread(new Runnable() {
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
	
	protected KrollProxyBinding getBinding() {
		if (!bindings.containsKey(getClass())) {
			String bindingClassName = getClass().getName();
			bindingClassName += "BindingGen";
			
			try {
				Class<?> bindingClass = Class.forName(bindingClassName);
				KrollProxyBinding bindingInstance = (KrollProxyBinding) bindingClass.newInstance();
				bindings.put(getClass(), bindingInstance);
				return bindingInstance;
			} catch (ClassNotFoundException e) {
				Log.e(TAG, "Couldn't find binding class for proxy " + getClass().getName(), e);
			} catch (IllegalAccessException e) {
				Log.e(TAG, "Couldn't access constructor for binding class " + bindingClassName, e);
			} catch (InstantiationException e) {
				Log.e(TAG, "Couldn't insantiate binding class " + bindingClassName, e);
			}
		}
		return bindings.get(getClass());
	}
	
	public void bind(Scriptable scope, KrollProxy parentProxy) {
		KrollProxyBinding binding = getBinding();
		KrollBridge bridge = (KrollBridge) getTiContext().getJSContext();
		
		if (parentProxy == null) {
			parentProxy = this;
			if (!(this instanceof TitaniumModule)) {
				// chicken/egg problem, we can't get the root object from the bridge if this is the constructor of the root object
				parentProxy = bridge.getRootObject();
			}
		}
		
		List<String> filteredBindings = null;
		if (this instanceof KrollModule) {
			filteredBindings = getTiContext().getTiApp().getFilteredBindings(binding.getAPIName());
		}
		
		binding.bind(scope, parentProxy, this, filteredBindings);
	}

	public String getAPIName() {
		return getBinding().getAPIName();
	}

	public boolean has(Scriptable scope, String name) {
		try {
			get(scope, name);
			return true;
		} catch (NoSuchFieldException e) {
			return false;
		}
	}

	public Object get(Scriptable scope, String name)
			throws NoSuchFieldException {
		if (properties.containsKey(name)) {
			Object value = properties.get(name);
			if (value instanceof KrollDynamicProperty) {
				return getDynamicProperty(scope, name,
						(KrollDynamicProperty) value);
			} else {
				return value;
			}
		}
		return UNDEFINED;
	}

	public void set(Scriptable scope, String name, Object value)
			throws NoSuchFieldException {
		Object oldValue = null;

		if (properties.containsKey(name)) {
			Object currentValue = properties.get(name);
			if (currentValue instanceof KrollDynamicProperty) {
				setDynamicProperty(scope, name,
						(KrollDynamicProperty) currentValue, value);
				return;
			} else {
				oldValue = currentValue;
			}
		}

		if (oldValue != value) {
			firePropertyChanged(name, oldValue, value);
		}
		properties.put(name, value);
	}

	public Object call(Scriptable scope, String name, Object[] args)
			throws Exception {
		Object value = UNDEFINED;
		try {
			value = get(scope, name);
		} catch (NoSuchFieldException e) {
		}

		if (value != UNDEFINED && value instanceof KrollMethod) {
			KrollMethod method = (KrollMethod) value;
			KrollInvocation inv = KrollInvocation.createMethodInvocation(
					getTiContext(), scope, new KrollObject(this), name, method, this);

			return method.invoke(inv, args);
		} else
			throw new NoSuchMethodException("method \"" + name
					+ "\" of proxy \"" + getAPIName() + "\" wasn't found");
	}

	protected Object getDynamicProperty(Scriptable scope, String name,
			KrollDynamicProperty dynprop) throws NoSuchFieldException {
		if (dynprop.supportsGet(name)) {
			KrollInvocation inv = KrollInvocation.createPropertyGetInvocation(
					getTiContext(), scope, new KrollObject(this), name, dynprop, this);
			return dynprop.get(inv, name);
		} else {
			throw new NoSuchFieldException("dynamic property \"" + name
					+ "\" of proxy \"" + getAPIName()
					+ "\" doesn't have read support");
		}
	}

	protected void setDynamicProperty(Scriptable scope, String name,
			KrollDynamicProperty dynprop, Object value)
			throws NoSuchFieldException {
		if (dynprop.supportsSet(name)) {
			KrollInvocation inv = KrollInvocation.createPropertySetInvocation(
					getTiContext(), scope, new KrollObject(this), name, dynprop, this);
			dynprop.set(inv, name, value);
		} else {
			throw new NoSuchFieldException("dynamic property \"" + name
					+ "\" of proxy \"" + getAPIName()
					+ "\" doesn't have write support");
		}
	}

	// direct accessors (these circumvent programmatic accessors and go straight
	// to the internal map)
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
		setProperty(name, value, false);
	}

	private static class PropertyChangeHolder {
		private KrollProxyListener modelListener;
		private String key;
		private Object current;
		private Object value;
		private KrollProxy proxy;

		PropertyChangeHolder(KrollProxyListener modelListener, String key,
				Object current, Object value, KrollProxy proxy) {
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

	protected void firePropertyChanged(String name, Object oldValue, Object newValue) {
		if (modelListener != null) {
			if (context.isUIThread()) {
				modelListener.propertyChanged(name, oldValue, newValue,
						this);
			} else {
				PropertyChangeHolder pch = new PropertyChangeHolder(
						modelListener, name, oldValue, newValue, this);
				getUIHandler().obtainMessage(MSG_MODEL_PROPERTY_CHANGE,
						pch).sendToTarget();
			}
		}
	}
	
	public void setProperty(String name, Object value, boolean fireChange) {
		Object current = properties.get(name);
		properties.put(name, value);

		if (fireChange && !(current == null && value == null)) {
			if ((current == null && value != null)
					|| (value == null && current != null)
					|| (!current.equals(value))) {
				firePropertyChanged(name, current, value);
			}
		}
	}

	public void handleCreationArgs(Object[] args) {
		if (args.length >= 1 && args[0] instanceof KrollDict) {
			handleCreationDict((KrollDict)args[0]);
		}
	}
	
	protected KrollDict creationDict = null;
	public void handleCreationDict(KrollDict dict) {
		if (dict != null) {
			for (String key : dict.keySet()) {
				setProperty(key, dict.get(key), true);
			}

			creationDict = (KrollDict)dict.clone();
			if (modelListener != null) {
				modelListener.processProperties(creationDict);
				creationDict = null;
			}
		}
	}

	// Handler.Callback
	public boolean handleMessage(Message msg) {
		switch (msg.what) {
		case MSG_MODEL_PROPERTY_CHANGE: {
			PropertyChangeHolder pch = (PropertyChangeHolder) msg.obj;
			pch.fireEvent();
			return true;
		}
		case MSG_LISTENER_ADDED: {
			if (modelListener != null) {
				modelListener
						.listenerAdded(msg.getData().getString("eventName"),
								msg.arg1, (KrollProxy) msg.obj);
			}
			return true;
		}
		case MSG_LISTENER_REMOVED: {
			if (modelListener != null) {
				modelListener.listenerRemoved(msg.getData().getString(
						"eventName"), msg.arg1, (KrollProxy) msg.obj);
			}
			return true;
		}
		}
		return false;
	}

	public void setModelListener(KrollProxyListener modelListener) {
		this.modelListener = modelListener;
		if (this.modelListener != null) {
			this.modelListener.processProperties(creationDict != null ? creationDict : new KrollDict());
		}
	}

	public TiContext switchContext(TiContext tiContext) {
		TiContext oldContext = this.context;
		this.context = tiContext;
		if (creatingContext == null) {
			// We'll assume for now that if we're switching contexts,
			// it's because the creation of a window forced a new context
			// In that case, we need to hold on to the original / creating
			// context so that event listeners registered there still receive
			// events.
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

	public KrollBridge getKrollBridge() {
		return (KrollBridge) context.getJSContext();
	}
	
	public String getProxyId() {
		return proxyId;
	}

	// / Events

	@Kroll.method
	public int addEventListener(String eventName, Object listener) {
		int listenerId = -1;

		if (DBG) {
			Log.i(TAG, "Adding listener for \"" + eventName + "\": "
					+ listener.getClass().getName());
		}
		TiContext ctx = getTiContext();
		if (ctx != null) {
			listenerId = ctx.addEventListener(eventName, this, listener);
		}

		return listenerId;
	}

	@Kroll.method
	public void removeEventListener(String eventName, Object listener) {
		TiContext ctx = getTiContext();
		if (ctx != null) {
			ctx.removeEventListener(eventName, listener);
		}
	}

	public void eventListenerAdded(String eventName, int count, KrollProxy proxy) {
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_ADDED, count,
					-1, proxy);
			m.getData().putString("eventName", eventName);
			m.sendToTarget();
		}
	}

	public void eventListenerRemoved(String eventName, int count,
			KrollProxy proxy) {
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_REMOVED,
					count, -1, proxy);
			m.getData().putString("eventName", eventName);
			m.sendToTarget();
		}
	}

	@Kroll.method
	public boolean fireEvent(String eventName, @Kroll.argument(optional=true) KrollDict data) {
		KrollInvocation invocation = currentInvocation == null ?
				createEventInvocation(eventName) : currentInvocation;
		TiContext ctx = getTiContext();
		boolean handled = false;
		if (ctx != null) {
			handled = ctx.dispatchEvent(invocation, eventName, data,
					this);
		}
		if (creatingContext != null) {
			handled = creatingContext.dispatchEvent(invocation,
					eventName, data, this)
					|| handled;
		}
		return handled;
	}

	// Convenience for internal code
	public KrollInvocation createEventInvocation(String eventName) {
		KrollInvocation inv = KrollInvocation.createMethodInvocation(
				getTiContext(),
				getTiContext().getJSContext().getScope(),
				new KrollObject(this),
				getAPIName() + ":event:" + eventName, null, this);
		return inv;
	}

	@Kroll.method
	public void fireSingleEvent(String eventName, Object listener,
			KrollDict data) {
		if (listener != null) {
			KrollInvocation invocation = currentInvocation == null ?
				createEventInvocation(eventName) : currentInvocation;
			KrollMethod method = (KrollMethod) listener;
			if (data == null) {
				data = new KrollDict();
			}

			try {
				method.invoke(invocation, new Object[] { data });
			} catch (Exception e) {
				Log.e(TAG, e.getMessage(), e);
			}
		}
	}

	public boolean hasListeners(String eventName) {
		boolean hasListeners = getTiContext().hasAnyEventListener(eventName);
		if (creatingContext != null) {
			hasListeners = hasListeners
					|| creatingContext.hasAnyEventListener(eventName);
		}
		return hasListeners;
	}

	public Object resultForUndefinedMethod(String name, Object[] args) {
		throw new UnsupportedOperationException("Method: " + name
				+ " not supported by " + getClass().getSimpleName());
	}

	protected KrollDict createErrorResponse(int code, String message) {
		KrollDict error = new KrollDict();
		error.put("code", code);
		error.put("message", message);

		return error;
	}

	public KrollInvocation getCurrentInvocation() {
		return currentInvocation;
	}
	
	@Kroll.method
	public String toString() {
		return "[Ti."+getAPIName() + "]";
	}
}
