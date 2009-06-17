/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

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
