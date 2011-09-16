/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.runtime.v8.V8Object;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;

@Kroll.proxy
public class KrollProxy
	implements Handler.Callback, OnEventListenerChange, KrollConvertable
{
	private static final String TAG = "KrollProxy";
	private static final boolean DBG = TiConfig.LOGD;

	protected static final int MSG_MODEL_PROPERTY_CHANGE = 100;
	protected static final int MSG_LISTENER_ADDED = 101;
	protected static final int MSG_LISTENER_REMOVED = 102;
	protected static final int MSG_MODEL_PROPERTIES_CHANGED = 103;
	protected static final int MSG_LAST_ID = 999;
	protected static AtomicInteger proxyCounter = new AtomicInteger();

	public static final String PROXY_ID_PREFIX = "proxy$";

	protected TiContext context, creatingContext;

	protected Handler uiHandler;
	protected String proxyId;
	protected KrollProxyListener modelListener;
	protected KrollEventManager eventManager;
	protected KrollModule createdInModule;
	protected V8Object v8Object;
	protected boolean coverageEnabled;
	protected KrollDict creationDict = null;

	@Kroll.inject
	protected KrollInvocation currentInvocation;

	public KrollProxy(TiContext context)
	{
		this(context, true);
	}

	public KrollProxy(TiContext context, boolean autoBind)
	{
		this.context = context;
		this.eventManager = new KrollEventManager(this);
		if (DBG) {
			Log.d(TAG, "New: " + getClass().getSimpleName());
		}
		this.proxyId = PROXY_ID_PREFIX + proxyCounter.incrementAndGet();
		coverageEnabled = context.getTiApp().isCoverageEnabled();

		uiHandler = new Handler(Looper.getMainLooper(), this);
		if (!context.isUIThread()) {
			Activity activity = context.getActivity();
			if ((activity == null || activity.isFinishing()) && !context.isServiceContext()) {
				if (DBG) {
					Log.w(TAG, "Proxy created in context with no activity and no service.  Activity finished?  Context is effectively dead.");
				}
				return;
			}
		}
	}

	// direct accessors (these circumvent programmatic accessors and go straight to the internal map)
	public V8Object getV8Object()
	{
		return v8Object;
	}

	protected long getV8ObjectPointer()
	{
		return v8Object.getPointer();
	}

	public boolean hasProperty(String name)
	{
		return v8Object.has(name);
	}

	public Object getProperty(String name)
	{
		return v8Object.get(name);
	}

	public void setProperty(String name, Object value)
	{
		setProperty(name, value, false);
	}

	protected void firePropertyChanged(String name, Object oldValue, Object newValue)
	{
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

	protected boolean shouldFireChange(Object oldValue, Object newValue)
	{
		if (!(oldValue == null && newValue == null)) {
			if ((oldValue == null && newValue != null)
					|| (newValue == null && oldValue != null)
					|| (!oldValue.equals(newValue))) {
				return true;
			}
		}
		return false;
	}

	public void setProperty(String name, Object value, boolean fireChange)
	{
		if (!fireChange) {
			v8Object.set(name, value);
			return;
		} else {
			Object current = v8Object.get(name);
			v8Object.set(name, value);

			if (shouldFireChange(current, value)) {
				firePropertyChanged(name, current, value);
			}
		}
	}

	protected void firePropertiesChanged(List<KrollPropertyChange> changes)
	{
		if (modelListener != null) {
			modelListener.propertiesChanged(changes, this);
		}
	}

	/**
	 * Handle the arguments passed into the "create" method for this proxy.
	 * If your proxy simply needs to handle a KrollDict, see {@link KrollProxy#handleCreationDict(KrollDict)}
	 * @param args
	 */
	public void handleCreationArgs(KrollModule createdInModule, Object[] args)
	{
		this.createdInModule = createdInModule;
		if (args.length >= 1 && args[0] instanceof KrollDict) {
			handleCreationDict((KrollDict)args[0]);
		}
	}

	/**
	 * Handle the creation {@link KrollDict} passed into the create method for this proxy.
	 * This is usually the first (and sometimes only) argument to the proxy's create method.
	 * @param dict
	 */
	public void handleCreationDict(KrollDict dict)
	{
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

	public KrollDict getCreationDict()
	{
		return creationDict;
	}

	public KrollModule getCreatedInModule()
	{
		return createdInModule;
	}

	@SuppressWarnings("unchecked")
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_MODEL_PROPERTY_CHANGE: {
				KrollPropertyChange pch = (KrollPropertyChange) msg.obj;
				pch.fireEvent(this, modelListener);
				return true;
			}
			case MSG_LISTENER_ADDED: {
				if (modelListener != null) {
					modelListener.listenerAdded(
						msg.getData().getString(TiC.MSG_PROPERTY_EVENT_NAME),
						msg.arg1, (KrollProxy) msg.obj);
				}
				return true;
			}
			case MSG_LISTENER_REMOVED: {
				if (modelListener != null) {
					modelListener.listenerRemoved(msg.getData().getString(
						TiC.MSG_PROPERTY_EVENT_NAME), msg.arg1, (KrollProxy) msg.obj);
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

	public void setModelListener(KrollProxyListener modelListener)
	{
		// Double-setting the same modelListener can potentially have weird side-effects.
		if (this.modelListener != null && this.modelListener.equals(modelListener)) { return; }
		this.modelListener = modelListener;
		if (modelListener != null) {
			modelListener.processProperties(creationDict);
			creationDict = null;
		}
	}

	public TiContext switchContext(TiContext tiContext)
	{
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

	public void switchToCreatingContext()
	{
		if (creatingContext != null && context != null && !creatingContext.equals(context)) {
			switchContext(creatingContext);
		}
	}

	public Handler getUIHandler()
	{
		return uiHandler;
	}

	public Object sendBlockingUiMessage(int what, Object asyncArg)
	{
		AsyncResult result = new AsyncResult(asyncArg);
		return sendBlockingUiMessage(
			getUIHandler().obtainMessage(what, result), result);
	}
	
	public Object sendBlockingUiMessage(int what, int arg1)
	{
		AsyncResult result = new AsyncResult(null);
		return sendBlockingUiMessage(
			getUIHandler().obtainMessage(what, arg1, -1), result);		
	}

	public Object sendBlockingUiMessage(int what, Object asyncArg, int arg1, int arg2)
	{
		AsyncResult result = new AsyncResult(asyncArg);
		return sendBlockingUiMessage(
			getUIHandler().obtainMessage(what, arg1, arg2, result), result);
	}

	public Object sendBlockingUiMessage(Message msg, AsyncResult result)
	{
		return TiMessageQueue.getMessageQueue().sendBlockingMessage(
			msg, TiMessageQueue.getMainMessageQueue(), result);
	}

	public TiContext getTiContext()
	{
		return context;
	}

	public String getProxyId()
	{
		return proxyId;
	}

	// Events

	@Kroll.method
	public int addEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		int listenerId = -1;
		if (DBG) {
			Log.i(TAG, "Adding listener for \"" + eventName + "\": "
					+ listener.getClass().getName());
		}
		listenerId = eventManager.addEventListener(eventName, listener);
		return listenerId;
	}

	@Kroll.method
	public void removeEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		eventManager.removeEventListener(eventName, listener);
	}

	public void eventListenerAdded(String eventName, int count, KrollProxy proxy)
	{
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_ADDED, count,
				-1, proxy);
			m.getData().putString(TiC.MSG_PROPERTY_EVENT_NAME, eventName);
			m.sendToTarget();
		}
	}

	public void eventListenerRemoved(String eventName, int count, KrollProxy proxy)
	{
		if (modelListener != null) {
			Message m = getUIHandler().obtainMessage(MSG_LISTENER_REMOVED,
					count, -1, proxy);
			m.getData().putString(TiC.MSG_PROPERTY_EVENT_NAME, eventName);
			m.sendToTarget();
		}
	}

	@Kroll.method
	public boolean fireEvent(String eventName, @Kroll.argument(optional=true) KrollDict data)
	{
		return eventManager.dispatchEvent(eventName, data);
	}

	@Kroll.method
	public boolean fireSyncEvent(String eventName, @Kroll.argument(optional=true) KrollDict data)
	{
		return eventManager.dispatchEvent(eventName, data, false);
	}

	@Kroll.method
	public void fireSingleEvent(String eventName, Object listener, KrollDict data, boolean asyncCallback)
	{
		if (listener != null) {
			KrollInvocation invocation = currentInvocation == null ?
				createEventInvocation(eventName) : currentInvocation;
			KrollMethod method = (KrollMethod) listener;
			if (data == null) {
				data = new KrollDict();
			}
			try {
				if (method instanceof KrollCallback && !asyncCallback) {
					((KrollCallback)method).callSync(data);
				} else {
					method.invoke(invocation, new Object[] { data });
				}
			} catch (Exception e) {
				Log.e(TAG, e.getMessage(), e);
			}
			invocation.recycle();
		}
	}

	public boolean hasListeners(String eventName)
	{
		return eventManager.hasAnyEventListener(eventName);
	}

	protected KrollDict createErrorResponse(int code, String message)
	{
		KrollDict error = new KrollDict();
		error.put(TiC.ERROR_PROPERTY_CODE, code);
		error.put(TiC.ERROR_PROPERTY_MESSAGE, message);

		return error;
	}

	public KrollInvocation getCurrentInvocation()
	{
		return currentInvocation;
	}

	@Kroll.method
	public String toString()
	{
		return "[Ti." + getAPIName() + "]";
	}

	public Object getDefaultValue(Class<?> typeHint)
	{
		return toString();
	}

	public Object getJavascriptValue()
	{
		return v8Object;
	}

	public Object getNativeValue()
	{
		return this;
	}
}
