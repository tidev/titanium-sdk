/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.kroll.common.Log;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.support.v4.content.LocalBroadcastManager;


public class TiActivity extends TiBaseActivity
{
	private static final String TAG = "TiActivity";
    
	private boolean appDidPause = false;
	private boolean appIsCreatingNewActivity = false;
	private BroadcastReceiver intentMessageReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			appIsCreatingNewActivity = true;
		}
	};

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		Intent intent = getIntent();
		if (intent == null) {
			return;
		}
	}

	@Override
	protected void onDestroy()
	{
		fireOnDestroy();
		super.onDestroy();
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		if (getTiApp().isRestartPending()) {
			return;
		}

		// Listen for new activities so that we can determine if onUserLeaveHint is called becouse the app will go into the background or a new activity will just be displayed.
		LocalBroadcastManager.getInstance(this.getApplicationContext()).registerReceiver(intentMessageReceiver, new IntentFilter("org.appcelerator.action.NEW_TI_ACTIVITY"));

		// If activity did pause becouse the app did go into the background, fire Ti.App resume event!
		if (isResumed && appDidPause) {
			appDidPause = false;
			TiApplication.getInstance().fireAppEvent("resume", null);
		}
	}

	@Override
	protected void onPause()
	{
		super.onPause();

		if (getTiApp().isRestartPending()) {
			return;
		}

		// Activity paused, no need to listen until resumed.
		LocalBroadcastManager.getInstance(this.getApplicationContext()).unregisterReceiver(intentMessageReceiver);
		appIsCreatingNewActivity = false;
	}

	@Override
	protected void onUserLeaveHint()
	{
		super.onUserLeaveHint();

		Log.d(TAG, "Activity " + this + " onUserLeaveHint", Log.DEBUG_MODE);

		// If the app isn't creating a new activity, then the app will go into the background, fire Ti.App pause event!
		if (!appIsCreatingNewActivity && !appDidPause) {
			TiApplication.getInstance().fireAppEvent("pause", null);
			appDidPause = true;
		}
	}
}
