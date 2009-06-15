package org.appcelerator.titanium.util;

public class TitaniumJSEvent
{
	private int eventId;
	private String successListener;
	private String errorListener;

	public TitaniumJSEvent(int eventId, String successListener, String errorListener) {
		this.eventId = eventId;
		this.successListener = successListener;
		this.errorListener = errorListener;
	}

	public TitaniumJSEvent(int eventId, String successListener) {
		this(eventId, successListener, null);
	}

	public int getEventId() {
		return eventId;
	}

	public String getSuccessListener() {
		return successListener;
	}

	public String getErrorListener() {
		return errorListener;
	}
}
