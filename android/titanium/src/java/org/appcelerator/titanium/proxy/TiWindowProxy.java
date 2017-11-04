/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiOrientationHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiWeakList;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.ActivityOptions;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;
import android.util.Pair;
import android.view.Display;
import android.view.View;

@Kroll.proxy(propertyAccessors={
	TiC.PROPERTY_EXIT_ON_CLOSE,
	TiC.PROPERTY_FULLSCREEN,
	TiC.PROPERTY_ON_BACK,
	TiC.PROPERTY_TITLE,
	TiC.PROPERTY_TITLEID,
	TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE
})
public abstract class TiWindowProxy extends TiViewProxy
{
	private static final String TAG = "TiWindowProxy";
	protected static final boolean LOLLIPOP_OR_GREATER = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);
	
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_OPEN = MSG_FIRST_ID + 100;
	private static final int MSG_CLOSE = MSG_FIRST_ID + 101;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private static WeakReference<TiWindowProxy> waitingForOpen;
	private TiWeakList<KrollProxy> proxiesWaitingForActivity = new TiWeakList<KrollProxy>();

	protected boolean opened, opening;
	protected boolean focused;
	protected int[] orientationModes = null;
	protected TiViewProxy tabGroup;
	protected TiViewProxy tab;
	protected boolean inTab;
	protected PostOpenListener postOpenListener;
	protected boolean windowActivityCreated = false;
	protected List< Pair<View, String> > sharedElementPairs;

	public static interface PostOpenListener
	{
		public void onPostOpen(TiWindowProxy window);
	}

	public static TiWindowProxy getWaitingForOpen()
	{
		if (waitingForOpen == null) return null;
		return waitingForOpen.get();
	}

	public TiWindowProxy()
	{
		inTab = false;
		if (LOLLIPOP_OR_GREATER) {
		    sharedElementPairs = new ArrayList< Pair<View, String> >();
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		throw new IllegalStateException("Windows are created during open");
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_OPEN: {
				AsyncResult result = (AsyncResult) msg.obj;
				handleOpen((KrollDict) result.getArg());
				result.setResult(null); // signal opened
				return true;
			}
			case MSG_CLOSE: {
				AsyncResult result = (AsyncResult) msg.obj;
				handleClose((KrollDict) result.getArg());
				result.setResult(null); // signal closed
				return true;
			}
			default: {
				return super.handleMessage(msg);
			}
		}
	}

	@Kroll.method @SuppressWarnings("unchecked")
	public void open(@Kroll.argument(optional = true) Object arg)
	{
		if (opened || opening) { return; }

		waitingForOpen = new WeakReference<TiWindowProxy>(this);
		opening = true;
		KrollDict options = null;
		TiAnimation animation = null;

		if (arg != null) {
			if (arg instanceof KrollDict) {
				options = (KrollDict) arg;

			} else if (arg instanceof HashMap<?, ?>) {
				options = new KrollDict((HashMap<String, Object>) arg);

			} else if (arg instanceof TiAnimation) {
				options = new KrollDict();
				options.put("_anim", animation);
			}

		} else {
			options = new KrollDict();
		}

		if (TiApplication.isUIThread()) {
			handleOpen(options);
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_OPEN), options);

	}

	@SuppressWarnings("unchecked")
	@Kroll.method
	public void close(@Kroll.argument(optional = true) Object arg)
	{

		KrollDict options = null;
		TiAnimation animation = null;

		if (arg != null) {
			if (arg instanceof HashMap<?, ?>) {
				options = new KrollDict((HashMap<String, Object>) arg);

			} else if (arg instanceof TiAnimation) {
				options = new KrollDict();
				options.put("_anim", animation);
			}

		} else {
			options = new KrollDict();
		}

		if (TiApplication.isUIThread()) {
			handleClose(options);
			return;
		}

		TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_CLOSE), options);
	}

	public void closeFromActivity(boolean activityIsFinishing)
	{
		if (!opened) { return; }

		KrollDict data = null;
		if (activityIsFinishing) {
			releaseViews();
		} else {
			// If the activity is forced to destroy by Android OS due to lack of memory or 
			// enabling "Don't keep activities" (TIMOB-12939), we will not release the
			// top-most view proxy (window and tabgroup).
			releaseViewsForActivityForcedToDestroy();
			data = new KrollDict();
			data.put("_closeFromActivityForcedToDestroy", true);
		}
		opened = false;
		activity = null;

		// Once the window's activity is destroyed we will fire the close event.
		// And it will dispose the handler of the window in the JS if the activity
		// is not forced to destroy.
		fireSyncEvent(TiC.EVENT_CLOSE, data);
	}

	public void addProxyWaitingForActivity(KrollProxy waitingProxy) {
		proxiesWaitingForActivity.add(new WeakReference<KrollProxy>(waitingProxy));
	}

	protected void releaseViewsForActivityForcedToDestroy()
	{
		releaseViews();
	}

	@Kroll.method(name="setTab")
	@Kroll.setProperty(name="tab")
	public void setTabProxy(TiViewProxy tabProxy)
	{
		setParent(tabProxy);
		this.tab = tabProxy;
	}

	@Kroll.method(name="getTab")
	@Kroll.getProperty(name="tab")
	public TiViewProxy getTabProxy()
	{
		return this.tab;
	}

	@Kroll.method(name="setTabGroup")
	@Kroll.setProperty(name="tabGroup")
	public void setTabGroupProxy(TiViewProxy tabGroupProxy)
	{
		this.tabGroup = tabGroupProxy;
	}

	@Kroll.method(name="getTabGroup")
	@Kroll.getProperty(name="tabGroup")
	public TiViewProxy getTabGroupProxy()
	{
		return this.tabGroup;
	}

	public void setPostOpenListener(PostOpenListener listener)
	{
		this.postOpenListener = listener;
	}

	public TiBlob handleToImage()
	{
		KrollDict d = TiUIHelper.viewToImage(new KrollDict(), getActivity().getWindow().getDecorView());
		return TiUIHelper.getImageFromDict(d);
	}

	/*
	 * Called when the window's activity has been created.
	 */
	public void onWindowActivityCreated()
	{
		windowActivityCreated = true;

		synchronized (proxiesWaitingForActivity.synchronizedList()) {
			for (KrollProxy proxy : proxiesWaitingForActivity.nonNull()) {
				try {
					proxy.attachActivityLifecycle(getActivity());
				} catch (Throwable t) {
					Log.e(TAG, "Error attaching activity to proxy: " + t.getMessage(), t);
				}
			}
		}

		// Make sure the activity opens according to any orientation modes 
		// set on the window before the activity was actually created.
		if (orientationModes != null) {
			setOrientationModes(orientationModes);
		}
	}

	/**
	 * Called when the window gained or lost focus.
	 *
	 * Default implementation will fire "focus" and "blur" events
	 * when the focus state has changed.
	 *
	 * @param focused true if focus was gained
	 */
	public void onWindowFocusChange(boolean focused) {
		fireEvent((focused) ? TiC.EVENT_FOCUS : TiC.EVENT_BLUR, null, false);
	}

	@Kroll.setProperty @Kroll.method
	public void setLeftNavButton(Object button)
	{
		Log.w(TAG, "setLeftNavButton not supported in Android");
	}

	@Kroll.method @Kroll.setProperty
	public void setOrientationModes (int[] modes)
	{
		int activityOrientationMode = -1;
		boolean hasPortrait = false;
		boolean hasPortraitReverse = false;
		boolean hasLandscape = false;
		boolean hasLandscapeReverse = false;

		// update orientation modes that get exposed
		orientationModes = modes;

		if (modes != null)
		{
			// look through orientation modes and determine what has been set
			for (int i = 0; i < orientationModes.length; i++)
			{
				if (orientationModes [i] == TiOrientationHelper.ORIENTATION_PORTRAIT)
				{
					hasPortrait = true;
				}
				else if (orientationModes [i] == TiOrientationHelper.ORIENTATION_PORTRAIT_REVERSE)
				{
					hasPortraitReverse = true;
				}
				else if (orientationModes [i] == TiOrientationHelper.ORIENTATION_LANDSCAPE)
				{
					hasLandscape = true;
				}
				else if (orientationModes [i] == TiOrientationHelper.ORIENTATION_LANDSCAPE_REVERSE)
				{
					hasLandscapeReverse = true;
				}
			}

			// determine if we have a valid activity orientation mode based on provided modes list
			if (orientationModes.length == 0)
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			}
			else if ((hasPortrait || hasPortraitReverse) && (hasLandscape || hasLandscapeReverse))
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			}
			else if (hasPortrait && hasPortraitReverse)
			{
				//activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;

				// unable to use constant until sdk lvl 9, use constant value instead
				// if sdk level is less than 9, set as regular portrait
				if (Build.VERSION.SDK_INT >= 9)
				{
					activityOrientationMode = 7;
				}
				else
				{
					activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
				}
			}
			else if (hasLandscape && hasLandscapeReverse)
			{
				//activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;

				// unable to use constant until sdk lvl 9, use constant value instead
				// if sdk level is less than 9, set as regular landscape
				if (Build.VERSION.SDK_INT >= 9)
				{
					activityOrientationMode = 6;
				}
				else
				{
					activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
				}
			}
			else if (hasPortrait)
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
			}
			else if (hasPortraitReverse && Build.VERSION.SDK_INT >= 9)
			{
				activityOrientationMode = 9;
			}
			else if (hasLandscape)
			{
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
			}
			else if (hasLandscapeReverse && Build.VERSION.SDK_INT >= 9)
			{
				activityOrientationMode = 8;
			}

			Activity activity = getWindowActivity();

			// Wait until the window activity is created before setting orientation modes.
			if (activity != null && windowActivityCreated)
			{
				if (activityOrientationMode != -1)
				{
					activity.setRequestedOrientation(activityOrientationMode);
				}
				else
				{
					activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
				}
			}
		}
		else
		{
			Activity activity = getActivity();
			if (activity != null)
			{
				if (activity instanceof TiBaseActivity)
				{
					activity.setRequestedOrientation(((TiBaseActivity)activity).getOriginalOrientationMode());
				}
			}
		}
	}

	@Kroll.method @Kroll.getProperty
	public int[] getOrientationModes()
	{
		return orientationModes;
	}

	// Expose the method and property here, instead of in KrollProxy
	@Kroll.method(name = "getActivity") @Kroll.getProperty(name = "_internalActivity")
	public ActivityProxy getActivityProxy()
	{
		return super.getActivityProxy();
	}

	@Kroll.method(name = "_getWindowActivityProxy")
	public ActivityProxy getWindowActivityProxy()
	{
		if (opened) {
			return super.getActivityProxy();
		} else {
			return null;
		}
	}

	protected abstract void handleOpen(KrollDict options);
	protected abstract void handleClose(KrollDict options);
	protected abstract Activity getWindowActivity();

	/**
	 * Sub-classes will need to call handlePostOpen after their window is visible
	 * so any pending dialogs can successfully show after the window is opened
	 */
	protected void handlePostOpen()
	{
		if (postOpenListener != null)
		{
			getMainHandler().post(new Runnable() {
				public void run() {
					postOpenListener.onPostOpen(TiWindowProxy.this);
				}
			});
		}

		if (waitingForOpen != null && waitingForOpen.get() == this)
		{
			waitingForOpen = null;
		}

		View nativeView = view.getNativeView();

		// Make sure we draw the view during the layout pass. This does not seem to cause another layout pass. We need
		// to force the view to be drawn due to TIMOB-7685
		if (nativeView != null) {
			nativeView.postInvalidate();
		}
	}

	@Kroll.method @Kroll.getProperty
	public int getOrientation()
	{
		return TiOrientationHelper.getScreenTiOrientationMode();
	}

	@Override
	public KrollProxy getParentForBubbling()
	{
		// No events bubble up to decor view.
		if (getParent() instanceof DecorViewProxy) {
			return null;
		}
		return super.getParentForBubbling();
	}
	
	@Kroll.method
	public void addSharedElement(TiViewProxy view, String transitionName) {
	    if (LOLLIPOP_OR_GREATER) {
	        TiUIView v = view.peekView();
	        if (v != null) {
	            Pair< View,String > p = new Pair<View, String>(v.getNativeView(), transitionName);
	            sharedElementPairs.add(p);
	        }
	    }
	}

	@Kroll.method
	public void removeAllSharedElements() {
	    if (LOLLIPOP_OR_GREATER) {
	        sharedElementPairs.clear();
	    }
	}

	/**
	 * Helper method to create an activity options bundle. 
	 * @param activity The activity on which options bundle should be created. 
	 * @return The Bundle or null.  
	 */
	@SuppressWarnings("unchecked")
	@Nullable
	protected Bundle createActivityOptionsBundle(Activity activity) {
	    if (hasActivityTransitions()) {
	        Bundle b = ActivityOptions.makeSceneTransitionAnimation(activity, 
	                sharedElementPairs.toArray(new Pair[sharedElementPairs.size()])).toBundle();
	        return b;
	    } else {
	        return null;
	    }
	}
	
	/** 
	 * @return true if this window has activity transitions  
	 */
	protected boolean hasActivityTransitions() {
	    final boolean animated = TiConvert.toBoolean(getProperties(), TiC.PROPERTY_ANIMATED, true);
	    return (LOLLIPOP_OR_GREATER && animated && sharedElementPairs != null && !sharedElementPairs.isEmpty());
	}
}
