/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

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
	protected static HashMap<Class<? extends KrollProxy>, KrollProxyBinding> proxyBindings = new HashMap<Class<? extends KrollProxy>, KrollProxyBinding>();

	public static final String PROXY_ID_PREFIX = "proxy$";
	public static final String BINDING_SUFFIX = "BindingGen";
	public static final Object UNDEFINED = new Object() {
		public String toString() {
			return "undefined";
		}
	};

	protected KrollDict properties = new KrollDict();
	protected TiContext context, creatingContext;

	protected Handler uiHandler;
	protected String proxyId;
	protected KrollProxyListener modelListener;
	protected KrollEventManager eventManager;
	protected KrollModule createdInModule;
	protected KrollProxyBinding binding;
	protected KrollObject krollObject;

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

	public static KrollProxyBinding getBinding(Class<? extends KrollProxy> proxyClass)
	{
		if (!proxyBindings.containsKey(proxyClass)) {
			String bindingClassName = proxyClass.getName() + BINDING_SUFFIX;
			try {
				Class<?> bindingClass = Class.forName(bindingClassName);
				KrollProxyBinding bindingInstance = (KrollProxyBinding) bindingClass.newInstance();
				proxyBindings.put(proxyClass, bindingInstance);
				return bindingInstance;
			} catch (ClassNotFoundException e) {
				Log.e(TAG, "Couldn't find binding class for proxy " + proxyClass.getName(), e);
			} catch (IllegalAccessException e) {
				Log.e(TAG, "Couldn't access constructor for binding class " + bindingClassName, e);
			} catch (InstantiationException e) {
				Log.e(TAG, "Couldn't insantiate binding class " + bindingClassName, e);
			}
		}
		return proxyBindings.get(proxyClass);
	}

	public KrollProxyBinding getBinding()
	{
		if (binding == null) {
			binding = getBinding(getClass());
		}
		return binding;
	}

	public boolean hasBinding(String name)
	{
		return getBinding().hasBinding(name);
	}

	public Object getBinding(String name)
	{
		return getBinding().getBinding(name);
	}

	public void bindContextSpecific(KrollBridge bridge)
	{
		KrollProxyBinding binding = getBinding();
		binding.bindContextSpecific(bridge, this);
	}

	public String getAPIName()
	{
		return getBinding().getAPIName();
	}

	public String getShortAPIName()
	{
		return getBinding().getShortAPIName();
	}

	public KrollObject getKrollObject()
	{
		if (krollObject == null) {
			krollObject = new KrollObject(this);
		}
		return krollObject;
	}

	public boolean has(Scriptable scope, String name)
	{
		return hasBinding(name) || properties.containsKey(name);
	}

	public boolean has(Scriptable scope, int index)
	{
		return false;
	}

	public Object get(Scriptable scope, String name)
		throws NoSuchFieldException
	{
		if (hasBinding(name)) {
			Object value = getBinding(name);
			if (value instanceof KrollProperty) {
				KrollProperty property = (KrollProperty)value;
				if (property.supportsGet(name)) {
					return getDynamicProperty(scope, name, property);
				} // else fall through to properties
			} else {
				return value;
			}
		}

		if (properties.containsKey(name)) {
			return properties.get(name);
		}
		return UNDEFINED;
	}

	public Object get(Scriptable scope, int index)
	{
		return UNDEFINED;
	}

	public void set(Scriptable scope, String name, Object value)
		throws NoSuchFieldException
	{
		if (hasBinding(name)) {
			Object currentValue = getBinding(name);
			if (currentValue instanceof KrollProperty) {
				KrollProperty property = (KrollProperty) currentValue;
				if (property.supportsSet(name)) {
					setDynamicProperty(scope, name, property, value);
					return;
				} // else fall through to properties
			}
		}
		
		// the value that comes from KrollObject should already be converted
		setProperty(name, value, true);
	}

	public void set(Scriptable scope, int index, Object value)
	{
		// no-op
	}

	public Object call(Scriptable scope, String name, Object[] args)
		throws Exception
	{
		Object value = UNDEFINED;
		try {
			value = get(scope, name);
		} catch (NoSuchFieldException e) {}

		if (value != UNDEFINED && value instanceof KrollMethod) {
			KrollMethod method = (KrollMethod) value;
			KrollInvocation inv = KrollInvocation.createMethodInvocation(
				TiContext.getCurrentTiContext(), scope, getKrollObject(), name, method, this);

			Object result = method.invoke(inv, args);
			inv.recycle();
			return result;
		} else
			throw new NoSuchMethodException("method \"" + name
				+ "\" of proxy \"" + getAPIName() + "\" wasn't found");
	}

	protected Object getDynamicProperty(Scriptable scope, String name, KrollProperty dynprop)
		throws NoSuchFieldException
	{
		if (dynprop.supportsGet(name)) {
			KrollInvocation inv = KrollInvocation.createPropertyGetInvocation(
				TiContext.getCurrentTiContext(), scope, getKrollObject(), name, dynprop, this);
			Object result = dynprop.get(inv, name);
			inv.recycle();
			return result;
		} else {
			throw new NoSuchFieldException("dynamic property \"" + name
				+ "\" of proxy \"" + getAPIName()
				+ "\" doesn't have read support");
		}
	}

	protected void setDynamicProperty(Scriptable scope, String name, KrollProperty dynprop, Object value)
		throws NoSuchFieldException
	{
		if (dynprop.supportsSet(name)) {
			KrollInvocation inv = KrollInvocation.createPropertySetInvocation(
				TiContext.getCurrentTiContext(), scope, getKrollObject(), name, dynprop, this);
			dynprop.set(inv, name, value);
			inv.recycle();
		} else {
			throw new NoSuchFieldException("dynamic property \"" + name
				+ "\" of proxy \"" + getAPIName()
				+ "\" doesn't have write support");
		}
	}

	// direct accessors (these circumvent programmatic accessors and go straight
	// to the internal map)
	public KrollDict getProperties()
	{
		return properties;
	}

	public boolean hasProperty(String name)
	{
		return properties.containsKey(name);
	}

	public Object getProperty(String name)
	{
		return properties.get(name);
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
		Object current = properties.get(name);
		properties.put(name, value);

		if (fireChange && shouldFireChange(current, value)) {
			firePropertyChanged(name, current, value);
		}
	}

	// native extending support allows us to whole-sale apply properties and only fire one event / job
	@Kroll.method
	public void extend(KrollDict options)
	{
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

	protected void firePropertiesChanged(List<KrollPropertyChange> changes)
	{
		if (modelListener != null) {
			modelListener.propertiesChanged(changes, this);
		}
	}

	public boolean hasBoundMethod(String methodName)
	{
		if (hasBinding(methodName)) {
			return getBinding(methodName) instanceof Function;
		}
		return false;
	}

	public boolean hasBoundProperty(String propertyName)
	{
		if (hasBinding(propertyName)) {
			Object property = getBinding(propertyName);
			if (property instanceof KrollProperty) {
				return true;
			}
		}
		return false;
	}

	public KrollMethod getBoundMethod(String name)
	{
		return (KrollMethod) getBinding(name);
	}

	@SuppressWarnings("serial")
	public class ThisMethod extends KrollMethod
	{
		protected String name;
		protected KrollMethod delegate;
		
		public ThisMethod(String name, KrollMethod delegate) {
			super(name);
			this.name = name;
			this.delegate = delegate;
		}
		
		@Override
		public Object invoke(KrollInvocation invocation, Object[] args)
				throws Exception {
			invocation.proxy = KrollProxy.this;
			invocation.thisObj = KrollProxy.this.getKrollObject();
			return delegate.invoke(invocation, args);
		}
		
		public KrollMethod getDelegate() {
			return delegate;
		}
	}

	public KrollMethod getBoundMethodForThis(String name)
	{
		// This generates a wrapper that always invokes the given bound method
		// using this proxy as the "thisObj"
		final KrollMethod delegate = getBoundMethod(name);
		if (delegate != null) {
			return new ThisMethod(name, delegate);
		}
		return null;
	}

	public KrollProperty getBoundProperty(String name)
	{
		return (KrollProperty) getBinding(name);
	}

	/**
	 * Handle the raw "create" method
	 * @param invocation The KrollInvocation
	 * @param args The arguments passed to the create method
	 */
	public Object handleCreate(KrollInvocation invocation, Object[] args)
	{
		KrollModule createdInModule = (KrollModule) invocation.getProxy();
		Object createArgs[] = new Object[args.length];
		for (int i = 0; i < args.length; i++) {
			createArgs[i] = KrollConverter.getInstance().convertJavascript(
				invocation, args[i], Object.class);
		}
		
		handleCreationArgs(createdInModule, createArgs);
		return KrollConverter.getInstance().convertNative(invocation, this);
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

	protected KrollDict creationDict = null;
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
			modelListener.processProperties((KrollDict) properties.clone());
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

	public KrollBridge getKrollBridge()
	{
		return context.getKrollBridge();
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

	// Convenience for internal code
	public KrollInvocation createEventInvocation(String eventName)
	{
		if (DBG) {
			Log.d(TAG, "creating event invocation, context: " + getTiContext() + ", js context: " + getTiContext().getKrollBridge());
		}
		KrollInvocation inv = KrollInvocation.createMethodInvocation(
			getTiContext(),
			getTiContext().getKrollBridge().getScope(),
			null,
			getAPIName() + ":event:" + eventName, null, this);
		return inv;
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
		return "[Ti."+getAPIName() + "]";
	}
	
	public Object getDefaultValue(Class<?> typeHint)
	{
		return toString();
	}
	
	public Object getJavascriptValue()
	{
		return getKrollObject();
	}
	
	public Object getNativeValue()
	{
		return this;
	}
}
