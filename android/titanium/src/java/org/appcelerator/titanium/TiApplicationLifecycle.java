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
		if (activityCount == 0 && tiApp != null && tiApp.isAnalyticsEnabled()) {
			APSAnalytics.getInstance().sendAppForegroundEvent();
		}
		activityCount++;
	}

	@Override
	public void onActivityStopped(Activity activity)
	{
		if (activityCount == 1 && tiApp != null && tiApp.isAnalyticsEnabled()) {
			APSAnalytics.getInstance().sendAppBackgroundEvent();
		}
		activityCount--;
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
