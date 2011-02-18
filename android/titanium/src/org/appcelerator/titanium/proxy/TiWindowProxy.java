/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
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

	protected boolean opened, opening;
	protected boolean focused;
	protected boolean fullscreen;
	protected boolean modal;
	protected boolean restoreFullscreen;
	protected int[] orientationModes = new int[0];
	
	protected TiViewProxy tabGroup;
	protected TiViewProxy tab;
	protected boolean inTab;

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

	@Kroll.method
	public void open(@Kroll.argument(optional = true) Object arg)
	{
		if (opened || opening) { return; }

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

	@Kroll.method
	public void hideTabBar()
	{
		// iPhone only right now.
	}

	public KrollDict handleToImage()
	{
		return TiUIHelper.viewToImage(getTiContext(), properties, getTiContext().getActivity().getWindow()
			.getDecorView());
	}

	@Kroll.method @Kroll.setProperty
	public void setOrientationModes(int[] modes)
	{
		orientationModes = modes;
		Activity activity = handleGetActivity();
		if (activity instanceof TiBaseActivity) {
			TiBaseActivity tiActivity = (TiBaseActivity) activity;
			tiActivity.updateOrientation();
		}
	}

	@Kroll.method @Kroll.getProperty
	public int[] getOrientationModes()
	{
		return orientationModes;
	}

	// orientation must be Titanium orientation value
	public boolean isOrientationMode(int orientation)
	{
		if (orientationModes.length > 0) {
			for (int mode : orientationModes) {
				if (mode == orientation) {
					return true;
				}
			}
			return false;
		} else {
			return true;
		}
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
}
