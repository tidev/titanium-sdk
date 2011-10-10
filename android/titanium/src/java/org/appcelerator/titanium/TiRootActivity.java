/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiRHelper;

import android.content.res.Configuration;
import android.graphics.drawable.Drawable;
import android.os.Bundle;

public class TiRootActivity extends TiLaunchActivity
	implements TiActivitySupport
{
	private static final String LCAT = "TiRootActivity";
	private static final boolean DBG = TiConfig.LOGD;

	@Override
	public String getUrl()
	{
		return "app.js";
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		getTiApp().setCurrentActivity(this, this);

		Log.checkpoint(LCAT, "checkpoint, on root activity create, savedInstanceState: " + savedInstanceState);

		TiApplication app = getTiApp();
		app.setRootActivity(this);

		super.onCreate(savedInstanceState);
	}

	@Override
	protected void windowCreated()
	{
		// Use settings from tiapp.xml
		ITiAppInfo appInfo = getTiApp().getAppInfo();
		getIntent().putExtra(TiC.PROPERTY_FULLSCREEN, appInfo.isFullscreen());
		getIntent().putExtra(TiC.PROPERTY_NAV_BAR_HIDDEN, appInfo.isNavBarHidden());
		super.windowCreated();
	}

	// Lifecyle

	@Override
	protected void onResume()
	{
		Log.checkpoint(LCAT, "checkpoint, on root activity resume. activity = " + this);
		super.onResume();
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);
		try {
			int backgroundId = TiRHelper.getResource("drawable.background");
			if (backgroundId != 0) {
				Drawable d = this.getResources().getDrawable(backgroundId);
				if (d != null) {
					Drawable bg = getWindow().getDecorView().getBackground();
					getWindow().setBackgroundDrawable(d);
					bg.setCallback(null);
				}
			}
		} catch (Exception e) {
			Log.e(LCAT, "Resource not found 'drawable.background': " + e.getMessage());
		}
	}

	@Override
	protected void onDestroy()
	{
		super.onDestroy();
		if (DBG) {
			Log.d(LCAT, "root activity onDestroy, activity = " + this);
		}
		/*
		if (tiContext != null) {
			TiApplication app = tiContext.getTiApp();
			if (app != null) {
				app.releaseModules();
			}
			tiContext.release();
		}
		*/
		TiFastDev.onDestroy();
	}

	/*
	public TiContext getTiContext()
	{
		return tiContext;
	}
	*/
}
