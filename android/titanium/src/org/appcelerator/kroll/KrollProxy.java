/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.ArrayList;
import java.util.Arrays;
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
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

import android.os.Handler;
import android.os.Message;

@Kroll.proxy
public class KrollProxy implements Handler.Callback, OnEventListenerChange {

	private static final String TAG = "KrollProxy";
	private static final boolean DBG = TiConfig.LOGD;
	
	protected static final int MSG_MODEL_PROPERTY_CHANGE = 100;
	protected static final int MSG_LISTENER_ADDED = 101;
	protected static final int MSG_LISTENER_REMOVED = 102;
	protected static final int MSG_MODEL_PROPERTIES_CHANGED = 103;
	protected static final int MSG_LAST_ID = 999;
	protected static AtomicInteger proxyCounter = new AtomicInteger();

	public static final Object UNDEFINED = new Object();

	protected KrollDict properties = new KrollDict();
	protected KrollDict bindings = new KrollDict();
	protected TiContext context, creatingContext;

	protected Handler uiHandler;
	protected CountDownLatch waitForHandler;
	protected String proxyId;
	protected KrollProxyListener modelListener;
	protected KrollEventManager eventManager;
	protected static HashMap<Class<? extends KrollProxy>, KrollProxyBinding> proxyBindings = new HashMap<Class<? extends KrollProxy>, KrollProxyBinding>();
	
	@Kroll.inject
	protected KrollInvocation currentInvocation;
	
	public KrollProxy(TiContext context) {
		this(context, true);
	}
	
	public KrollProxy(TiContext context, boolean autoBind) {
		this.context = context;
		this.eventManager = new KrollEventManager(this);
		
		if (DBG) {
			Log.d(TAG, "New: " + getClass().getSimpleName());
		}
		this.proxyId = "proxy$" + proxyCounter.incrementAndGet();
		if (autoBind) {
			bindProperties();
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
		if (!proxyBindings.containsKey(getClass())) {
			String bindingClassName = getClass().getName();
			bindingClassName += "BindingGen";
			
			try {
				Class<?> bindingClass = Class.forName(bindingClassName);
				KrollProxyBinding bindingInstance = (KrollProxyBinding) bindingClass.newInstance();
				proxyBindings.put(getClass(), bindingInstance);
				return bindingInstance;
			} catch (ClassNotFoundException e) {
				Log.e(TAG, "Couldn't find binding class for proxy " + getClass().getName(), e);
			} catch (IllegalAccessException e) {
				Log.e(TAG, "Couldn't access constructor for binding class " + bindingClassName, e);
			} catch (InstantiationException e) {
				Log.e(TAG, "Couldn't insantiate binding class " + bindingClassName, e);
			}
		}
		return proxyBindings.get(getClass());
	}
	
	public void bindProperties() {
		KrollProxyBinding binding = getBinding();
		String[] filteredBindings = null;
		if (this instanceof KrollModule) {
			filteredBindings = getTiContext().getTiApp().getFilteredBindings(binding.getAPIName());
		}
		
		binding.bindProperties(this, filteredBindings == null ? new ArrayList<String>() : Arrays.asList(filteredBindings));
	}
	
	public void bindToParent(KrollProxy parent) {
		KrollProxyBinding binding = getBinding();
		binding.bindToParent(parent, this);
	}
	
	public void bindContextSpecific(KrollBridge bridge) {
		KrollProxyBinding binding = getBinding();
		binding.bindContextSpecific(bridge, this);
	}

	public String getAPIName() {
		return getBinding().getAPIName();
	}

	public boolean has(Scriptable scope, String name) {
		return bindings.containsKey(name) || properties.containsKey(name);
	}

	public Object get(Scriptable scope, String name)
			throws NoSuchFieldException {
		if (bindings.containsKey(name)) {
			Object value = bindings.get(name);
			if (value instanceof KrollProperty) {
				return getDynamicProperty(scope, name,
						(KrollProperty) value);
			} else {
				return value;
			}
		} else if (properties.containsKey(name)) {
			return properties.get(name);
		}
		return UNDEFINED;
	}

	public void set(Scriptable scope, String name, Object value)
			throws NoSuchFieldException {

		if (bindings.containsKey(name)) {
			Object currentValue = bindings.get(name);
			if (currentValue instanceof KrollProperty) {
				setDynamicProperty(scope, name,
						(KrollProperty) currentValue, value);
				return;
			} else {
				// support for overwriting an internal binding
				bindings.put(name, value);
				return;
			}
		}
		
		KrollInvocation invocation = KrollInvocation.createPropertySetInvocation(scope, null, name, null, this);
		Object convertedValue = KrollConverter.getInstance().convertJavascript(invocation, value, Object.class);
		setProperty(name, convertedValue, true);
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
			KrollProperty dynprop) throws NoSuchFieldException {
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
			KrollProperty dynprop, Object value)
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

	protected void firePropertyChanged(String name, Object oldValue, Object newValue) {
		if (modelListener != null) {
			if (context.isUIThread()) {
				modelListener.propertyChanged(name, oldValue, newValue,
						this);
			} else {
				KrollPropertyChange pch = new KrollPropertyChange(name, oldValue, newValue);
				getUIHandler().obtainMessage(MSG_MODEL_PROPERTY_CHANGE, pch).sendToTarget();
			}
		}
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
	
	public void setProperty(String name, Object value, boolean fireChange) {
		Object current = properties.get(name);
		properties.put(name, value);

		if (fireChange && shouldFireChange(current, value)) {
			firePropertyChanged(name, current, value);
		}
	}
	
	// native extending support allows us to whole-sale apply properties and only fire one event / job
	@Kroll.method
	public void extend(KrollInvocation invocation, KrollDict options) {
		ArrayList<KrollPropertyChange> propertyChanges = new ArrayList<KrollPropertyChange>();
		
		for (String name : options.keySet()) {
			Object oldValue = properties.get(name);
			Object value = options.get(name);
			properties.put(name, value);
			
			if (shouldFireChange(oldValue, value)) {
				KrollPropertyChange pch = new KrollPropertyChange(name, oldValue, value);
				propertyChanges.add(pch);
			}
		}
		
		if (context.isUIThread()) {
			firePropertiesChanged(propertyChanges);
		} else {
			Message msg = getUIHandler().obtainMessage(MSG_MODEL_PROPERTIES_CHANGED, propertyChanges);
			msg.sendToTarget();
		}
	}
	
	protected void firePropertiesChanged(List<KrollPropertyChange> changes) {
		if (modelListener != null) {
			modelListener.propertiesChanged(changes, this);
		}
	}
	
	public boolean hasBoundMethod(String methodName) {
		if (bindings.containsKey(methodName)) {
			return bindings.get(methodName) instanceof Function;
		}
		return false;
	}
	
	public boolean hasBoundProperty(String propertyName) {
		if (bindings.containsKey(propertyName)) {
			Object property = bindings.get(propertyName);
			if (property instanceof KrollProperty) {
				return true;
			}
		}
		return false;
	}
	
	public void bindMethod(String name, Function method) {
		bindValue(name, method);
	}
	
	public void bindProperty(String name, KrollProperty property) {
		bindValue(name, property);
	}
	
	public void bindValue(String name, Object value) {
		bindings.put(name, value);
	}

	public KrollMethod getBoundMethod(String name) {
		return (KrollMethod) getBoundValue(name);
	}
	
	public KrollProperty getBoundProperty(String name) {
		return (KrollProperty) getBoundValue(name);
	}
	
	public Object getBoundValue(String name) {
		return bindings.get(name);
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
			}
		}
	}
	
	public KrollDict getCreationDict() {
		return creationDict;
	}

	// Handler.Callback
	public boolean handleMessage(Message msg) {
		switch (msg.what) {
		case MSG_MODEL_PROPERTY_CHANGE: {
			KrollPropertyChange pch = (KrollPropertyChange) msg.obj;
			pch.fireEvent(this, modelListener);
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
		case MSG_MODEL_PROPERTIES_CHANGED: {
			firePropertiesChanged((List<KrollPropertyChange>)msg.obj);
			return true;
		}
		}
		return false;
	}

	public void setModelListener(KrollProxyListener modelListener) {
		this.modelListener = modelListener;
		if (modelListener != null) {
			modelListener.processProperties(properties);
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
	
	public void switchToCreatingContext() {
		if (creatingContext != null && context != null && !creatingContext.equals(context)) {
			switchContext(creatingContext);
		}
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
		listenerId = eventManager.addEventListener(eventName, listener);
		
		return listenerId;
	}

	@Kroll.method
	public void removeEventListener(String eventName, Object listener) {
		eventManager.removeEventListener(eventName, listener);
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
		return eventManager.dispatchEvent(eventName, data);
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
		return eventManager.hasAnyEventListener(eventName);
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
