/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;

import com.appcelerator.aps.APSAnalytics;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollModule;

public class TiApplicationLifecycle implements Application.ActivityLifecycleCallbacks
{
	private static final String TAG = "TiApplicationLifecycle";

	private TiApplication tiApp = TiApplication.getInstance();
	private static int activityCount = 0;

	@Override
	public void onActivityCreated(Activity activity, Bundle savedInstanceState)
	{
	}

	@Override
	public void onActivityStarted(Activity activity)
	{
		// If no activities have been started, then app is going to be put into the foreground.
		if (this.activityCount == 0) {
			// Fire Ti.App resume events.
			KrollModule appModule = this.tiApp.getModuleByName("App");
			if (appModule != null) {
				appModule.fireEvent(TiC.EVENT_RESUME, null);
				appModule.fireEvent(TiC.EVENT_RESUMED, null);
			}

			// Post analytics for this event, if enabled.
			if (this.tiApp.isAnalyticsEnabled()) {
				APSAnalytics.getInstance().sendAppForegroundEvent();
			}
		}

		// Increment number of "started" activities. These are activities that are currently in the foreground.
		// Note: Should never be more than 1, unless some of these activities are fragments.
		this.activityCount++;
	}

	@Override
	public void onActivityStopped(Activity activity)
	{
		// If this is the last activity being stopped, then the app is going to be put into the background.
		if (activityCount == 1) {
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

		// Decrement count of started activities.
		this.activityCount--;
		if (this.activityCount < 0) {
			this.activityCount = 0;
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
	}
}
