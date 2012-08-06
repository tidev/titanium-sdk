/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.analytics;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.json.JSONException;
import org.json.JSONObject;

//All event payloads MUST have the following key/value pairs at the root of the
//JSON object:
//
//- id       	-- the globally unique event ID (string)
//- seq     	-- a monotonically incrementing event sequence number (long)
//- aguid     	-- the application GUID (string)
//- mid       	-- the phone's unique device id (string)
//- ts 		-- the event timestamp in UTC (string)  -- example: 2009-06-15T21:46:28.685+0000
//- ver   	-- the version of the specification (string)
//- sid     	-- the session id (created once per application start/stop) (string)
//- name     	-- the name of the event (string)
//- data		-- the event data (NULL value if none provided) (object)

/**
 * This is the parent class of all Titanium analytics events.
 */
public class TiAnalyticsEvent
{
	private static final String TAG = "TitaniumAnalyticsEvent";

	private static TimeZone utc = TimeZone.getTimeZone("UTC");
	private static SimpleDateFormat isoDateFormatter =
		new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
	static {
		// Workaround for setting the timezone since there is a bug in android 2.2 and earlier
		// http://code.google.com/p/android/issues/detail?id=8258
		isoDateFormatter.setCalendar(Calendar.getInstance(utc));
	}

	private String eventType;
	private String eventEvent;
	private String eventTimestamp;
	private String eventMid;
	private String eventSid;
	private String eventPayload;
	private String eventAppGuid;

	private boolean expandPayload;

	/**
	 * Constructs an analytics event.
	 * @param eventType the analytics event type.
	 * @param eventEvent the analytics event.
	 * @param eventPayload the analytics payload.
	 */
	TiAnalyticsEvent(String eventType, String eventEvent, String eventPayload) {
		try {
			JSONObject o = new JSONObject();
			o.put("value", eventPayload);
			init(eventType, eventEvent, o);
		} catch (JSONException e) {
			Log.e(TAG, "Error packaging string.", e);
			init(eventType, eventEvent, new JSONObject());
		}
	}

	TiAnalyticsEvent(String eventType, String eventEvent, JSONObject eventPayload) {
		init(eventType, eventEvent, eventPayload);
	}

	private void init(String eventType, String eventEvent, JSONObject eventPayload) {
		this.eventType = eventType;
		this.eventEvent = eventEvent;
		this.eventTimestamp = getTimestamp();
		this.eventMid = TiPlatformHelper.getMobileId();
		this.eventSid = TiPlatformHelper.getSessionId();
		this.eventAppGuid = TiPlatformHelper.getAppInfo().getGUID();
		this.eventPayload = eventPayload.toString();
		this.expandPayload = true;
	}

	public String getEventType() {
		return eventType;
	}

	public String getEventEvent() {
		return eventEvent;
	}

	public String getEventTimestamp() {
		return eventTimestamp;
	}

	public String getEventMid() {
		return eventMid;
	}

	public String getEventSid() {
		return eventSid;
	}

	public String getEventAppGuid() {
		return eventAppGuid;
	}

	public String getEventPayload() {
		return eventPayload;
	}

	public boolean mustExpandPayload() {
		return expandPayload;
	}

	public static String getTimestamp() {
		return isoDateFormatter.format(new Date());
	}
}
