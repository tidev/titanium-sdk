/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.Date;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

@SuppressWarnings("serial")
public class KrollDate extends Date
{
	protected Scriptable jsDate;

	public KrollDate(Scriptable jsDate)
	{
		this.jsDate = jsDate;
		
		long millis = callLongMethod("getTime");//Already in UTC
		
		setTime(millis);
	}

	protected long callLongMethod(String name)
	{
		return ((Number)ScriptableObject.callMethod(jsDate, name, new Object[0])).longValue();
	}

	public Scriptable getJSDate()
	{
		return jsDate;
	}
}
