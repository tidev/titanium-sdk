/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.analytics;

import java.util.GregorianCalendar;

import org.appcelerator.titanium.api.ITitaniumApp;
import org.appcelerator.titanium.api.ITitaniumNetwork;
import org.appcelerator.titanium.api.ITitaniumPlatform;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

public class TitaniumAnalyticsEventFactory
{
	private static final String LCAT = "TiAnalyticsEventFactory";

	public static final String EVENT_APP_ENROLL = "ti.enroll";
	public static final String EVENT_APP_START = "ti.start";
	public static final String EVENT_APP_END = "ti.end";
	public static final String EVENT_ERROR = "ti.crash";
	public static final String EVENT_APP_GEO = "ti.geo";

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
//	- phonenumber		-- phone number of the phone (string)
//	- model			-- model of the phone (string)

	public static TitaniumAnalyticsEvent createAppEnrollEvent(ITitaniumPlatform platform, ITitaniumApp application)
	{
		TitaniumAnalyticsEvent event = null;

		JSONObject json;

		try {
			json = new JSONObject();
			json.put("mac_addr", platform.getMacAddress());
			json.put("app_name", application.getModuleName());
			json.put("oscpu", platform.getProcessorCount());
			json.put("platform", "android");
			json.put("app_id", application.getID());
			json.put("ostype", platform.getOsType());
			json.put("osarch", platform.getArchitecture());
			json.put("phonenumber", platform.getPhoneNumber());
			json.put("model", platform.getModel());

			event = new TitaniumAnalyticsEvent(EVENT_APP_ENROLL, json);
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to encode start event", e);
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

	public static TitaniumAnalyticsEvent createAppStartEvent( ITitaniumNetwork network,
			ITitaniumPlatform platform, ITitaniumApp application, String deployType
		)
	{
		TitaniumAnalyticsEvent event = null;

		JSONObject json;

		try {
			json = new JSONObject();
			json.put("tz",GregorianCalendar.getInstance().getTimeZone().getRawOffset()/3600000);
			json.put("deploytype", deployType);
			json.put("os", platform.getModel());
			json.put("osver", platform.getVersion());
			json.put("version", application.getSystemProperties().getString("ti.version", "0.0.0"));
			json.put("un", platform.getUsername());
			json.put("app_version", application.getVersion());
			json.put("nettype", network.getNetworkTypeName());

			event = new TitaniumAnalyticsEvent(EVENT_APP_START, json);
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to encode start event", e);
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

	public static TitaniumAnalyticsEvent createAppEndEvent()
	{
		return new TitaniumAnalyticsEvent(EVENT_APP_END, "");
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

	public static TitaniumAnalyticsEvent createErrorEvent(Thread t, Throwable err)
	{
		TitaniumAnalyticsEvent event = null;

		StringBuilder sb = new StringBuilder(1024);
		sb
			.append("thread_name").append(t.getName()).append("\n")
			.append("thread_id").append(t.getId()).append("\n")
			.append("error_msg").append(err.toString()).append("\n")
			.append("<<<<<<<<<<<<<<< STACK TRACE >>>>>>>>>>>>>>>").append("\n")
			;

		StackTraceElement[] elements = err.getStackTrace();
		int len = elements.length;

		for (int i=0; i < len; i++) {
			sb.append(elements[i].toString()).append("\n");
		}

		event = new TitaniumAnalyticsEvent(EVENT_ERROR, sb.toString());
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

	public static TitaniumAnalyticsEvent createAppGeoEvent() {
		return null;
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

	public static TitaniumAnalyticsEvent createEvent(String eventName, String data) {
		return new TitaniumAnalyticsEvent(eventName, data);
	}
}
