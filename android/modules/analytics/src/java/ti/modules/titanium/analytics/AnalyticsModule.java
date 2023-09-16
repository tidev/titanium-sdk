/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.analytics;

import com.appcelerator.aps.APSAnalytics;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.json.JSONObject;

@Kroll.module
public class AnalyticsModule extends KrollModule
{
	public static final int SUCCESS = 0;
	public static final int ANALYTICS_DISABLED = -2;
	private static final String TAG = "AnalyticsModule";
	private final APSAnalytics analytics = APSAnalytics.getInstance();

	public AnalyticsModule()
	{
		super();
	}

	public static int validateJSON(JSONObject jsonObject, int level)
	{
		Log.d(TAG, "Analytics is deprecated and should be removed from the app.");
		return SUCCESS;
	}

	@Kroll.getProperty
	public boolean getOptedOut()
	{
		Log.d(TAG, "Analytics is deprecated and should be removed from the app.");
		return true;
	}

	@Kroll.setProperty
	public void setOptedOut(boolean optedOut)
	{
		Log.d(TAG, "Analytics is deprecated and should be removed from the app.");
	}

	@Kroll.method
	public void navEvent(String from, String to, @Kroll.argument(optional = true) String event,
						 @Kroll.argument(optional = true) KrollDict data)
	{
		Log.d(TAG, "Analytics is deprecated and should be removed from the app.");
	}

	@Kroll.method
	public void filterEvents(Object eventsObj)
	{
		Log.d(TAG, "Analytics is deprecated and should be removed from the app.");
	}

	@Kroll.method
	public int featureEvent(String event, @Kroll.argument(optional = true) KrollDict data)
	{
		Log.d(TAG, "Analytics is deprecated and should be removed from the app.");
		return ANALYTICS_DISABLED;
	}

	@Kroll.getProperty
	public String getLastEvent()
	{
		Log.d(TAG, "Analytics is deprecated and should be removed from the app.");
		return null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Analytics";
	}
}
