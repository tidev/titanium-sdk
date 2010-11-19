/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.Date;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

@SuppressWarnings("serial")
public class KrollDate extends Date {

	protected Scriptable jsDate;
	
	public KrollDate(Scriptable jsDate) {
		this.jsDate = jsDate;
		
		long timezoneOffset = callLongMethod("getTimezoneOffset");
		long millis = callLongMethod("getTime");
		
		// Convert to GMT
		if (timezoneOffset != 0) {
			millis += timezoneOffset*60*1000;
		}
		setTime(millis);
	}
	
	protected long callLongMethod(String name) {
		return ((Number)ScriptableObject.callMethod(jsDate, name, new Object[0])).longValue();
	}
	
	public Scriptable getJSDate() {
		return jsDate;
	}
}
