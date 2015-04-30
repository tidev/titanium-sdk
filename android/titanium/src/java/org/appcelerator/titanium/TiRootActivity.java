/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.proxy.IntentProxy;

import android.app.Activity;
<<<<<<< HEAD
import android.content.Intent;
=======
>>>>>>> Work in progress, trying to make the app not restart on every intent other than LAUNCHER.
import android.content.res.Configuration;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Bundle;
import android.view.Window;
import android.content.Intent;

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
		Log.checkpoint(TAG, "TONO BAGGINS - ROOT.onCreate");
		if (willFinishFalseRootActivity(savedInstanceState)) {
			return;
		}

		if (checkInvalidLaunch(savedInstanceState)) {
			// Android bug 2373 detected and we're going to restart.
			return;
		}

		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending() || TiBaseActivity.isUnsupportedReLaunch(this, savedInstanceState)) {
			super.onCreate(savedInstanceState); // Will take care of scheduling restart and finishing.
			return;
		}

		// Do we have another activity?
		Activity tempCurrentActivity = tiApp.getCurrentActivity();
		if (tempCurrentActivity != null && !(tempCurrentActivity instanceof TiLaunchActivity)) {
			savedInstanceState = new Bundle();
			savedInstanceState.putBoolean("relaunch", true);
			Log.checkpoint(TAG, "TONO BAGGINS - I've already got a current activity, why would I make this one current?");
			tiApp.setRelaunching(true);

			// Create the intent that brings the other window back to the front.
			Intent bringToFront = new Intent(getApplicationContext(), tempCurrentActivity.getClass());
			bringToFront.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
			tempCurrentActivity.startActivity(bringToFront);
			super.onCreate(savedInstanceState);
			tiApp.setCurrentActivity(this, tempCurrentActivity);
			return;
		} else if (tiApp.isRelaunching()) {
			Log.checkpoint(TAG, "TONO BAGGINS: The app is restarting, I couldn't find another activity, count is: " + KrollRuntime.getActivityRefCount());
			finish();
			return;
		}

		tiApp.setCurrentActivity(this, this);
		tiApp.setRootActivity(this);
		Log.checkpoint(TAG, "checkpoint, on root activity create, savedInstanceState: " + savedInstanceState);

		super.onCreate(savedInstanceState);

		// Make sure we set the previous activity as current.
		tiApp.setCurrentActivity(this, tempCurrentActivity);

		if (tiApp.isRelaunching() == false) {
			tiApp.verifyCustomModules(this);
		}
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

		// Keep track of the current activity so we can bring it to front.
		TiApplication tiApp = getTiApp();
		Activity currentActivity = tiApp.getCurrentActivity();

		super.onResume();

<<<<<<< HEAD
		// Was the app re-launched from an external intent?
		if (tiApp.isRelaunchingFromRootIntent()) {
			// When this happens, we need to re-order the activity stack.
			Intent bringToFront = new Intent(getApplicationContext(), currentActivity.getClass());
			bringToFront.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
			startActivity(bringToFront);
			tiApp.setRelaunchingFromRootIntent(false);
		}
=======
		// All done with the relaunch.
		TiApplication tiApp = getTiApp();
		tiApp.setRelaunching(false);
>>>>>>> Work in progress, trying to make the app not restart on every intent other than LAUNCHER.
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
	protected void onNewIntent(Intent intent)
	{
		Log.checkpoint(TAG, "TONO BAGGINS - Got to root activity onNewIntent");
		super.onNewIntent(intent);
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
