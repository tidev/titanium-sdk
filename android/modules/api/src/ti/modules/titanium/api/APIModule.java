/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.api;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

@Kroll.module
public class APIModule extends KrollModule
{
	private static final String LCAT = "TiAPI";
	
	@Kroll.constant public static final int TRACE = 1;
	@Kroll.constant public static final int DEBUG = 2;
	@Kroll.constant public static final int INFO = 3;
	@Kroll.constant public static final int NOTICE = 4;
	@Kroll.constant public static final int WARN = 5;
	@Kroll.constant public static final int ERROR = 6;
	@Kroll.constant public static final int CRITICAL = 7;
	@Kroll.constant public static final int FATAL = 8;

	public APIModule(TiContext tiContext) {
		super(tiContext);
	}

	private String toString(Object msg) {
		if (msg == null) {
			return "null";
		}
		return msg.toString();
	}
	
	@Kroll.method
	public void debug(Object msg) {
		Log.d(LCAT, toString(msg));
	}

	@Kroll.method
	public void info(Object msg) {
		Log.i(LCAT, toString(msg));
	}

	@Kroll.method
	public void warn(Object msg) {
		Log.w(LCAT, toString(msg));
	}

	@Kroll.method
	public void error(Object msg) {
		Log.e(LCAT, toString(msg));
	}

	@Kroll.method
	public void trace(Object msg) {
		Log.d(LCAT, toString(msg));
	}

	@Kroll.method
	public void notice(Object msg) {
		Log.i(LCAT, toString(msg));
	}

	@Kroll.method
	public void critical(Object msg) {
		Log.e(LCAT, toString(msg));
	}

	@Kroll.method
	public void fatal(Object msg) {
		Log.e(LCAT, toString(msg));
	}

	@Kroll.method
	public void log(String level, Object msg)
	{
		String ulevel = level.toUpperCase();
		int severity = INFO;

		if ("TRACE".equals(ulevel)) {
			severity = TRACE;
		} else if ("DEBUG".equals(ulevel)) {
			severity = DEBUG;
		} else if ("INFO".equals(ulevel)) {
			severity = INFO;
		} else if ("NOTICE".equals(ulevel)) {
			severity = NOTICE;
		} else if ("WARN".equals(ulevel)) {
			severity = WARN;
		} else if ("ERROR".equals(ulevel)) {
			severity = ERROR;
		} else if ("CRITICAL".equals(ulevel)) {
			severity = CRITICAL;
		} else if ("FATAL".equals(ulevel)) {
			severity = FATAL;
		} else {
			msg = "[" + level + "] " + msg;
		}

		internalLog(severity, toString(msg));
	}

	public void internalLog(int severity, String msg)
	{
		if (severity == TRACE)
		{
			Log.v(LCAT,msg);
		}
		else if (severity < INFO)
		{
			Log.d(LCAT,msg);
		}
		else if (severity < WARN)
		{
			Log.i(LCAT,msg);
		}
		else if (severity == WARN)
		{
			Log.w(LCAT,msg);
		}
		else
		{
			Log.e(LCAT,msg);
		}
	}
}
