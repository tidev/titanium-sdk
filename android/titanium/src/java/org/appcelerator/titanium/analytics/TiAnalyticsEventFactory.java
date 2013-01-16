/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.analytics;

import java.util.GregorianCalendar;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiDatabaseHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.location.Location;

public class TiAnalyticsEventFactory
{
	private static final String TAG = "TiAnalyticsEventFactory";

	public static final String EVENT_APP_ENROLL = "ti.enroll";
	public static final String EVENT_APP_START = "ti.start";
	public static final String EVENT_APP_END = "ti.end";
	public static final String EVENT_ERROR = "ti.crash";
	public static final String EVENT_APP_GEO = "ti.geo";

	public static final long MAX_GEO_ANALYTICS_FREQUENCY = 60000L;

	protected static Location lastLocation;

//	1. Application Enrollment
//
//	Description:
//
//	The first time an application is started, the following event MUST be sent
//	before any other events.  This event is used to indicate the first start/install of
//	an application. This event SHOULD NOT be delayed if possible.
//
//	Event name:
//
//	ti.enroll
//
//	Event data:
//
//	- mac_addr		-- mac address (string)
//	- app_name		-- name of the application (string)
//	- oscpu			-- os cpu count (integer)
//	- platform		-- Titanium platform (string)
//	- app_id		-- application id (string)
//	- ostype		-- os type (string)
//	- osarch		-- os architecture (string)
//	- model			-- model of the phone (string)
//  - deploytype    -- deployment type [development|test|production]

	public static TiAnalyticsEvent createAppEnrollEvent(TiApplication tiApp, String deployType)
	{
		TiAnalyticsEvent event = null;
		JSONObject json;
		TiDatabaseHelper db = new TiDatabaseHelper(tiApp);

		try {
			json = new JSONObject();
			json.put("mac_addr", TiPlatformHelper.getMacaddress());
			json.put("app_name", tiApp.getAppInfo().getName());
			json.put("oscpu", TiPlatformHelper.getProcessorCount());
			json.put("platform", TiPlatformHelper.getName());
			json.put("app_id", tiApp.getAppInfo().getId());
			json.put("ostype", TiPlatformHelper.getOstype());
			json.put("osarch", TiPlatformHelper.getArchitecture());
			json.put("model", TiPlatformHelper.getModel());
			json.put("previous_mid", db.getPlatformParam("previous_machine_id", "notfound"));
			json.put("deploytype", deployType);

			event = new TiAnalyticsEvent(EVENT_APP_ENROLL, EVENT_APP_ENROLL, json);
		} catch (JSONException e) {
			Log.e(TAG, "Unable to encode start event", e);
			event = null;
		}

		return event;
	}

//	2. Application Start
//
//	Description:
//
//	Each time an application starts, the following event MUST be sent.
//
//	Event name:
//
//	ti.start
//
//	Event data:
//
//	- tz 			-- timezone offset (integer)
//	- deploytype		-- development, production, test (string) x
//	- os			-- name of the os (string) x
//	- osver			-- version of the os (string)
//	- version		-- titanium version (string) x
//	- un			-- username (string)
//	- app_version		-- version of the application (string)
//	- nettype		-- network type (string)
//

	public static TiAnalyticsEvent createAppStartEvent(TiApplication application, String deployType
		)
	{
		TiAnalyticsEvent event = null;

		JSONObject json;

		try {
			json = new JSONObject();
			json.put("tz",GregorianCalendar.getInstance().getTimeZone().getRawOffset()/60000);
			json.put("deploytype", deployType);
			json.put("platform", TiPlatformHelper.getName());
			json.put("os", TiPlatformHelper.getOS());
			json.put("osver", TiPlatformHelper.getVersion());
			json.put("version", application.getTiBuildVersion());
			json.put("model", TiPlatformHelper.getModel());
			json.put("app_version", application.getAppInfo().getVersion());
			json.put("nettype", TiPlatformHelper.getNetworkTypeName());

			event = new TiAnalyticsEvent(EVENT_APP_START, EVENT_APP_START, json);
		} catch (JSONException e) {
			Log.e(TAG, "Unable to encode start event", e);
			event = null;
		}

		return event;
	}

//	3. Application Terminate
//
//	Description:
//
//	Each time an application terminates, the following event SHOULD be sent.
//
//	Event name:
//
//	ti.end
//
//	Event data:
//
//	None

	public static TiAnalyticsEvent createAppEndEvent()
	{
		return new TiAnalyticsEvent(EVENT_APP_END, EVENT_APP_END, "");
	}

//	4. Application Crash Detected
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

	public static TiAnalyticsEvent createErrorEvent(Thread t, Throwable err, String tiVersionInfo)
	{
		TiAnalyticsEvent event = null;

		StringBuilder sb = new StringBuilder(1024);
		sb
			.append("thread_name").append(t.getName()).append("\n")
			.append("thread_id").append(t.getId()).append("\n")
			.append("error_msg").append(err.toString()).append("\n")
			.append("ti_version").append(tiVersionInfo).append("\n")
			.append("<<<<<<<<<<<<<<< STACK TRACE >>>>>>>>>>>>>>>").append("\n")
			;

		StackTraceElement[] elements = err.getStackTrace();
		int len = elements.length;

		for (int i=0; i < len; i++) {
			sb.append(elements[i].toString()).append("\n");
		}

		event = new TiAnalyticsEvent(EVENT_ERROR, EVENT_ERROR, sb.toString());
		sb.setLength(0);
		sb = null;

		return event;
	}

//	5. Application Geo
//
//	Description:
//
//	When an application geo result is received, the following event SHOULD be
//	sent.  To optimize data delivery, this event SHOULD not be sent more than
//	once per minute.  This event MUST only be sent on the successful result of a geo
//	location and MUST not artificially be triggered by the application
//	(to prevent an unnecessary permission request). In the event of a GEO error, no
//	event is recorded.
//
//	Event name:
//
//	ti.geo
//
//	Event data:
//
//	from:
//	- latitude		-- latitude in degrees (double)
//	- longitude		-- longitude in degrees (double)
//	- altitude		-- height in meters	(double)
//	- accuracy		-- accuracy in meters horizontal (double)
//	- altitudeAccuracy	-- accuracy in meters vertical (double)
//	- heading               -- the course (double)
//	- speed                 -- the speed (double)
//	- timestamp             -- timestamp reference (long)
//
//	to:
//	- latitude		-- latitude in degrees (double)
//	- longitude		-- longitude in degrees (double)
//	- altitude		-- height in meters	(double)
//	- accuracy		-- accuracy in meters (double)
//	- altitudeAccuracy	-- accuracy in meters vertical (double)
//	- heading               -- the course (double)
//	- speed                 -- the speed (double)
//	- timestamp             -- timestamp reference (long)

	public static TiAnalyticsEvent createAppGeoEvent(Location location)
	{
		TiAnalyticsEvent result = null;
		if (lastLocation == null || (location.getTime() - lastLocation.getTime() > MAX_GEO_ANALYTICS_FREQUENCY))
		{
			try {
				JSONObject wrapper = new JSONObject();

				wrapper.put("to", locationToJSONObject(location));
				if (lastLocation != null) {
					wrapper.put("from", locationToJSONObject(lastLocation));
				} else {
					wrapper.put("from", null);
				}

				result = new TiAnalyticsEvent(EVENT_APP_GEO, EVENT_APP_GEO, wrapper);
				lastLocation = location;
			} catch (JSONException e) {
				Log.e(TAG, "Error building ti.geo event", e);
			}
		}
		return result;
	}

	protected static JSONObject locationToJSONObject(Location loc) throws JSONException
	{
		JSONObject result = new JSONObject();

		result.put("latitude", loc.getLatitude());
		result.put("longitude", loc.getLongitude());
		result.put("altitude", loc.getAltitude());
		result.put("accuracy", loc.getAccuracy());
		result.put("altitudeAccuracy", null); // Not provided
		result.put("heading", loc.getBearing());
		result.put("speed", loc.getSpeed());
		result.put("timestamp", loc.getTime());

		return result;
	}

//	User defined Events
//	-------------------
//
//	Description:
//
//	Developers can provide their own application specific events.
//
//	Event name:
//
//	ti.user
//
//	Event data:
//
//	- name			-- name of the event
//	- data			-- data provided by the user (or NULL if not provided)

	public static TiAnalyticsEvent createEvent(String type, String event, String data) {
		try {
			JSONObject o = new JSONObject(data);
			return new TiAnalyticsEvent(type, event, o);
		} catch (JSONException e) {
			Log.w(TAG, "Data object for event was not JSON, sending as string");
			return new TiAnalyticsEvent(type, event, data);
		}
	}
}
