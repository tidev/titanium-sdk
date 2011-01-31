/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;

import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiBindingHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.view.ITiWindowHandler;

import android.content.res.Configuration;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;

public class TiRootActivity extends TiBaseActivity
	implements TiActivitySupport, ITiWindowHandler
{
	private static final String LCAT = "TiRootActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiContext tiContext;

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		Log.checkpoint(LCAT, "checkpoint, on root activity create, savedInstanceState: " + savedInstanceState);

		tiContext = TiContext.createTiContext(this, null);
		activityProxy = new ActivityProxy(tiContext, this);
		TiBindingHelper.bindCurrentActivity(tiContext, activityProxy);

		super.onCreate(savedInstanceState);
	}

	@Override
	protected void windowCreated()
	{
		super.windowCreated();
		TiApplication app = getTiApp();
		app.setRootActivity(this);

		setFullscreen(app.getAppInfo().isFullscreen());
		setNavBarHidden(app.getAppInfo().isNavBarHidden());
		handler.post(new Runnable() {
			public void run() {
				try {
					tiContext.evalFile("app://app.js");
					Log.i(LCAT, "finished booting app://app.js");
				} catch (IOException e) {
					Log.e(LCAT, "Error evaluating app://app.js", e);
				}
			}
		});
	}

	protected void sendMessage(final Messenger messenger, final int messageId)
	{
		final Handler fHandler = new Handler();
		fHandler.post(new Runnable() {
			@Override
			public void run() {
				try {
					Message msg = fHandler.obtainMessage(messageId, TiRootActivity.this);
					messenger.send(msg);
				} catch (RemoteException e) {
					TiRootActivity.this.finish();
				} catch (RuntimeException e) {
					TiRootActivity.this.finish();
				}
			}
		});
	}

	@Override
	public boolean hasTiContext()
	{
		return tiContext != null;
	}

	// Lifecyle
	@Override
	protected void onStart()
	{
		if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_START);
		}
		super.onStart();
	}

	@Override
	protected void onResume()
	{
		Log.checkpoint(LCAT, "checkpoint, on root activity resume. context = " + tiContext);
		if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_RESUME);
		}
		super.onResume();
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);
		try {
			int backgroundId = TiRHelper.getResource("drawable.background");
			Drawable d = this.getResources().getDrawable(backgroundId);
			if (d != null) {
				Drawable bg = getWindow().getDecorView().getBackground();
				getWindow().setBackgroundDrawable(d);
				bg.setCallback(null);
			}
		} catch (Exception e) {
			Log.e(LCAT, "Resource not found 'drawable.background': " + e.getMessage());
		}
	}

	@Override
	protected void onPause()
	{
		if (DBG) {
			Log.d(LCAT, "root activity onPause, context = " + tiContext);
		}
		if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_PAUSE);
		}
		super.onPause();
	}

	@Override
	protected void onStop()
	{
		if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_STOP);
		}
		super.onStop();
	}

	@Override
	protected void onDestroy()
	{
		super.onDestroy();
		if (DBG) {
			Log.d(LCAT, "root activity onDestroy, context = " + tiContext);
		}
		if (tiContext != null) {
			TiApplication app = tiContext.getTiApp();
			if (app != null) {
				app.releaseModules();
			}
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_DESTROY);
			tiContext.release();
		}
	}

	public TiContext getTiContext()
	{
		return tiContext;
	}
}
