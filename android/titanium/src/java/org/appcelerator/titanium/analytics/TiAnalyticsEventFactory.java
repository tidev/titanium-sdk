/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.analytics;

import org.appcelerator.aps.analytics.APSAnalyticsEvent;
import org.appcelerator.aps.analytics.APSAnalyticsEventFactory;
import org.json.JSONException;
import org.json.JSONObject;

import android.location.Location;

public class TiAnalyticsEventFactory extends APSAnalyticsEventFactory
{
	public static final String TAG = "TiAnalyticsEventFactory";
	public static final long MAX_GEO_ANALYTICS_FREQUENCY = 60000L;
	
//  Application Crash Detected
//
//	Description:
//
//	Each time an application crash is detected, the following event SHOULD be sent.
//
//	Event name:
//
//	ti.crash
//
//	Event data:
//
//	- details		-- event details (string)

	public static APSAnalyticsEvent createErrorEvent(Thread t, Throwable err, String tiVersionInfo)
	{
		APSAnalyticsEvent event = null;

		StringBuilder sb = new StringBuilder(1024);
		sb.append("thread_name").append(t.getName()).append("\n").append("thread_id").append(t.getId()).append("\n")
			.append("error_msg").append(err.toString()).append("\n").append("ti_version").append(tiVersionInfo).append("\n")
			.append("<<<<<<<<<<<<<<< STACK TRACE >>>>>>>>>>>>>>>").append("\n");

		StackTraceElement[] elements = err.getStackTrace();
		int len = elements.length;

		for (int i = 0; i < len; i++) {
			sb.append(elements[i].toString()).append("\n");
		}

		event = new APSAnalyticsEvent(EVENT_ERROR, sb.toString());
		sb.setLength(0);
		sb = null;

		return event;
	}

	public static String locationToJSONString(Location loc)
	{
		if (loc == null) {
			return null;
		}
		try {
			JSONObject result = locationToJSONObject(loc);
			return result.toString();
		} catch (JSONException e) {
		}
		return null;
	}

	public static APSAnalyticsEvent createEvent(String eventType, String eventName, String data)
	{
		return APSAnalyticsEventFactory.createEvent(eventType, eventName, data);
	}

}
