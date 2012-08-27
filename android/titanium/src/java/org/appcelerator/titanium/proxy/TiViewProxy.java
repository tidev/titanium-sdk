/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.lang.ref.WeakReference;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.HashMap;
import java.util.TreeSet;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.TiAnimationBuilder;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUrl;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.view.View;

/**
 * The parent class of view proxies.
 */
@Kroll.proxy(propertyAccessors={
	// background properties
	"backgroundImage", "backgroundRepeat", "backgroundSelectedImage",
	"backgroundFocusedImage", "backgroundDisabledImage", "backgroundColor",
	"backgroundSelectedColor", "backgroundFocusedColor", "backgroundDisabledColor",
	"backgroundPadding", "backgroundGradient",

	// border properties
	"borderColor", "borderRadius", "borderWidth",

	// layout / dimension (size/width/height have custom accessors)
	"left", "top", "right", "bottom", "layout", "zIndex",

	// others
	"focusable", "touchEnabled", "visible", "enabled", "opacity",
	"softKeyboardOnFocus", "transform"
})
public abstract class TiViewProxy extends KrollProxy implements Handler.Callback
{
	private static final String TAG = "TiViewProxy";

	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;

	private static final int MSG_GETVIEW = MSG_FIRST_ID + 100;
	private static final int MSG_ADD_CHILD = MSG_FIRST_ID + 102;
	private static final int MSG_REMOVE_CHILD = MSG_FIRST_ID + 103;
	private static final int MSG_BLUR = MSG_FIRST_ID + 104;
	private static final int MSG_FOCUS = MSG_FIRST_ID + 105;
	private static final int MSG_SHOW = MSG_FIRST_ID + 106;
	private static final int MSG_HIDE = MSG_FIRST_ID + 107;
	private static final int MSG_ANIMATE = MSG_FIRST_ID + 108;
	private static final int MSG_TOIMAGE = MSG_FIRST_ID + 109;
	private static final int MSG_GETSIZE = MSG_FIRST_ID + 110;
	private static final int MSG_GETRECT = MSG_FIRST_ID + 111;
	private static final int MSG_FINISH_LAYOUT = MSG_FIRST_ID + 112;
	private static final int MSG_UPDATE_LAYOUT = MSG_FIRST_ID + 113;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	protected ArrayList<TiViewProxy> children;
	protected WeakReference<TiViewProxy> parent;

	protected TiUIView view;
	protected Object pendingAnimationLock;
	protected TiAnimationBuilder pendingAnimation;
	private boolean isDecorView = false;

	// TODO: Deprecated since Release 2.2.0
	@Deprecated private AtomicBoolean layoutStarted = new AtomicBoolean();

	/**
	 * Constructs a new TiViewProxy instance.
	 * @module.api
	 */
	public TiViewProxy()
	{
		pendingAnimationLock = new Object();

		defaultValues.put(TiC.PROPERTY_BACKGROUND_REPEAT, false);
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		options = handleStyleOptions(options);
		super.handleCreationDict(options);

		//TODO eventManager.addOnEventChangeListener(this);
	}

	protected String getBaseUrlForStylesheet()
	{
		TiUrl creationUrl = getCreationUrl();
		String baseUrl = creationUrl.baseUrl;
		if (baseUrl == null || (baseUrl.equals("app://") && creationUrl.url.equals(""))) {
			baseUrl = "app://app.js";
		} else {
			baseUrl = creationUrl.resolve();
		}

		int idx = baseUrl.lastIndexOf("/");
		if (idx != -1) {
			baseUrl = baseUrl.substring(idx + 1).replace(".js", "");
		}

		return baseUrl;
	}

	protected KrollDict handleStyleOptions(KrollDict options)
	{
		String viewId = getProxyId();
		TreeSet<String> styleClasses = new TreeSet<String>();
		// TODO styleClasses.add(getShortAPIName().toLowerCase());

		if (options.containsKey(TiC.PROPERTY_ID)) {
			viewId = TiConvert.toString(options, TiC.PROPERTY_ID);
		}
		if (options.containsKey(TiC.PROPERTY_CLASS_NAME)) {
			String className = TiConvert.toString(options, TiC.PROPERTY_CLASS_NAME);
			for (String clazz : className.split(" ")) {
				styleClasses.add(clazz);
			}
		}
		if (options.containsKey(TiC.PROPERTY_CLASS_NAMES)) {
			Object c = options.get(TiC.PROPERTY_CLASS_NAMES);
			if (c.getClass().isArray()) {
				int length = Array.getLength(c);
				for (int i = 0; i < length; i++) {
					Object clazz = Array.get(c, i);
					if (clazz != null) {
						styleClasses.add(clazz.toString());
					}
				}
			}
		}

		String baseUrl = getBaseUrlForStylesheet();
		KrollDict dict = TiApplication.getInstance().getStylesheet(baseUrl, styleClasses, viewId);
		if (dict.size() > 0) {
			extend(dict);
		}

		Log.d(TAG, "trying to get stylesheet for base:" + baseUrl + ",classes:" + styleClasses + ",id:" + viewId + ",dict:"
			+ dict, Log.DEBUG_MODE);
		if (dict != null) {
			// merge in our stylesheet details to the passed in dictionary
			// our passed in dictionary takes precedence over the stylesheet
			dict.putAll(options);
			return dict;
		}
		return options;
	}

	public TiAnimationBuilder getPendingAnimation()
	{
		synchronized(pendingAnimationLock) {
			return pendingAnimation;
		}
	}

	public void clearAnimation(TiAnimationBuilder builder)
	{
		synchronized(pendingAnimationLock) {
			if (pendingAnimation != null && pendingAnimation == builder) {
				pendingAnimation = null;
			}
		}
	}

	//This handler callback is tied to the UI thread.
	public boolean handleMessage(Message msg)
	{
		switch(msg.what) {
			case MSG_GETVIEW : {
				AsyncResult result = (AsyncResult) msg.obj;
				result.setResult(handleGetView());
				return true;
			}
			case MSG_ADD_CHILD : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleAdd((TiViewProxy) result.getArg());
				result.setResult(null); //Signal added.
				return true;
			}
			case MSG_REMOVE_CHILD : {
				AsyncResult result = (AsyncResult) msg.obj;
				handleRemove((TiViewProxy) result.getArg());
				result.setResult(null); //Signal removed.
				return true;
			}
			case MSG_BLUR : {
				handleBlur();
				return true;
			}
			case MSG_FOCUS : {
				handleFocus();
				return true;
			}
			case MSG_SHOW : {
				handleShow((KrollDict) msg.obj);
				return true;
			}
			case MSG_HIDE : {
				handleHide((KrollDict) msg.obj);
				return true;
			}
			case MSG_ANIMATE : {
				handleAnimate();
				return true;
			}
			case MSG_TOIMAGE: {
				AsyncResult result = (AsyncResult) msg.obj;
				result.setResult(handleToImage());
				return true;
			}
			case MSG_GETSIZE : {
				AsyncResult result = (AsyncResult) msg.obj;
				KrollDict d = null;
				d = new KrollDict();
				d.put(TiC.PROPERTY_X, 0);
				d.put(TiC.PROPERTY_Y, 0);
				if (view != null) {
					View v = view.getNativeView();
					if (v != null) {
						TiDimension nativeWidth = new TiDimension(v.getWidth(), TiDimension.TYPE_WIDTH);
						TiDimension nativeHeight = new TiDimension(v.getHeight(), TiDimension.TYPE_HEIGHT);

						// TiDimension needs a view to grab the window manager, so we'll just use the decorview of the current window
						View decorView = TiApplication.getAppCurrentActivity().getWindow().getDecorView();

						d.put(TiC.PROPERTY_WIDTH, nativeWidth.getAsDefault(decorView));
						d.put(TiC.PROPERTY_HEIGHT, nativeHeight.getAsDefault(decorView));
					}
				}
				if (!d.containsKey(TiC.PROPERTY_WIDTH)) {
					d.put(TiC.PROPERTY_WIDTH, 0);
					d.put(TiC.PROPERTY_HEIGHT, 0);
				}

				result.setResult(d);
				return true;
			}
			case MSG_GETRECT: {
				AsyncResult result = (AsyncResult) msg.obj;
				KrollDict d = null;
				d = new KrollDict();
				if (view != null) {
					View v = view.getNativeView();
					if (v != null) {
						TiDimension nativeWidth = new TiDimension(v.getWidth(), TiDimension.TYPE_WIDTH);
						TiDimension nativeHeight = new TiDimension(v.getHeight(), TiDimension.TYPE_HEIGHT);
						TiDimension nativeLeft = new TiDimension(v.getLeft(), TiDimension.TYPE_LEFT);
						TiDimension nativeTop = new TiDimension(v.getTop(), TiDimension.TYPE_TOP);

						// TiDimension needs a view to grab the window manager, so we'll just use the decorview of the current window
						View decorView = TiApplication.getAppCurrentActivity().getWindow().getDecorView();

						d.put(TiC.PROPERTY_WIDTH, nativeWidth.getAsDefault(decorView));
						d.put(TiC.PROPERTY_HEIGHT, nativeHeight.getAsDefault(decorView));
						d.put(TiC.PROPERTY_X, nativeLeft.getAsDefault(decorView));
						d.put(TiC.PROPERTY_Y, nativeTop.getAsDefault(decorView));
					}
				}
				if (!d.containsKey(TiC.PROPERTY_WIDTH)) {
					d.put(TiC.PROPERTY_WIDTH, 0);
					d.put(TiC.PROPERTY_HEIGHT, 0);
					d.put(TiC.PROPERTY_X, 0);
					d.put(TiC.PROPERTY_Y, 0);
				}

				result.setResult(d);
				return true;
			}
			case MSG_FINISH_LAYOUT : {
				handleFinishLayout();
				return true;
			}
			case MSG_UPDATE_LAYOUT : {
				handleUpdateLayout((HashMap) msg.obj);
				return true;
			}
		}
		return super.handleMessage(msg);
	}

	/*
	public Context getContext()
	{
		return getActivity();
	}
	*/

	@Kroll.getProperty @Kroll.method
	public KrollDict getRect()
	{
		return (KrollDict) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_GETRECT), getActivity());
	}

	@Kroll.getProperty @Kroll.method
	public KrollDict getSize()
	{
		return (KrollDict) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_GETSIZE), getActivity());
	}

	@Kroll.getProperty @Kroll.method
	public Object getWidth()
	{
		if (hasProperty(TiC.PROPERTY_WIDTH)) {
			return getProperty(TiC.PROPERTY_WIDTH);
		}

		return KrollRuntime.UNDEFINED;
	}

	@Kroll.setProperty(retain=false) @Kroll.method
	public void setWidth(Object width)
	{
		setPropertyAndFire(TiC.PROPERTY_WIDTH, width);
	}

	@Kroll.getProperty @Kroll.method
	public Object getHeight()
	{
		if (hasProperty(TiC.PROPERTY_HEIGHT)) {
			return getProperty(TiC.PROPERTY_HEIGHT);
		}

		return KrollRuntime.UNDEFINED;
	}

	@Kroll.setProperty(retain=false) @Kroll.method
	public void setHeight(Object height)
	{
		setPropertyAndFire(TiC.PROPERTY_HEIGHT, height);
	}

	@Kroll.getProperty @Kroll.method
	public Object getCenter()
	{
		Object dict = KrollRuntime.UNDEFINED;
		if (hasProperty(TiC.PROPERTY_CENTER)) {
			dict = getProperty(TiC.PROPERTY_CENTER);
		}

		return dict;
	}

	public void clearView()
	{
		if (view != null) {
			view.release();
		}
		view = null;
	}

	/**
	 * @return the TiUIView associated with this proxy.
	 * @module.api
	 */
	public TiUIView peekView()
	{
		return view;
	}

	public void setView(TiUIView view)
	{
		this.view = view;
	}

	public TiUIView forceCreateView()
	{
		view = null;
		return getOrCreateView();
	}

	/**
	 * Creates or retrieves the view associated with this proxy.
	 * @return a TiUIView instance.
	 * @module.api
	 */
	public TiUIView getOrCreateView()
	{
		if (activity == null || view != null) {
			return view;
		}

		if (TiApplication.isUIThread()) {
			return handleGetView();
		}

		return (TiUIView) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_GETVIEW), 0);
	}

	protected TiUIView handleGetView()
	{
		if (view == null) {
			Log.d(TAG, "getView: " + getClass().getSimpleName(), Log.DEBUG_MODE);

			Activity activity = getActivity();
			view = createView(activity);
			if (isDecorView) {
				if (activity != null) {
					((TiBaseActivity)activity).setViewProxy(view.getProxy());
				} else {
					Log.w(TAG, "Activity is null", Log.DEBUG_MODE);
				}
			}
			realizeViews(view);
			view.registerForTouch();
		}
		return view;
	}

	public void realizeViews(TiUIView view)
	{
		setModelListener(view);

		// Use a copy so bundle can be modified as it passes up the inheritance
		// tree. Allows defaults to be added and keys removed.
		if (children != null) {
			try {
				for (TiViewProxy p : children) {
					TiUIView cv = p.getOrCreateView();
					view.add(cv);
				}
			} catch (ConcurrentModificationException e) {
				Log.e(TAG, e.getMessage(), e);
			}
		}

		synchronized(pendingAnimationLock) {
			if (pendingAnimation != null) {
				handlePendingAnimation(true);
			}
		}
	}

	public void releaseViews()
	{
		if (view != null) {
			if  (children != null) {
				for (TiViewProxy p : children) {
					p.releaseViews();
				}
			}
			view.release();
			view = null;
		}
		setModelListener(null);
		KrollRuntime.suggestGC();
	}

	/**
	 * Implementing classes should use this method to create and return the appropriate view.
	 * @param activity the context activity.
	 * @return a TiUIView instance.
	 * @module.api
	 */
	public abstract TiUIView createView(Activity activity);

	/**
	 * Adds a child to this view proxy.
	 * @param child The child view proxy to add.
	 * @module.api
	 */
	@Kroll.method
	public void add(TiViewProxy child)
	{
		if (child == null) {
			Log.e(TAG, "Add called with a null child");
			return;
		}

		if (children == null) {
			children = new ArrayList<TiViewProxy>();
		}

		if (peekView() != null) {
			if (TiApplication.isUIThread()) {
				handleAdd(child);
				return;
			}

			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_ADD_CHILD), child);

		} else {
			children.add(child);
			child.parent = new WeakReference<TiViewProxy>(this);
		}
		//TODO zOrder
	}

	public void handleAdd(TiViewProxy child)
	{
		children.add(child);
		child.parent = new WeakReference<TiViewProxy>(this);
		if (view != null) {
			child.setActivity(getActivity());
			if (this instanceof DecorViewProxy) {
				child.isDecorView = true;
			}
			TiUIView cv = child.getOrCreateView();

			view.add(cv);
		}
	}

	/**
	 * Removes a view from this view proxy, releasing the underlying native view if it exists.
	 * @param child The child to remove.
	 * @module.api
	 */
	@Kroll.method
	public void remove(TiViewProxy child)
	{
		if (child == null) {
			Log.e(TAG, "Add called with null child");
			return;
		}

		if (peekView() != null) {
			if (TiApplication.isUIThread()) {
				handleRemove(child);
				return;
			}

			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_REMOVE_CHILD), child);

		} else {
			if (children != null) {
				children.remove(child);
				if (child.parent != null && child.parent.get() == this) {
					child.parent = null;
				}
			}
		}
	}

	public void handleRemove(TiViewProxy child)
	{
		if (children != null) {
			children.remove(child);
			if (view != null) {
				view.remove(child.peekView());
			}
			if (child != null) {
				child.releaseViews();
			}
		}
	}

	@Kroll.method
	public void show(@Kroll.argument(optional=true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleShow(options);
		} else {
			getMainHandler().obtainMessage(MSG_SHOW, options).sendToTarget();
		}
	}

	protected void handleShow(KrollDict options)
	{
		if (view != null) {
			view.show();
			setProperty(TiC.PROPERTY_VISIBLE, true);
		}
	}

	@Kroll.method
	public void hide(@Kroll.argument(optional=true) KrollDict options)
	{
		if (TiApplication.isUIThread()) {
			handleHide(options);
		} else {
			getMainHandler().obtainMessage(MSG_HIDE, options).sendToTarget();
		}

	}

	protected void handleHide(KrollDict options)
	{
		if (view != null) {
			synchronized(pendingAnimationLock) {
				if (pendingAnimation != null) {
					handlePendingAnimation(false);
				}
			}
			view.hide();
			setProperty(TiC.PROPERTY_VISIBLE, false);
		}
	}

	@Kroll.method
	public void animate(Object arg, @Kroll.argument(optional=true) KrollFunction callback)
	{
		synchronized (pendingAnimationLock) {
			if (arg instanceof HashMap) {
				HashMap options = (HashMap) arg;

				pendingAnimation = new TiAnimationBuilder();
				pendingAnimation.applyOptions(options);
				if (callback != null) {
					pendingAnimation.setCallback(callback);
				}
			} else if (arg instanceof TiAnimation) {
				TiAnimation anim = (TiAnimation) arg;
				pendingAnimation = new TiAnimationBuilder();
				pendingAnimation.applyAnimation(anim);
			} else {
				throw new IllegalArgumentException("Unhandled argument to animate: " + arg.getClass().getSimpleName());
			}
			handlePendingAnimation(false);
		}
	}

	public void handlePendingAnimation(boolean forceQueue)
	{
		if (pendingAnimation != null && peekView() != null) {
			if (forceQueue || !(TiApplication.isUIThread())) {
				if (Build.VERSION.SDK_INT < TiC.API_LEVEL_HONEYCOMB) {
					// Even this very small delay can help eliminate the bug
					// whereby the animated view's parent suddenly becomes
					// transparent (pre-honeycomb). cf. TIMOB-9813.
					getMainHandler().sendEmptyMessageDelayed(MSG_ANIMATE, 10);
				} else {
					getMainHandler().sendEmptyMessage(MSG_ANIMATE);
				}
			} else {
				handleAnimate();
			}
		}
	}

	protected void handleAnimate()
	{
		TiUIView tiv = peekView();

		if (tiv != null) {
			tiv.animate();
		}
	}

	@Kroll.method
	public void blur()
	{
		if (TiApplication.isUIThread()) {
			handleBlur();
		} else {
			getMainHandler().sendEmptyMessage(MSG_BLUR);
		}
	}

	protected void handleBlur()
	{
		if (view != null) {
			view.blur();
		}
	}

	@Kroll.method
	public void focus()
	{
		if (TiApplication.isUIThread()) {
			handleFocus();
		} else {
			getMainHandler().sendEmptyMessage(MSG_FOCUS);
		}
	}

	protected void handleFocus()
	{
		if (view != null) {
			view.focus();
		}
	}

	@Kroll.method
	public KrollDict toImage()
	{
		if (TiApplication.isUIThread()) {
			return handleToImage();

		} else {
			return (KrollDict) TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_TOIMAGE), getActivity());
		}
	}

	protected KrollDict handleToImage()
	{
		TiUIView view = getOrCreateView();
		if (view == null) {
			return null;
		}

		return view.toImage();
	}

	/**
	 * Fires an event that can optionally be "bubbled" to the parent view.
	 * @param eventName event to get dispatched to listeners
	 * @param data data to include in the event
	 * @param bubbles if true will send the event to the parent view after it has been dispatched to this view's listeners.
	 * @return true if the event was handled
	 */
	public boolean fireEvent(String eventName, Object data, boolean bubbles)
	{
		if (data == null) {
			data = new KrollDict();
		}

		// Dispatch the event to JavaScript first before we "bubble" it to the parent view.
		boolean handled = super.fireEvent(eventName, data);
		if (!bubbles) {
			return handled;
		}

		TiViewProxy parentView = getParent();
		if (parentView != null) {
			handled = parentView.fireEvent(eventName, data) || handled;
		}

		return handled;
	}

	/**
	 * Fires an event that will be bubbled to the parent view.
	 */
	@Override
	public boolean fireEvent(String eventName, Object data)
	{
		// To remain compatible this override of fireEvent will always
		// bubble the event to the parent view. It should eventually be deprecated
		// in favor of using the fireEvent(String, Object, boolean) method.
		return fireEvent(eventName, data, true);
	}

	/**
	 * @return The parent view proxy of this view proxy.
	 * @module.api
	 */
	@Kroll.getProperty @Kroll.method
	public TiViewProxy getParent()
	{
		if (this.parent == null) {
			return null;
		}

		return this.parent.get();
	}

	public void setParent(TiViewProxy parent)
	{
		this.parent = new WeakReference<TiViewProxy>(parent);
	}

	@Override
	public void setActivity(Activity activity)
	{
		super.setActivity(activity);
		if (children != null) {
			for (TiViewProxy child : children) {
				child.setActivity(activity);
			}
		}
	}

	/**
	 * @return An array of the children view proxies of this view.
	 * @module.api
	 */
	@Kroll.getProperty @Kroll.method
	public TiViewProxy[] getChildren()
	{
		if (children == null) return new TiViewProxy[0];
		return children.toArray(new TiViewProxy[children.size()]);
	}

	@Override
	public void eventListenerAdded(String eventName, int count, KrollProxy proxy)
	{
		super.eventListenerAdded(eventName, count, proxy);
		if (eventName.equals(TiC.EVENT_CLICK) && proxy.equals(this) && count == 1 && !(proxy instanceof TiWindowProxy)) {
			if (!proxy.hasProperty(TiC.PROPERTY_TOUCH_ENABLED)
				|| TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_TOUCH_ENABLED))) {
				setClickable(true);
			}
		}
	}

	@Override
	public void eventListenerRemoved(String eventName, int count, KrollProxy proxy)
	{
		super.eventListenerRemoved(eventName, count, proxy);
		if (eventName.equals(TiC.EVENT_CLICK) && count == 0 && proxy.equals(this) && !(proxy instanceof TiWindowProxy)) {
			if (proxy.hasProperty(TiC.PROPERTY_TOUCH_ENABLED)
				&& !TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_TOUCH_ENABLED))) {
				setClickable(false);
			}
		}
	}

	/**
	 * Return true if any view in the hierarchy has the event listener.
	 */
	public boolean hierarchyHasListener(String eventName)
	{
		boolean hasListener = hasListeners(eventName);

		// Check whether the parent has the listener or not
		if (!hasListener) {
			TiViewProxy parent = getParent();
			if (parent != null) {
				boolean parentHasListener = parent.hierarchyHasListener(eventName);
				hasListener = hasListener || parentHasListener;
				if (hasListener) {
					return hasListener;
				}
			}
		}

		return hasListener;
	}

	public void setClickable(boolean clickable)
	{
		TiUIView v = peekView();
		if (v != null) {
			View nv = v.getNativeView();
			if (nv != null) {
				nv.setClickable(clickable);
			}
		}
	}

	@Kroll.method
	public void addClass(Object[] classNames)
	{
		// This is a pretty naive implementation right now,
		// but it will work for our current needs
		String baseUrl = getBaseUrlForStylesheet();
		ArrayList<String> classes = new ArrayList<String>();
		for (Object c : classNames) {
			classes.add(TiConvert.toString(c));
		}
		KrollDict options = TiApplication.getInstance().getStylesheet(baseUrl, classes, null);
		extend(options);
	}

	@Kroll.method @Kroll.getProperty
	public boolean getKeepScreenOn()
	{
		Boolean keepScreenOn = null;
		TiUIView v = peekView();
		if (v != null) {
			View nv = v.getNativeView();
			if (nv != null) {
				keepScreenOn = nv.getKeepScreenOn();
			}
		}

		//Keep the proxy in the correct state
		Object current = getProperty(TiC.PROPERTY_KEEP_SCREEN_ON);
		if (current != null) {
			boolean currentValue = TiConvert.toBoolean(current);
			if (keepScreenOn == null) {
				keepScreenOn = currentValue;
			} else {
				if (currentValue != keepScreenOn) {
					setProperty(TiC.PROPERTY_KEEP_SCREEN_ON, keepScreenOn);
				} else {
					keepScreenOn = currentValue;
				}
			}
		} else {
			if (keepScreenOn == null) {
				keepScreenOn = false; // Android default
			}

			setProperty(TiC.PROPERTY_KEEP_SCREEN_ON, keepScreenOn);
		}

		return keepScreenOn;
	}

	@Kroll.method @Kroll.setProperty(retain=false)
	public void setKeepScreenOn(boolean keepScreenOn)
	{
		setPropertyAndFire(TiC.PROPERTY_KEEP_SCREEN_ON, keepScreenOn);
	}

	@Kroll.method
	public KrollDict convertPointToView(KrollDict point, TiViewProxy dest)
	{
		if (point == null) {
			throw new IllegalArgumentException("convertPointToView: point must not be null");
		}

		if (dest == null) {
			throw new IllegalArgumentException("convertPointToView: destinationView must not be null");
		}

		if (!point.containsKey(TiC.PROPERTY_X)) {
			throw new IllegalArgumentException("convertPointToView: required property \"x\" not found in point");
		}

		if (!point.containsKey(TiC.PROPERTY_Y)) {
			throw new IllegalArgumentException("convertPointToView: required property \"y\" not found in point");
		}

		// The spec says to throw an exception if x or y cannot be converted to numbers.
		// TiConvert does that automatically for us.
		int x = TiConvert.toInt(point, TiC.PROPERTY_X);
		int y = TiConvert.toInt(point, TiC.PROPERTY_Y);

		TiUIView view = peekView();
		TiUIView destView = dest.peekView();
		if (view == null) {
			Log.w(TAG, "convertPointToView: View has not been attached, cannot convert point");
			return null;
		}

		if (destView == null) {
			Log.w(TAG, "convertPointToView: DestinationView has not been attached, cannot convert point");
			return null;
		}

		View nativeView = view.getNativeView();
		View destNativeView = destView.getNativeView();
		if (nativeView == null || nativeView.getParent() == null) {
			Log.w(TAG, "convertPointToView: View has not been attached, cannot convert point");
			return null;
		}

		if (destNativeView == null || destNativeView.getParent() == null) {
			Log.w(TAG, "convertPointToView: DestinationView has not been attached, cannot convert point");
			return null;
		}

		int viewLocation[] = new int[2];
		int destLocation[] = new int[2];
		nativeView.getLocationInWindow(viewLocation);
		destNativeView.getLocationInWindow(destLocation);

		Log.d(TAG, "nativeView location in window, x: " + viewLocation[0] + ", y: " + viewLocation[1], Log.DEBUG_MODE);
		Log.d(TAG, "destNativeView location in window, x: " + destLocation[0] + ", y: " + destLocation[1], Log.DEBUG_MODE);

		int pointWindowX = viewLocation[0] + x;
		int pointWindowY = viewLocation[1] + y;

		KrollDict destPoint = new KrollDict();
		destPoint.put(TiC.PROPERTY_X, pointWindowX - destLocation[0]);
		destPoint.put(TiC.PROPERTY_Y, pointWindowY - destLocation[1]);
		return destPoint;
	}

	// TODO: Deprecated since Release 2.2.0
	@Kroll.method @Deprecated
	public void startLayout()
	{
		Log.w(TAG, "startLayout() is deprecated.", Log.DEBUG_MODE);

		layoutStarted.set(true);
	}

	// TODO: Deprecated since Release 2.2.0
	@Kroll.method @Deprecated
	public void finishLayout()
	{
		Log.w(TAG, "finishLayout() is deprecated.", Log.DEBUG_MODE);

		// Don't force a layout if startLayout() was never called
		if (!isLayoutStarted()) {
			return;
		}
		if (TiApplication.isUIThread()) {
			handleFinishLayout();
		} else {
			getMainHandler().sendEmptyMessage(MSG_FINISH_LAYOUT);
		}
		layoutStarted.set(false);
	}

	// TODO: Deprecated since Release 2.2.0
	@Kroll.method @Deprecated
	public void updateLayout(Object params)
	{
		Log.w(TAG, "updateLayout() is deprecated.", Log.DEBUG_MODE);

		HashMap<String, Object> paramsMap;

		if (!(params instanceof HashMap)) {
			Log.e(TAG, "Argument for updateLayout must be a dictionary");
			return;
		}
		paramsMap = (HashMap) params;

		layoutStarted.set(true);
		if (TiApplication.isUIThread()) {
			handleUpdateLayout(paramsMap);
		} else {
			getMainHandler().obtainMessage(MSG_UPDATE_LAYOUT, paramsMap).sendToTarget();
		}
		layoutStarted.set(false);
	}

	private void handleFinishLayout()
	{
		if (view.iszIndexChanged()) {
			view.forceLayoutNativeView(true);
			view.setzIndexChanged(false);
		} else {
			view.forceLayoutNativeView(false);
		}
	}

	private void handleUpdateLayout(HashMap<String, Object> params)
	{
		for (String key : params.keySet()) {
			setPropertyAndFire(key, params.get(key));
		}
		handleFinishLayout();
	}

	// TODO: Deprecated since Release 2.2.0
	// This is used to check if the user has called startLayout(). We mainly use this to perform a check before running
	// deprecated behavior. (i.e. performing layout when a property has changed, and the user didn't call startLayout)
	@Deprecated
	public boolean isLayoutStarted()
	{
		return layoutStarted.get();
	}
}
