/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.util.TiUrl;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;


@Kroll.proxy(name="KrollProxy")
public class KrollProxy implements Handler.Callback, KrollProxySupport
{
	private static final String TAG = "KrollProxy";
	private static final int INDEX_NAME = 0;
	private static final int INDEX_OLD_VALUE = 1;
	private static final int INDEX_VALUE = 2;

	protected static final int MSG_MODEL_PROPERTY_CHANGE = KrollObject.MSG_LAST_ID + 100;
	protected static final int MSG_LISTENER_ADDED = KrollObject.MSG_LAST_ID + 101;
	protected static final int MSG_LISTENER_REMOVED = KrollObject.MSG_LAST_ID + 102;
	protected static final int MSG_MODEL_PROCESS_PROPERTIES = KrollObject.MSG_LAST_ID + 103;
	protected static final int MSG_MODEL_PROPERTIES_CHANGED = KrollObject.MSG_LAST_ID + 104;
	protected static final int MSG_INIT_KROLL_OBJECT = KrollObject.MSG_LAST_ID + 105;
	protected static final int MSG_SET_PROPERTY = KrollObject.MSG_LAST_ID + 106;
	protected static final int MSG_FIRE_EVENT = KrollObject.MSG_LAST_ID + 107;
	protected static final int MSG_FIRE_SYNC_EVENT = KrollObject.MSG_LAST_ID + 108;
	protected static final int MSG_LAST_ID = MSG_FIRE_SYNC_EVENT;
	protected static final String PROPERTY_NAME = "name";

	protected static AtomicInteger proxyCounter = new AtomicInteger();

	protected KrollObject krollObject;
	protected WeakReference<Activity> activity;
	protected String proxyId;
	protected TiUrl creationUrl;
	protected KrollProxyListener modelListener;
	protected KrollModule createdInModule;
	protected boolean coverageEnabled;
	protected KrollDict properties = new KrollDict();
	protected KrollDict defaultValues = new KrollDict();
	protected Handler mainHandler = null;
	protected Handler runtimeHandler = null;

	public static final String PROXY_ID_PREFIX = "proxy$";


	public KrollProxy()
	{
		this("");
	}

	public KrollProxy(String baseCreationUrl)
	{
		creationUrl = new TiUrl(baseCreationUrl);
	}

	// entry point for generator code
	public static KrollProxy createProxy(Class<? extends KrollProxy> proxyClass, KrollObject object, Object[] creationArguments, String creationUrl)
	{
		try {
			KrollProxy proxyInstance = proxyClass.newInstance();

			// Store reference to the native object that represents this proxy so we can drive changes to the JS 
			// object
			proxyInstance.krollObject = object;
			object.setProxySupport(proxyInstance);
			proxyInstance.creationUrl = TiUrl.createProxyUrl(creationUrl);

			// Associate the activity with the proxy.  if the proxy needs activity association delayed until a 
			// later point then initActivity should be overridden to be a no-op and then call setActivity directly
			// at the appropriate time
			proxyInstance.initActivity(TiApplication.getInstance().getCurrentActivity());

			// Setup the proxy according to the creation arguments TODO - pass in createdInModule
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
		this.activity = new WeakReference<Activity>(activity);
	}

	public void setActivity(Activity activity)
	{
		this.activity = new WeakReference<Activity>(activity);
	}

	public Activity getActivity()
	{
		if (activity == null) {
			return null;
		}
		return activity.get();
	}

	/**
	 * Handle the arguments passed into the "create" method for this proxy.
	 * If your proxy simply needs to handle a KrollDict, see {@link KrollProxy#handleCreationDict(KrollDict)}
	 * @param args
	 */
	public void handleCreationArgs(KrollModule createdInModule, Object[] args)
	{
		this.createdInModule = createdInModule;

		if (args.length == 0 || !(args[0] instanceof HashMap)) {
			handleDefaultValues();
			return;
		}

		KrollDict dict;
		if (args[0] instanceof KrollDict) {
			dict = (KrollDict) args[0];
		} else {
			dict = new KrollDict((HashMap) args[0]);
		}
		handleCreationDict(dict);
	}

	/**
	 * Handles initialization of the proxy's default property values
	 */
	protected void handleDefaultValues()
	{
		for (String key : defaultValues.keySet()) {
			if (!properties.containsKey(key)) {
				setProperty(key, defaultValues.get(key));
			}
		}
	}

	/**
	 * Handle the creation {@link KrollDict} passed into the create method for this proxy.
	 * This is usually the first (and sometimes only) argument to the proxy's create method.
	 * 
	 * To set default property values, add them to the {@link KrollProxy#defaultValues map}
	 * @param dict
	 */
	public void handleCreationDict(KrollDict dict)
	{
		if (dict == null) {
			return;
		}

		properties.putAll(dict);
		handleDefaultValues();

		if (modelListener != null) {
			modelListener.processProperties(properties);
		}
	}

	public Handler getMainHandler()
	{
		if (mainHandler == null) {
			mainHandler = new Handler(TiMessenger.getMainMessenger().getLooper(), this);
		}

		return mainHandler;
	}

	public Handler getRuntimeHandler()
	{
		if (runtimeHandler == null) {
			runtimeHandler = new Handler(TiMessenger.getRuntimeMessenger().getLooper(), this);
		}

		return runtimeHandler;
	}

	public void setKrollObject(KrollObject object)
	{
		this.krollObject = object;
	}

	public KrollObject getKrollObject()
	{
		if (krollObject == null) {
			if (KrollRuntime.getInstance().isRuntimeThread()) {
				initKrollObject();

			} else {
				TiMessenger.sendBlockingRuntimeMessage(getRuntimeHandler().obtainMessage(MSG_INIT_KROLL_OBJECT));
			}
		}

		return krollObject;
	}

	public void initKrollObject()
	{
		KrollRuntime.getInstance().initObject(this);
	}

	public TiUrl getCreationUrl()
	{
		return creationUrl;
	}
	
	@Kroll.method
	public void setCreationUrl(String url)
	{
		creationUrl = TiUrl.createProxyUrl(url);
	}

	// native extending support allows us to whole-sale apply properties and only fire one event / job
	@Kroll.method
	public void extend(KrollDict options)
	{
		ArrayList<KrollPropertyChange> propertyChanges = new ArrayList<KrollPropertyChange>();
		for (String name : options.keySet()) {
			Object oldValue = properties.get(name);
			Object value = options.get(name);

			// dont just fire the change event, make sure we set the property back on the KrollObject 
			// since the property change may not be driven from JS (KrollObject->Java proxy)
			setProperty(name, value);

			if (shouldFireChange(oldValue, value)) {
				KrollPropertyChange pch = new KrollPropertyChange(name, oldValue, value);
				propertyChanges.add(pch);
			}
		}

		// convert to two dimensional array
		int changeSize = propertyChanges.size();
		Object[][] changeArray = new Object[changeSize][];
		for (int i = 0; i < changeSize; i++) {
			KrollPropertyChange propertyChange = propertyChanges.get(i);
			changeArray[i] = new Object[] {propertyChange.name, propertyChange.oldValue, propertyChange.newValue};
		}

		if (KrollRuntime.getInstance().isRuntimeThread()) {
			firePropertiesChanged(changeArray);

		} else {
			Message message = getMainHandler().obtainMessage(MSG_MODEL_PROPERTIES_CHANGED, changeArray);
			message.sendToTarget();
		}
	}

	private void firePropertiesChanged(Object[][] changes)
	{
		if (modelListener == null) {
			return;
		}

		int changesLength = changes.length;
		for (int i = 0; i < changesLength; ++i) {
			Object[] change = changes[i];
			if (change.length != 3) {
				continue;
			}

			Object name = change[INDEX_NAME];
			if (name == null || !(name instanceof String)) {
				continue;
			}

			if (modelListener != null) {
				modelListener.propertyChanged((String) name, change[INDEX_OLD_VALUE], change[INDEX_VALUE], this);
			}
		}
	}

	public Object getIndexedProperty(int index)
	{
		// TODO(josh): return undefined value
		return 0;
	}

	public void setIndexedProperty(int index, Object value)
	{
		// no-op
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

	/**
	 * This internally sets the named property as well as updating the actual JS object
	 */
	public void setProperty(String name, Object value)
	{
		properties.put(name, value);

		if (KrollRuntime.getInstance().isRuntimeThread()) {
			doSetProperty(name, value);

		} else {
			Message message = getRuntimeHandler().obtainMessage(MSG_SET_PROPERTY, value);
			message.getData().putString(PROPERTY_NAME, name);
			message.sendToTarget();
		}
	}

	protected void doSetProperty(String name, Object value)
	{
		getKrollObject().setProperty(name, value);
	}

	public boolean fireEvent(String event, Object data)
	{
		Message message = getRuntimeHandler().obtainMessage(MSG_FIRE_EVENT, data);
		message.getData().putString(PROPERTY_NAME, event);
		message.sendToTarget();

		return hasListeners(event);
	}

	public boolean fireSyncEvent(String event, Object data)
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			return doFireEvent(event, data);

		} else {
			Message message = getRuntimeHandler().obtainMessage(MSG_FIRE_SYNC_EVENT);
			message.getData().putString(PROPERTY_NAME, event);

			return (Boolean) TiMessenger.sendBlockingRuntimeMessage(message, data);
		}
	}

	public boolean doFireEvent(String event, Object data)
	{
		if (data == null) {
			data = new KrollDict();
		}

		if (data instanceof HashMap) {
			HashMap<String, Object> dict = (HashMap) data;

			Object source = dict.get(TiC.EVENT_PROPERTY_SOURCE);
			if (source == null) {
				dict.put(TiC.EVENT_PROPERTY_SOURCE, this);
			}
		}

		return getKrollObject().fireEvent(event, data);
	}

	public void firePropertyChanged(String name, Object oldValue, Object newValue)
	{
		if (modelListener != null) {
			if (TiApplication.isUIThread()) {
				modelListener.propertyChanged(name, oldValue, newValue, this);

			} else {
				KrollPropertyChange pch = new KrollPropertyChange(name, oldValue, newValue);
				getMainHandler().obtainMessage(MSG_MODEL_PROPERTY_CHANGE, pch).sendToTarget();
			}
		}
	}

	public void onHasListenersChanged(String event, boolean hasListeners)
	{
		Message msg = getMainHandler().obtainMessage(hasListeners ? MSG_LISTENER_ADDED : MSG_LISTENER_REMOVED);
		msg.obj = event;
		TiMessenger.getMainMessenger().sendMessage(msg);
	}

	public boolean hasListeners(String event)
	{
		return getKrollObject().hasListeners(event);
	}

	protected boolean shouldFireChange(Object oldValue, Object newValue)
	{
		if (!(oldValue == null && newValue == null)) {
			if ((oldValue == null && newValue != null) || (newValue == null && oldValue != null) || (!oldValue.equals(newValue))) {
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

	public void onPropertyChanged(String name, Object value)
	{
		Object oldValue = properties.get(name);
		properties.put(name, value);
		firePropertyChanged(name, oldValue, value);
	}

	public void onPropertiesChanged(Object[][] changes)
	{
		int changesLength = changes.length;
		boolean isUiThread = TiApplication.isUIThread();

		for (int i = 0; i < changesLength; ++i) {
			Object[] change = changes[i];
			if (change.length != 3) {
				continue;
			}

			Object name = change[INDEX_NAME];
			if (name == null || !(name instanceof String)) {
				continue;
			}

			String nameString = (String) name;
			Object value = change[INDEX_VALUE];

			properties.put(nameString, change[INDEX_VALUE]);
			if (isUiThread && modelListener != null) {
				modelListener.propertyChanged(nameString, change[INDEX_OLD_VALUE], value, this);
			}
		}

		if (isUiThread || modelListener == null) {
			return;
		}

		Message message = getMainHandler().obtainMessage(MSG_MODEL_PROPERTIES_CHANGED, changes);
		message.sendToTarget();
	}

	public ActivityProxy getActivityProxy()
	{
		Activity activity = getActivity();
		if (activity instanceof TiBaseActivity) {
			return ((TiBaseActivity) activity).getActivityProxy();
		}

		return null;
	}

	public KrollDict getProperties()
	{
		return properties;
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
				((KrollPropertyChange) msg.obj).fireEvent(this, modelListener);

				return true;
			}
			case MSG_LISTENER_ADDED:
			case MSG_LISTENER_REMOVED: {
				if (modelListener == null) {
					return true;
				}

				String event = (String) msg.obj;

				if (msg.what == MSG_LISTENER_ADDED) {
					eventListenerAdded(event, 1, this);

				} else {
					eventListenerRemoved(event, 0, this);
				}

				return true;
			}
			case MSG_MODEL_PROCESS_PROPERTIES: {
				if (modelListener != null) {
					modelListener.processProperties(properties);
				}
				return true;
			}
			case MSG_MODEL_PROPERTIES_CHANGED: {
				firePropertiesChanged((Object[][])msg.obj);

				return true;
			}
			case MSG_INIT_KROLL_OBJECT: {
				initKrollObject();
				((AsyncResult) msg.obj).setResult(null);

				return true;
			}
			case MSG_SET_PROPERTY: {
				Object value = msg.obj;
				String property = msg.getData().getString(PROPERTY_NAME);
				doSetProperty(property, value);

				return true;
			}
			case MSG_FIRE_EVENT: {
				Object data = msg.obj;
				String event = msg.getData().getString(PROPERTY_NAME);
				doFireEvent(event, data);

				return true;
			}
			case MSG_FIRE_SYNC_EVENT: {
				AsyncResult asyncResult = (AsyncResult) msg.obj;
				boolean handled = doFireEvent(msg.getData().getString(PROPERTY_NAME), asyncResult.getArg());
				asyncResult.setResult(handled);

				return handled;
			}
		}

		return false;
	}

	// TODO: count should be removed since we no longer report it.
	//       These methods only gets called now when the first listener
	//       is added or the last one has been removed.
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
		if (this.modelListener != null && this.modelListener.equals(modelListener)) {
			return;
		}

		this.modelListener = modelListener;
		if (modelListener != null) {
			if (TiApplication.isUIThread()) {
				modelListener.processProperties(properties);
			} else {
				getMainHandler().sendEmptyMessage(MSG_MODEL_PROCESS_PROPERTIES);
			}
		}
	}

	public String resolveUrl(String scheme, String path)
	{
		return TiUrl.resolve(creationUrl.baseUrl, path, scheme);
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

	public void release()
	{
		if (krollObject != null) {
			krollObject.release();
		}
	}

	// TODO RM_TICONTEXT
	@Deprecated
	public TiContext getTiContext()
	{
		return new TiContext(getActivity(), proxyId);
	}

	// TODO RM_TICONTEXT
	@Deprecated
	public Object sendBlockingUiMessage(int what, Object asyncArg)
	{
		return sendBlockingUiMessage(getMainHandler().obtainMessage(what), new AsyncResult(asyncArg));
	}

	// TODO RM_TICONTEXT
	@Deprecated
	public Object sendBlockingUiMessage(int what, int arg1)
	{
		return sendBlockingUiMessage(getMainHandler().obtainMessage(what, arg1), new AsyncResult());
	}

	// TODO RM_TICONTEXT
	@Deprecated
	public Object sendBlockingUiMessage(int what, Object asyncArg, int arg1, int arg2)
	{
		return sendBlockingUiMessage(getMainHandler().obtainMessage(what, arg1, arg2), new AsyncResult(asyncArg));
	}

	// TODO RM_TICONTEXT
	@Deprecated
	public Object sendBlockingUiMessage(Message message, AsyncResult asyncResult)
	{
		// If current thread is the UI thread, dispatch message directly.
		if (TiApplication.isUIThread()) {
			handleMessage(message);

			return asyncResult.getResultUnsafe();
		}

		return TiMessenger.sendBlockingMainMessage(message, asyncResult.getArg());
	}
}

