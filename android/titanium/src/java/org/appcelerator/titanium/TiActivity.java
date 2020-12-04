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
		// Destroy this activity if no window proxy is assigned to it or root activity hasn't been created yet.
		// Can happen when:
		// 1) Was started externally via startActivity(TiActivity) instead of by Titanium.
		// 2) If app was force-quit and OS is restoring app's activities backwards from top to bottom.
		//    In this case, destroy all child activities until we reach TiRootActivity to startup JS runtime normally.
		int windowId = getIntentInt(TiC.INTENT_PROPERTY_WINDOW_ID, TiActivityWindows.INVALID_WINDOW_ID);
		if (!TiActivityWindows.hasWindow(windowId) || !TiRootActivity.isTaskRunning()) {
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
