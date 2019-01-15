/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.content.Intent;
import android.os.Bundle;

/** The activity that is shown when opening a Titanium "Ti.UI.Window" in JavaScript. */
public class TiActivity extends TiBaseActivity
{
	/** Listener that detects when the root activity's onNewIntent() method has been called. */
	private TiRootActivity.OnNewIntentListener rootNewIntentListener;

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
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
