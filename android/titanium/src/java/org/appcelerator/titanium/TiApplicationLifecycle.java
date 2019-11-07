/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.common.Log;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;

import com.appcelerator.aps.APSAnalytics;

public class TiApplicationLifecycle implements Application.ActivityLifecycleCallbacks
{
	private static final String TAG = "TiApplicationLifecycle";

	private TiApplication tiApp = TiApplication.getInstance();
	private int existingActivityCount;
	private int visibleActivityCount;
	private boolean wasPaused;

	@Override
	public void onActivityCreated(Activity activity, Bundle savedInstanceState)
	{
		// Reset "wasPaused" state when creating the 1st activity in a UI task.
		// Needed to detect if the app is resuming after being paused.
		if (this.existingActivityCount <= 0) {
			this.wasPaused = false;
		}

		// Increment count of all known activities.
		this.existingActivityCount++;
	}

	@Override
	public void onActivityStarted(Activity activity)
	{
		// If no activities have been started, then app is going to be put into the foreground.
		if (this.visibleActivityCount == 0) {
			// Fire Ti.App resume events.
			// Note: The "resume" event should only be fired after a "pause" event and never on app startup.
			KrollModule appModule = this.tiApp.getModuleByName("App");
			if (appModule != null) {
				if (this.wasPaused) {
					appModule.fireEvent(TiC.EVENT_RESUME, null);
				}
				appModule.fireEvent(TiC.EVENT_RESUMED, null);
			}

			// Post analytics for this event, if enabled.
			if (this.tiApp.isAnalyticsEnabled()) {
				APSAnalytics.getInstance().sendAppForegroundEvent();
			}
		}

		// Increment number of "started" activities. These are activities that are currently in the foreground.
		// Note: Should never be more than 1, unless some of these activities are fragments.
		this.visibleActivityCount++;
	}

	@Override
	public void onActivityStopped(Activity activity)
	{
		// If this is the last activity being stopped, then the app is going to be put into the background.
		if (this.visibleActivityCount == 1) {
			// Flag that we've been paused at least once for this UI task.
			this.wasPaused = true;

			// Fire Ti.App pause events.
			KrollModule appModule = this.tiApp.getModuleByName("App");
			if (appModule != null) {
				appModule.fireEvent(TiC.EVENT_PAUSE, null);
				appModule.fireEvent(TiC.EVENT_PAUSED, null);
			}

			// Post analytics for this event, if enabled.
			if (this.tiApp.isAnalyticsEnabled()) {
				APSAnalytics.getInstance().sendAppBackgroundEvent();
			}
		}

		// Decrement count of started/visible activities.
		this.visibleActivityCount--;
		if (this.visibleActivityCount < 0) {
			this.visibleActivityCount = 0;
		}
	}

	@Override
	public void onActivityResumed(Activity activity)
	{
	}

	@Override
	public void onActivityPaused(Activity activity)
	{
	}

	@Override
	public void onActivitySaveInstanceState(Activity activity, Bundle outState)
	{
	}

	@Override
	public void onActivityDestroyed(Activity activity)
	{
		// Decrement total activity count.
		this.existingActivityCount--;
		if (this.existingActivityCount < 0) {
			this.existingActivityCount = 0;
		}
	}
}
