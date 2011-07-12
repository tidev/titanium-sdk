/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.proxy;

import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiOrientationHelper;
import org.appcelerator.titanium.util.TiPropertyResolver;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Message;

@Kroll.proxy(propertyAccessors={"title"})
public abstract class TiWindowProxy extends TiViewProxy
{
	private static final String LCAT = "TiWindowProxy";
	private static final boolean DBG = TiConfig.LOGD;
	
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	private static final int MSG_OPEN = MSG_FIRST_ID + 100;
	private static final int MSG_CLOSE = MSG_FIRST_ID + 101;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private static final String[] NEW_ACTIVITY_REQUIRED_KEYS = {
		TiC.PROPERTY_FULLSCREEN, TiC.PROPERTY_NAV_BAR_HIDDEN,
		TiC.PROPERTY_MODAL, TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE
	};
	private static WeakReference<TiWindowProxy> waitingForOpen;

	protected boolean opened, opening;
	protected boolean focused;
	protected boolean fullscreen;
	protected boolean modal;
	protected boolean restoreFullscreen;
	protected int[] orientationModes = new int[0];
	protected TiViewProxy tabGroup;
	protected TiViewProxy tab;
	protected boolean inTab;
	protected PostOpenListener postOpenListener;


	public static interface PostOpenListener
	{
		public void onPostOpen(TiWindowProxy window);
	}

	public static TiWindowProxy getWaitingForOpen()
	{
		if (waitingForOpen == null) return null;
		return waitingForOpen.get();
	}

	public TiWindowProxy(TiContext tiContext)
	{
		super(tiContext);
		inTab = false;
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

	public boolean requiresNewActivity(KrollDict extraOptions)
	{
		TiPropertyResolver resolver = new TiPropertyResolver(getProperties(), extraOptions);
		return resolver.hasAnyOf(NEW_ACTIVITY_REQUIRED_KEYS);
	}

	@Kroll.method
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
			} else if (arg instanceof TiAnimation) {
				options = new KrollDict();
				options.put("_anim", animation);
			}
		}

		if (getTiContext().isUIThread()) {
			handleOpen(options);
			return;
		}
		sendBlockingUiMessage(MSG_OPEN, options);
		opening = false;
	}

	@Kroll.method
	public void close(@Kroll.argument(optional = true) Object arg)
	{
		if (!opened) { return; }

		KrollDict options = null;
		TiAnimation animation = null;

		if (arg != null) {
			if (arg instanceof KrollDict) {
				options = (KrollDict) arg;
			} else if (arg instanceof TiAnimation) {
				options = new KrollDict();
				options.put("_anim", animation);
			}
		}

		if (getTiContext().isUIThread()) {
			handleClose(options);
			return;
		}

		sendBlockingUiMessage(MSG_CLOSE, options);
	}

	public void closeFromActivity()
	{
		if (!opened) { return; }
		releaseViews();
		opened = false;
		TiContext context = getTiContext();
		if (creatingContext != null && context != null && !creatingContext.equals(context)) {
			switchToCreatingContext();
		}
	}

	public void setTabProxy(TiViewProxy tabProxy)
	{
		this.tab = tabProxy;
	}

	public TiViewProxy getTabProxy()
	{
		return this.tab;
	}

	public void setTabGroupProxy(TiViewProxy tabGroupProxy)
	{
		this.tabGroup = tabGroupProxy;
	}

	public TiViewProxy getTabGroupProxy()
	{
		return this.tabGroup;
	}

	public void setPostOpenListener(PostOpenListener listener)
	{
		this.postOpenListener = listener;
	}

	@Kroll.method
	public void hideTabBar()
	{
		// iPhone only right now.
	}

	public KrollDict handleToImage()
	{
		return TiUIHelper.viewToImage(getTiContext(), properties, getTiContext().getActivity().getWindow().getDecorView());
	}

	// only exists to expose a way for the activity to update the orientation based on
	// the modes already set on the window
	public void updateOrientation()
	{
		setOrientationModes (orientationModes);
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

		// look through modes and determine what has been set
		for (int i = 0; i < modes.length; i++)
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
		else if (hasLandscape)
		{
			activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
		}

		if (activityOrientationMode != -1)
		{
			Activity activity = getTiContext().getActivity();
			if (activity != null)
			{
				activity.setRequestedOrientation (activityOrientationMode);
			}
		}
	}

	@Kroll.method @Kroll.getProperty
	public int[] getOrientationModes()
	{
		return orientationModes;
	}

	@Kroll.method @Kroll.getProperty
	public ActivityProxy getActivity(KrollInvocation invocation)
	{
		return getActivity(invocation.getTiContext());
	}

	public ActivityProxy getActivity(TiContext tiContext)
	{
		Object activityObject = getProperty(TiC.PROPERTY_ACTIVITY);
		ActivityProxy activityProxy = null;
		if (activityObject == null) {
			activityProxy = new ActivityProxy(tiContext);
			setProperty(TiC.PROPERTY_ACTIVITY, activityProxy);
		} else if (activityObject instanceof KrollDict) {
			KrollDict options = (KrollDict) activityObject;
			activityProxy = new ActivityProxy(tiContext);
			activityProxy.handleCreationDict(options);
			setProperty(TiC.PROPERTY_ACTIVITY, activityProxy);
		} else if (activityObject instanceof ActivityProxy) {
			activityProxy = (ActivityProxy) activityObject;
		}
		return activityProxy;
	}

	protected abstract void handleOpen(KrollDict options);
	protected abstract void handleClose(KrollDict options);
	protected abstract Activity handleGetActivity();

	/**
	 * Sub-classes will need to call handlePostOpen after their window is visible
	 * so any pending dialogs can succesfully show after the window is opened
	 */
	protected void handlePostOpen()
	{
		if (postOpenListener != null)
		{
			getUIHandler().post(new Runnable() {
				public void run() {
					postOpenListener.onPostOpen(TiWindowProxy.this);
				}
			});
		}

		if (waitingForOpen != null && waitingForOpen.get() == this)
		{
			waitingForOpen = null;
		}
	}
}
