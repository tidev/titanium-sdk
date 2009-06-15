package org.appcelerator.titanium.module.analytics;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

import org.appcelerator.titanium.util.TitaniumPlatformHelper;
import org.json.JSONObject;

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
	private String eventPayload;

	private boolean expandPayload;

	TitaniumAnalyticsEvent(String eventName, String eventPayload, boolean expandPayload) {
		this.eventName = eventName;
		this.eventTimestamp = getTimestamp();
		this.eventMid = TitaniumPlatformHelper.getMobileId();
		this.eventSid = TitaniumPlatformHelper.getSessionId();
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
