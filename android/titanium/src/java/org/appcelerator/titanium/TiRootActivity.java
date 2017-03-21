/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiRHelper;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Bundle;
import android.view.Window;

import java.util.Set;

public class TiRootActivity extends TiLaunchActivity
	implements TiActivitySupport
{
	private static final String TAG = "TiRootActivity";
	private boolean finishing = false;

	private Drawable[] backgroundLayers = {null, null};

	public void setBackgroundColor(int color)
	{
		Window window = getWindow();
		if (window == null) {
			return;
		}

		Drawable colorDrawable = new ColorDrawable(color);
		backgroundLayers[0] = colorDrawable;

		if (backgroundLayers[1] != null) {
			window.setBackgroundDrawable(new LayerDrawable(backgroundLayers));
		} else {
			window.setBackgroundDrawable(colorDrawable);
		}
	}

	public void setBackgroundImage(Drawable image)
	{
		Window window = getWindow();
		if (window == null) {
			return;
		}

		backgroundLayers[1] = image;
		if (image == null) {
			window.setBackgroundDrawable(backgroundLayers[0]);
			return;
		}

		if (backgroundLayers[0] != null) {
			window.setBackgroundDrawable(new LayerDrawable(backgroundLayers));
		} else {
			window.setBackgroundDrawable(image);
		}
	}

	@Override
	public String getUrl()
	{
		return "app.js";
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		TiApplication tiApp = getTiApp();
		Intent intent = getIntent();
		TiRootActivity rootActivity = tiApp.getRootActivity();

		if (intent != null) {
			if (rootActivity != null) {
				rootActivity.setIntent(intent);
			} else {

				// TIMOB-24497: launching as CATEGORY_HOME or CATEGORY_DEFAULT prevents intent data from
				// being passed to our resumed activity. Re-launch using CATEGORY_LAUNCHER.
				Set<String> categories = intent.getCategories();
				if (categories == null || !categories.contains(Intent.CATEGORY_LAUNCHER)) {
					finish();

					if (categories != null) {
						for (String category : categories) {
							intent.removeCategory(category);
						}
					}
					intent.addCategory(Intent.CATEGORY_LAUNCHER);
					startActivity(intent);

					restartActivity(100, 0);

					KrollRuntime.incrementActivityRefCount();
					activityOnCreate(savedInstanceState);
					return;
				}
			}

			// TIMOB-15253: implement 'singleTask' like launchMode as android:launchMode cannot be used with Titanium
			if (tiApp.intentFilterNewTask() &&
				intent.getAction() != null && intent.getAction().equals(Intent.ACTION_VIEW) &&
				intent.getDataString() != null &&
				(intent.getFlags() & Intent.FLAG_ACTIVITY_NEW_TASK) != Intent.FLAG_ACTIVITY_NEW_TASK) {

				if (rootActivity == null) {
					intent.setAction(Intent.ACTION_MAIN);
				}
				intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				startActivity(intent);
				finish();
				
				KrollRuntime.incrementActivityRefCount();
				activityOnCreate(savedInstanceState);
				return;
			}
		}

		if (willFinishFalseRootActivity(savedInstanceState)) {
			return;
		}

		if (checkInvalidLaunch(savedInstanceState)) {
			// Android bug 2373 detected and we're going to restart.
			return;
		}

		if (tiApp.isRestartPending() || TiBaseActivity.isUnsupportedReLaunch(this, savedInstanceState)) {
			super.onCreate(savedInstanceState); // Will take care of scheduling restart and finishing.
			return;
		}

		tiApp.setCurrentActivity(this, this);

		Log.checkpoint(TAG, "checkpoint, on root activity create, savedInstanceState: " + savedInstanceState);

		tiApp.setRootActivity(this);

		super.onCreate(savedInstanceState);

		tiApp.verifyCustomModules(this);
	}

	@Override
	protected void windowCreated(Bundle savedInstanceState)
	{
		// Use settings from tiapp.xml
		ITiAppInfo appInfo = getTiApp().getAppInfo();
		getIntent().putExtra(TiC.PROPERTY_FULLSCREEN, appInfo.isFullscreen());
		super.windowCreated(savedInstanceState);
	}

	@Override
	protected void onResume()
	{
		Log.checkpoint(TAG, "checkpoint, on root activity resume. activity = " + this);
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
			Log.e(TAG, "Resource not found 'drawable.background': " + e.getMessage());
		}
	}

	@Override
	protected void onDestroy()
	{
		super.onDestroy();

		if (finishing2373) {
			return;
		}

		Log.d(TAG, "root activity onDestroy, activity = " + this, Log.DEBUG_MODE);
	}

	@Override
	public void finish()
	{
		if (finishing2373) {
			super.finish();
			return;
		}

		// Ensure we only run the finish logic once. We want to avoid an infinite loop since this method can be called
		// from the finish method inside TiBaseActivity ( which can be triggered by terminateActivityStack() )
		if (!finishing) {
			finishing = true;
			TiApplication.removeFromActivityStack(this);
			TiApplication.terminateActivityStack();
			super.finish();
		}
	}

}
