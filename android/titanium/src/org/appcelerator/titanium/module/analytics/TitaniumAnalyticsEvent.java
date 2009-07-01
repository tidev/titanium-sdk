/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.analytics;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.util.TitaniumPlatformHelper;
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

public class TitaniumAnalyticsEvent
{
	private static TimeZone utc = TimeZone.getTimeZone("utc");
	private static SimpleDateFormat isoDateFormatter =
		new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
	static {
		isoDateFormatter.setTimeZone(utc);
	}

	private String eventName;
	private String eventTimestamp;
	private String eventMid;
	private String eventSid;
	private String eventAppId;
	private String eventPayload;

	private boolean expandPayload;

	TitaniumAnalyticsEvent(String eventName, String eventPayload, boolean expandPayload) {
		this.eventName = eventName;
		this.eventTimestamp = getTimestamp();
		this.eventMid = TitaniumPlatformHelper.getMobileId();
		this.eventSid = TitaniumPlatformHelper.getSessionId();
		this.eventAppId = TitaniumApplication.getInstance().getAppInfo().getAppId();
		this.eventPayload = eventPayload;
		this.expandPayload = expandPayload;
	}

	TitaniumAnalyticsEvent(String eventName, String eventPayload) {
		this(eventName, eventPayload, false);
	}

	TitaniumAnalyticsEvent(String eventName, JSONObject eventPayload) {
		this(eventName, eventPayload.toString(), true);
	}

	public String getEventName() {
		return eventName;
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

	public String getEventAppId() {
		return eventAppId;
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
