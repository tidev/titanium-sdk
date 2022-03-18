/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.analytics;

import com.appcelerator.aps.APSAnalytics;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
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
		return SUCCESS;
	}

	@Kroll.getProperty
	public boolean getOptedOut()
	{
		return true;
	}

	@Kroll.setProperty
	public void setOptedOut(boolean optedOut)
	{
	}

	@Kroll.method
	public void navEvent(String from, String to, @Kroll.argument(optional = true) String event,
						 @Kroll.argument(optional = true) KrollDict data)
	{
	}

	@Kroll.method
	public void filterEvents(Object eventsObj)
	{
	}

	@Kroll.method
	public int featureEvent(String event, @Kroll.argument(optional = true) KrollDict data)
	{
		return ANALYTICS_DISABLED;
	}

	@Kroll.getProperty
	public String getLastEvent()
	{
		return null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Analytics";
	}
}
