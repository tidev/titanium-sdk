/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.lang.ref.WeakReference;
import java.lang.reflect.Array;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.TreeSet;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiAnimationBuilder;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiResourceHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.view.View;

public abstract class TiViewProxy extends TiProxy implements Handler.Callback
{
	private static final String LCAT = "TiViewProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int MSG_FIRST_ID = TiProxy.MSG_LAST_ID + 1;

	private static final int MSG_GETVIEW = MSG_FIRST_ID + 100;
	private static final int MSG_FIRE_PROPERTY_CHANGES = MSG_FIRST_ID + 101;
	private static final int MSG_ADD_CHILD = MSG_FIRST_ID + 102;
	private static final int MSG_REMOVE_CHILD = MSG_FIRST_ID + 103;
	private static final int MSG_INVOKE_METHOD = MSG_FIRST_ID + 104;
	private static final int MSG_BLUR = MSG_FIRST_ID + 105;
	private static final int MSG_FOCUS = MSG_FIRST_ID + 106;
	private static final int MSG_SHOW = MSG_FIRST_ID + 107;
	private static final int MSG_HIDE = MSG_FIRST_ID + 108;
	private static final int MSG_ANIMATE = MSG_FIRST_ID + 109;
	private static final int MSG_TOIMAGE = MSG_FIRST_ID + 110;
	private static final int MSG_GETSIZE = MSG_FIRST_ID + 111;
	private static final int MSG_GETCENTER = MSG_FIRST_ID + 112;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	protected ArrayList<TiViewProxy> children;
	protected WeakReference<TiViewProxy> parent;

	private static TiDict cssConversionTable;

	private static class InvocationWrapper {
		public String name;
		public Method m;
		public Object target;
		public Object[] args;
	}

	// Ti Properties force using accessors.
	private Double zIndex;

	protected TiUIView view;
	protected TiAnimationBuilder pendingAnimation;
	
	public TiViewProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext);

		TiDict options = new TiDict();
		if (args.length > 0) {
			options = (TiDict) args[0];
			
			//lang conversion table
			TiDict langTable = getLangConversionTable();
			if (langTable!=null)
			{
				Activity activity = tiContext.getActivity();
				for (String key : langTable.keySet())
				{
					// if we have it already, ignore
					if (options.containsKey(key)==false)
					{
						String convertKey = (String)langTable.get(key);
						String langKey = (String)options.get(convertKey);
						if (langKey!=null)
						{
							int value = TiResourceHelper.getString(langKey);
							if (value!=0)
							{
								String convertValue = activity.getString(value);
								options.put(key,convertValue);
							}
						}
					}
				}
			}
		}

		options = handleStyleOptions(options);
		setProperties(options);
		
		tiContext.addOnEventChangeListener(this);
	}
	
	protected String getBaseUrlForStylesheet() {
		String baseUrl = getTiContext().getCurrentUrl();
		if (baseUrl == null) {
			baseUrl = "app://app.js";
		}
		
		int idx = baseUrl.lastIndexOf("/");
		if (idx != -1) {
			baseUrl = baseUrl.substring(idx + 1).replace(".js", "");
		}
		return baseUrl;
	}
	
	protected TiDict handleStyleOptions(TiDict options) {
		String viewId = getProxyId();
		TreeSet<String> styleClasses = new TreeSet<String>();
		styleClasses.add(getClass().getSimpleName().replace("Proxy", "").toLowerCase());
		
		if (options.containsKey("id")) {
			viewId = TiConvert.toString(options, "id");
		}
		if (options.containsKey("className")) {
			String className = TiConvert.toString(options, "className");
			for (String clazz : className.split(" ")) {
				styleClasses.add(clazz);
			}
		}
		if (options.containsKey("classNames")) {
			Object c = options.get("classNames");
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
		TiDict dict = getTiContext().getTiApp().getStylesheet(baseUrl, styleClasses, viewId);
		Log.d(LCAT, "trying to get stylesheet for base:" + baseUrl + ",classes:" + styleClasses + ",id:" + viewId + ",dict:" + dict);
		if (dict != null) {
			// merge in our stylesheet details to the passed in dictionary
			// our passed in dictionary takes precedence over the stylesheet
			dict.putAll(options);
			return dict;
		}
		return options;
	}
	
	protected TiDict getLangConversionTable() {
		// subclasses override to return a table mapping of langid keys to actual keys
		// used for specifying things like titleid vs. title so that you can localize them
		return null;
	}

	public TiAnimationBuilder getPendingAnimation() {
		return pendingAnimation;
	}

	public void clearAnimation() {
		if (pendingAnimation != null) {
			pendingAnimation = null;
		}
	}

	//This handler callback is tied to the UI thread.
	public boolean handleMessage(Message msg)
	{
		switch(msg.what) {
			case MSG_GETVIEW : {
				AsyncResult result = (AsyncResult) msg.obj;
				result.setResult(handleGetView((Activity) result.getArg()));
				return true;
			}
			case MSG_FIRE_PROPERTY_CHANGES : {
				handleFirePropertyChanges();
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
			case MSG_INVOKE_METHOD : {
				AsyncResult result = (AsyncResult) msg.obj;
				result.setResult(handleInvokeMethod((InvocationWrapper) result.getArg()));
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
				handleShow((TiDict) msg.obj);
				return true;
			}
			case MSG_HIDE : {
				handleHide((TiDict) msg.obj);
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
				TiDict d = null;
				if (view != null) {
					View v = view.getNativeView();
					if (v != null) {
						d = new TiDict();
						d.put("width", v.getWidth());
						d.put("height", v.getHeight());
					}
				}
				if (d == null) {
					d = new TiDict();
					d.put("width", 0);
					d.put("height", 0);
				}

				result.setResult(d);
				return true;
			}
			case MSG_GETCENTER : {
				AsyncResult result = (AsyncResult) msg.obj;
				TiDict d = null;
				if (view != null) {
					View v = view.getNativeView();
					if (v != null) {
						d = new TiDict();
						d.put("x", (double)v.getLeft() + (double)v.getWidth() / 2);
						d.put("y", (double)v.getTop() + (double)v.getHeight() / 2);
					}
				}
				if (d == null) {
					d = new TiDict();
					d.put("x", 0);
					d.put("y", 0);
				}

				result.setResult(d);
				return true;
			}
		}
		return super.handleMessage(msg);
	}

	public Context getContext()
	{
		return getTiContext().getActivity();
	}

	public String getZIndex() {
		return zIndex == null ? (String) null : String.valueOf(zIndex);
	}

	public void setZIndex(String value) {
		if (value != null && value.trim().length() > 0) {
			zIndex = new Double(value);
		}
	}

	public TiDict getSize() {
		AsyncResult result = new AsyncResult(getTiContext().getActivity());
		Message msg = getUIHandler().obtainMessage(MSG_GETSIZE, result);
		msg.sendToTarget();
		return (TiDict) result.getResult();
	}

	public TiDict getCenter() {
		AsyncResult result = new AsyncResult(getTiContext().getActivity());
		Message msg = getUIHandler().obtainMessage(MSG_GETCENTER, result);
		msg.sendToTarget();
		return (TiDict) result.getResult();
	}

	public void clearView() {
		if (view != null) {
			view.release();
		}
		view = null;
	}

	public TiUIView peekView()
	{
		return view;
	}

	public TiUIView getView(Activity activity)
	{
		if (activity == null) {
			activity = getTiContext().getActivity();
		}
		if(getTiContext().isUIThread()) {
			return handleGetView(activity);
		}

		AsyncResult result = new AsyncResult(activity);
		Message msg = getUIHandler().obtainMessage(MSG_GETVIEW, result);
		msg.sendToTarget();
		return (TiUIView) result.getResult();
	}

	protected TiUIView handleGetView(Activity activity)
	{
		if (view == null) {
			if (DBG) {
				Log.i(LCAT, "getView: " + getClass().getSimpleName());
			}

			view = createView(activity);
			realizeViews(activity, view);
			view.registerForTouch();
		}
		return view;
	}

	public void realizeViews(Activity activity, TiUIView view)
	{

		setModelListener(view);

		// Use a copy so bundle can be modified as it passes up the inheritance
		// tree. Allows defaults to be added and keys removed.

		if (children != null) {
			for (TiViewProxy p : children) {
				TiUIView cv = p.getView(activity);
				view.add(cv);
			}
		}
		
		if (pendingAnimation != null) {
			handlePendingAnimation(true);
		}
	}

	public void releaseViews() {
		if (view != null) {
			if  (children != null) {
				for(TiViewProxy p : children) {
					p.releaseViews();
				}
			}
			view.release();
			view = null;
		}
		setModelListener(null);
	}

	public abstract TiUIView createView(Activity activity);

	public void add(TiViewProxy child) {
		if (children == null) {
			children = new ArrayList<TiViewProxy>();
		}
		if (peekView() != null) {
			if(getTiContext().isUIThread()) {
				handleAdd(child);
				return;
			}

			AsyncResult result = new AsyncResult(child);
			Message msg = getUIHandler().obtainMessage(MSG_ADD_CHILD, result);
			msg.sendToTarget();
			result.getResult(); // We don't care about the result, just synchronizing.
		} else {
			children.add(child);
			child.parent = new WeakReference<TiViewProxy>(this);
		}
		//TODO zOrder
	}

	public void handleAdd(TiViewProxy child)
	{
		children.add(child);
		if (view != null) {
			TiUIView cv = child.getView(getTiContext().getActivity());
			view.add(cv);
			child.parent = new WeakReference<TiViewProxy>(this);
		}
	}

	public void remove(TiViewProxy child)
	{
		if (peekView() != null) {
			if (getTiContext().isUIThread()) {
				handleRemove(child);
				return;
			}

			AsyncResult result = new AsyncResult(child);
			Message msg = getUIHandler().obtainMessage(MSG_REMOVE_CHILD, result);
			msg.sendToTarget();
			result.getResult(); // We don't care about the result, just synchronizing.
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
		}
	}

	public void show(TiDict options)
	{
		if (getTiContext().isUIThread()) {
			handleShow(options);
		} else {
			getUIHandler().obtainMessage(MSG_SHOW, options).sendToTarget();
		}
	}

	protected void handleShow(TiDict options) {
		if (view != null) {
			view.show();
		}
	}

	public void hide(TiDict options) {
		if (getTiContext().isUIThread()) {
			handleHide(options);
		} else {
			getUIHandler().obtainMessage(MSG_HIDE, options).sendToTarget();
		}

	}

	protected void handleHide(TiDict options) {
		if (view != null) {
			if (pendingAnimation != null) {
				handlePendingAnimation(false);
			}
			view.hide();
		}
	}

	public void animate(Object[] args)
	{
		if (args != null) {
			if (args[0] instanceof TiDict) {
				TiDict options = (TiDict) args[0];
				KrollCallback callback = null;
				if (args.length > 1) {
					callback = (KrollCallback) args[1];
				}

				pendingAnimation = new TiAnimationBuilder();
				pendingAnimation.applyOptions(options);
				if (callback != null) {
					pendingAnimation.setCallback(callback);
				}
			} else if (args[0] instanceof TiAnimation) {
				TiAnimation anim = (TiAnimation) args[0];
				pendingAnimation = new TiAnimationBuilder();
				pendingAnimation.applyAnimation(anim);
			} else {
				throw new IllegalArgumentException("Unhandled argument to animate: " + args[0].getClass().getSimpleName());
			}
			handlePendingAnimation(false);
		}
	}

	public void handlePendingAnimation(boolean forceQueue) {
		if (pendingAnimation != null && peekView() != null) {
			if (forceQueue || !getTiContext().isUIThread()) {
				getUIHandler().obtainMessage(MSG_ANIMATE).sendToTarget();
			} else {
				handleAnimate();
			}
		}
	}

	protected void handleAnimate() {
		TiUIView tiv = peekView();

		if (tiv != null) {
			tiv.animate();
		}
	}

	public void blur()
	{
		if (getTiContext().isUIThread()) {
			handleBlur();
		} else {
			getUIHandler().sendEmptyMessage(MSG_BLUR);
		}
	}
	protected void handleBlur() {
		if (view != null) {
			view.blur();
		}
	}
	public void focus()
	{
		if (getTiContext().isUIThread()) {
			handleFocus();
		} else {
			getUIHandler().sendEmptyMessage(MSG_FOCUS);
		}
	}
	protected void handleFocus() {
		if (view != null) {
			view.focus();
		}
	}

	public TiDict toImage() {
		if (getTiContext().isUIThread()) {
			return handleToImage();
		} else {
			AsyncResult result = new AsyncResult(getTiContext().getActivity());
			Message msg = getUIHandler().obtainMessage(MSG_TOIMAGE);
			msg.obj = result;
			msg.sendToTarget();
			return (TiDict) result.getResult();
		}
	}

	protected TiDict handleToImage() {
		return getView(getTiContext().getActivity()).toImage();
	}

	// Helper methods

	private void firePropertyChanges() {
		if (getTiContext().isUIThread()) {
			handleFirePropertyChanges();
		} else {
			getUIHandler().sendEmptyMessage(MSG_FIRE_PROPERTY_CHANGES);
		}
	}

	private void handleFirePropertyChanges() {
		if (modelListener != null && dynprops != null) {
			for (String key : dynprops.keySet()) {
				modelListener.propertyChanged(key, null, dynprops.get(key), this);
			}
		}
	}

	@Override
	public Object resultForUndefinedMethod(String name, Object[] args)
	{
		if (view != null) {
			Method m = getTiContext().getTiApp().methodFor(view.getClass(), name);
			if (m != null) {
				InvocationWrapper w = new InvocationWrapper();
				w.name = name;
				w.m = m;
				w.target = view;
				w.args = args;

				if (getTiContext().isUIThread()) {
					handleInvokeMethod(w);
				} else {
					AsyncResult result = new AsyncResult(w);
					Message msg = getUIHandler().obtainMessage(MSG_INVOKE_METHOD, result);
					msg.sendToTarget();
					return result.getResult();
				}
			}
		}

		return super.resultForUndefinedMethod(name, args);
	}

	private Object handleInvokeMethod(InvocationWrapper w)
	{
		try {
			return w.m.invoke(w.target, w.args);
		} catch (InvocationTargetException e) {
			Log.e(LCAT, "Error while invoking " + w.name + " on " + view.getClass().getSimpleName(), e);
			// TODO - wrap in a better exception.
			return e;
		} catch (IllegalAccessException e) {
			Log.e(LCAT, "Error while invoking " + w.name + " on " + view.getClass().getSimpleName(), e);
			return e;
		}
	}

	@Override
	public boolean fireEvent(String eventName, TiDict data) 
	{
		if (data == null) {
			data = new TiDict();
		}
		
		boolean handled = super.fireEvent(eventName, data);

		if (parent != null && parent.get() != null) {
			boolean parentHandled = parent.get().fireEvent(eventName, data);
			handled = handled || parentHandled;
		}
		return handled;
	}
	
	public TiViewProxy getParent() {
		if (this.parent == null) { return null; }
		return this.parent.get();
	}
	
	public void setParent(TiViewProxy parent) {
		this.parent = new WeakReference<TiViewProxy>(parent);	
	}
	
	@Override
	public TiContext switchContext(TiContext tiContext) {
		TiContext oldContext = super.switchContext(tiContext);
		if (children != null) {
			for (TiViewProxy child : children) {
				child.switchContext(tiContext);
			}
		}
		return oldContext;
	}
	
	public TiViewProxy[] getChildren() {
		if (children == null) return new TiViewProxy[0];
		
		return children.toArray(new TiViewProxy[children.size()]);
	}
	
	@Override
	public void eventListenerAdded(String eventName, int count, TiProxy proxy) {
		super.eventListenerAdded(eventName, count, proxy);
		
		if (eventName.equals("click") && proxy.equals(this) && count == 1 && !(proxy instanceof TiWindowProxy)) {
			if (!proxy.hasDynamicValue("touchEnabled") || TiConvert.toBoolean(proxy.getDynamicValue("touchEnabled"))) {
				setClickable(true);
			}
		}
	}
	
	@Override
	public void eventListenerRemoved(String eventName, int count, TiProxy proxy) {
		super.eventListenerRemoved(eventName, count, proxy);
		
		if (eventName.equals("click") && count == 0 && proxy.equals(this) && !(proxy instanceof TiWindowProxy)) {
			if (proxy.hasDynamicValue("touchEnabled") && !TiConvert.toBoolean(proxy.getDynamicValue("touchEnabled"))) {
				setClickable(false);
			}
		}
	}
	
	public void setClickable(boolean clickable) {
		if (peekView() != null) {
			TiUIView v = getView(getTiContext().getActivity());
			if (v != null) {
				v.getNativeView().setClickable(clickable);
			}
		}
	}
	
	public void addClass(Object[] classNames) {
		// This is a pretty naive implementation right now,
		// but it will work for our current needs
		String baseUrl = getBaseUrlForStylesheet();
		ArrayList<String> classes = new ArrayList<String>();
		for (Object c : classNames) {
			classes.add(TiConvert.toString(c));
		}
		TiDict options = getTiContext().getTiApp().getStylesheet(baseUrl, classes, null);
		extend(options);
	}
}
