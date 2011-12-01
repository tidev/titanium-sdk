/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;

import android.app.Activity;

public class KrollInvocation
{
	private static final String TAG = "KrollInvocation";
	private String sourceUrl;

	public KrollInvocation(String sourceUrl)
	{
		this.sourceUrl = sourceUrl;
	}

	public Activity getActivity()
	{
		TiApplication tiApp = TiApplication.getInstance();
		if (tiApp != null) {
			return tiApp.getCurrentActivity();
		}

		Log.e(TAG, "TiApplication instance is null, unable to find valid activity");
		return null;
	}

	public TiContext getTiContext()
	{
		// TODO - not sure if this is the activity instance we need to use, revisit this
		Activity activity = getActivity();
		if (activity != null) {
			return new TiContext(activity, sourceUrl);
		}

		Log.e(TAG, "Current activity is null, unable to create TiContext");
		return null;
	}

	public String getSourceUrl()
	{
		return sourceUrl;
	}
}
