/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.runtime.v8.EventEmitter;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUrl;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;

@Kroll.proxy(name="KrollProxy")
public class KrollProxy extends EventEmitter
	implements Handler.Callback
{
	private static final String TAG = "KrollProxy";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int INDEX_NAME = 0;
	private static final int INDEX_OLD_VALUE = 1;
	private static final int INDEX_VALUE = 2;

	protected static final int MSG_MODEL_PROPERTY_CHANGE = EventEmitter.MSG_LAST_ID + 100;
	protected static final int MSG_LISTENER_ADDED = EventEmitter.MSG_LAST_ID + 101;
	protected static final int MSG_LISTENER_REMOVED = EventEmitter.MSG_LAST_ID + 102;
	protected static final int MSG_MODEL_PROPERTIES_CHANGED = EventEmitter.MSG_LAST_ID + 103;
	protected static final int MSG_LAST_ID = EventEmitter.MSG_LAST_ID + 999;
	protected static AtomicInteger proxyCounter = new AtomicInteger();

	public static final String PROXY_ID_PREFIX = "proxy$";

	protected Activity activity;
	protected String proxyId;
	protected TiUrl creationUrl;
	protected KrollProxyListener modelListener;
	protected KrollModule createdInModule;
	protected boolean coverageEnabled;
	protected KrollDict properties = new KrollDict();

	public KrollProxy()
	{
		this.creationUrl = new TiUrl("");
	}

	// entry point for generator code
	public static KrollProxy create(Class<? extends KrollProxy> objClass, Object[] creationArguments, long ptr, String creationUrl)
	{
		try {
			KrollProxy proxyInstance = objClass.newInstance();

			/* store reference to the native object that represents this proxy so we can drive changes to the JS 
			 * object
			 */
			proxyInstance.setPointer(ptr);
			proxyInstance.creationUrl = new TiUrl(creationUrl);

			/* associate the activity with the proxy.  if the proxy needs activity association delayed until a 
			 * later point then initActivity should be overridden to be a no-op and then call setActivity directly
			 * at the appropriate time
			 */
			proxyInstance.initActivity(TiApplication.getInstance().getCurrentActivity());

			// setup the proxy according to the creation arguments TODO - pass in createdInModule
			proxyInstance.handleCreationArgs(null, creationArguments);

			return proxyInstance;

		} catch (IllegalAccessException e) {
			Log.e(TAG, "Error creating proxy: " + e.getMessage(), e);
		} catch (InstantiationException e) {
			Log.e(TAG, "Error creating proxy: " + e.getMessage(), e);
		}

		return null;
	}

	protected void initActivity(Activity activity)
	{
		this.activity = activity;
	}

	/**
	 * Handle the arguments passed into the "create" method for this proxy.
	 * If your proxy simply needs to handle a KrollDict, see {@link KrollProxy#handleCreationDict(KrollDict)}
	 * @param args
	 */
	public void handleCreationArgs(KrollModule createdInModule, Object[] args)
	{
		this.createdInModule = createdInModule;

		if (args.length >= 1 && args[0] instanceof HashMap) {
			if (args[0] instanceof KrollDict) {
				handleCreationDict((KrollDict)args[0]);
			} else {
				handleCreationDict(new KrollDict((HashMap)args[0]));
			}
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
			// TODO we need to set properties inside the proxy from the creation dict on the V8 side
			/*for (String key : dict.keySet()) {
				setProperty(key, dict.get(key), true);
			}*/
			properties.putAll(dict);
			if (modelListener != null) {
				modelListener.processProperties(properties);
			}
		}
	}

	public void setActivity(Activity activity)
	{
		this.activity = activity;
	}

	public Activity getActivity()
	{
		return activity;
	}

	public TiUrl getCreationUrl()
	{
		return creationUrl;
	}

	public boolean hasProperty(String name)
	{
		return properties.containsKey(name);
	}

	/**
	 * Properties are cached on the Proxy and updated from JS for relevant annotated APIs
	 */
	public Object getProperty(String name)
	{
		return properties.get(name);
	}

	/**
	 * This internally sets the named property as well as updating the actual JS object
	 */
	public void setProperty(String name, Object value)
	{
		properties.put(name, value);
		forceSet(name, value);
	}

	/**
	 * @deprecated use setPropertyAndFire instead
	 */
	@Deprecated
	public void setProperty(String name, Object value, boolean fireChange)
	{
		if (!fireChange) {
			setProperty(name, value);
		} else {
			setPropertyAndFire(name, value);
		}
	}

	public void firePropertyChanged(String name, Object oldValue, Object newValue)
	{
		if (modelListener != null) {
			if (TiApplication.isUIThread()) {
				modelListener.propertyChanged(name, oldValue, newValue, this);
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

	public void setPropertyAndFire(String name, Object value)
	{
		Object current = getProperty(name);
		setProperty(name, value);

		if (shouldFireChange(current, value)) {
			firePropertyChanged(name, current, value);
		}
	}

	@Kroll.method
	public void onPropertyChanged(String name, Object oldValue, Object value)
	{
		properties.put(name, value);
		firePropertyChanged(name, oldValue, value);
	}

	public void onPropertiesChanged(Object[][] changes)
	{
		int changesLength = changes.length;
		boolean isUiThread = TiApplication.isUIThread();

		for (int i = 0; i < changesLength; ++i) {
			Object[] change = changes[i];
			if (change.length != 3) continue;

			Object name = change[INDEX_NAME];
			if (name == null || !(name instanceof String)) continue;

			String nameString = (String) name;
			Object value = change[INDEX_VALUE];

			properties.put(nameString, change[INDEX_VALUE]);
			if (isUiThread && modelListener != null) {
				modelListener.propertyChanged(nameString,
					change[INDEX_OLD_VALUE], value, this);
			}
		}

		if (isUiThread || modelListener == null) return;

		Message msg = getUIHandler().obtainMessage(MSG_MODEL_PROPERTIES_CHANGED, changes);
		msg.sendToTarget();
	}

	private void firePropertiesChanged(Object[][] changes)
	{
		if (modelListener == null) return;

		int changesLength = changes.length;
		for (int i = 0; i < changesLength; ++i) {
			Object[] change = changes[i];
			if (change.length != 3) continue;

			Object name = change[INDEX_NAME];
			if (name == null || !(name instanceof String)) continue;

			if (modelListener != null) {
				modelListener.propertyChanged((String) name,
					change[INDEX_OLD_VALUE], change[INDEX_VALUE], this);
			}
		}
	}

	public KrollDict getProperties()
	{
		return properties;
	}

	public KrollModule getCreatedInModule()
	{
		return createdInModule;
	}

	@Override @SuppressWarnings("unchecked")
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_MODEL_PROPERTY_CHANGE: {
				KrollPropertyChange pch = (KrollPropertyChange) msg.obj;
				pch.fireEvent(this, modelListener);
				return true;
			}
			case MSG_LISTENER_ADDED:
			case MSG_LISTENER_REMOVED: {
				if (modelListener == null) return true;

				String event = msg.getData().getString(EventEmitter.PROPERTY_TYPE);
				HashMap<String, Object> map = (HashMap<String, Object>) msg.obj;
				int count = TiConvert.toInt(map.get(TiC.PROPERTY_COUNT));
				if (msg.what == MSG_LISTENER_ADDED) {
					eventListenerAdded(event, count, this);
				} else {
					eventListenerRemoved(event, count, this);
				}
				return true;
			}
			case MSG_MODEL_PROPERTIES_CHANGED: {
				firePropertiesChanged((Object[][])msg.obj);
				return true;
			}
		}
		return super.handleMessage(msg);
	}

	protected void eventListenerAdded(String event, int count, KrollProxy proxy)
	{
		modelListener.listenerAdded(event, count, this);
	}

	protected void eventListenerRemoved(String event, int count, KrollProxy proxy)
	{
		modelListener.listenerRemoved(event, count, this);
	}

	public void setModelListener(KrollProxyListener modelListener)
	{
		// Double-setting the same modelListener can potentially have weird side-effects.
		if (this.modelListener != null && this.modelListener.equals(modelListener)) { return; }

		this.modelListener = modelListener;
		if (modelListener != null) {
			modelListener.processProperties(properties);
		}
	}

	public String resolveUrl(String scheme, String path)
	{
		return TiUrl.resolve(creationUrl.baseUrl, path, scheme);
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

	public String getProxyId()
	{
		return proxyId;
	}

	protected KrollDict createErrorResponse(int code, String message)
	{
		KrollDict error = new KrollDict();
		error.put(TiC.ERROR_PROPERTY_CODE, code);
		error.put(TiC.ERROR_PROPERTY_MESSAGE, message);

		return error;
	}

	public Object getDefaultValue(Class<?> typeHint)
	{
		return toString();
	}
}
