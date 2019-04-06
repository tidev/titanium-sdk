/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.content.Intent;
import android.os.Bundle;
import org.appcelerator.kroll.common.Log;

/** The activity that is shown when opening a Titanium "Ti.UI.Window" in JavaScript. */
public class TiActivity extends TiBaseActivity
{
	/** The default Android log tag name to be used by this class. */
	private static final String TAG = "TiActivity";

	/** Listener that detects when the root activity's onNewIntent() method has been called. */
	private TiRootActivity.OnNewIntentListener rootNewIntentListener;

	/** Set true if this activity was flagged to be destroyed by onCreate(). */
	private boolean isInvalidLaunch;

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		// Destroy this activity if it's the first one launched.
		// The "TiRootActivity" must be launched 1st to start up the JS runtime. This activity can't work by itself.
		// ---------------------------------------------------------------------------------------------------------
		// Can happen when:
		// 1) Started by another app via "startActivity(TiActivity)".
		// 2) If app was force-quit by the OS due to low memory, then on app relaunch the OS will restore last shown
		//    activities backwards, starting with last displayed top-most child activity instead of root activity.
		//    Last known parent activity won't be restored/recreated until after finishing the child activity.
		//    So, in this case, we want to keep finishing child activities until we're back to the root activity.
		// ---------------------------------------------------------------------------------------------------------
		if (TiRootActivity.isScriptRunning() == false) {
			Log.i(TAG, "Launching with '" + getClass().getName() + "' is not allowed. Closing activity.");
			this.isInvalidLaunch = true;
			activityOnCreate(savedInstanceState);
			finish();
			overridePendingTransition(android.R.anim.fade_in, 0);
			return;
		}

		super.onCreate(savedInstanceState);

		// Fetch the root activity.
		TiRootActivity rootActivity = getTiApp().getRootActivity();
		if (rootActivity != null) {
			// Start listening for onNewIntent() calls on the root activity.
			// This will copy the root activity's intent to this activity whenever it changes.
			// Note: This is legacy behavior that Titanium app developers currently depend on.
			this.rootNewIntentListener = new TiRootActivity.OnNewIntentListener() {
				@Override
				public void onNewIntent(TiRootActivity activity, Intent intent)
				{
					// This copies intent, updates proxy's "intent" property, and fires "newintent" event.
					TiActivity.this.onNewIntent(intent);
				}
			};
			rootActivity.addOnNewIntentListener(this.rootNewIntentListener);

			// Copy the root activity's intent.
			onNewIntent(rootActivity.getIntent());
		}
	}

	@Override
	protected void onDestroy()
	{
		// If activity is invalid, then it's not tied to a Titanium "Ti.UI.Window". Quickly destroy it and bail out.
		// Note: Below method calls Activity.onDestroy() directly, bypassing TiBaseActivity.onDestroy() method.
		if (this.isInvalidLaunch) {
			activityOnDestroy();
			return;
		}

		// Remove the onNewIntent() listener from the root activity.
		TiRootActivity rootActivity = getTiApp().getRootActivity();
		if (rootActivity != null) {
			rootActivity.removeOnNewIntentListener(this.rootNewIntentListener);
		}
		this.rootNewIntentListener = null;

		// Invoke the activity proxy's "onDestroy" callback.
		fireOnDestroy();

		// Destroy this activity.
		super.onDestroy();
	}
}
