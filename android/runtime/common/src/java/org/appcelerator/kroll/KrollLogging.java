/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import android.util.Log;

public class KrollLogging
{
	public static final int TRACE = 1;
	public static final int DEBUG = 2;
	public static final int INFO = 3;
	public static final int NOTICE = 4;
	public static final int WARN = 5;
	public static final int ERROR = 6;
	public static final int CRITICAL = 7;
	public static final int FATAL = 8;

	private String tag;
	private LogListener listener;

	public interface LogListener
	{
		public void onLog(int severity, String msg);
	}

	public KrollLogging(String tag)
	{
		this.tag = tag;
	}

	public void setLogListener(LogListener listener)
	{
		this.listener = listener;
	}
	
	public void debug(String msg)
	{
		internalLog(DEBUG, msg);
	}

	public void info(String msg)
	{
		internalLog(INFO, msg);
	}

	public void warn(String msg)
	{
		internalLog(WARN, msg);
	}

	public void error(String msg)
	{
		internalLog(ERROR, msg);
	}

	public void trace(String msg)
	{
		internalLog(TRACE, msg);
	}

	public void notice(String msg)
	{
		internalLog(NOTICE, msg);
	}

	public void critical(String msg)
	{
		internalLog(CRITICAL, msg);
	}

	public void fatal(String msg)
	{
		internalLog(FATAL, msg);
	}

	public void log(String level, String msg)
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

		internalLog(severity, msg);
	}

	private void internalLog(int severity, String msg)
	{
		if (severity == TRACE)
		{
			Log.v(tag,msg);
		}
		else if (severity < INFO)
		{
			Log.d(tag,msg);
		}
		else if (severity < WARN)
		{
			Log.i(tag,msg);
		}
		else if (severity == WARN)
		{
			Log.w(tag,msg);
		}
		else
		{
			Log.e(tag,msg);
		}

		if (listener != null) {
			listener.onLog(severity, msg);
		}
	}
}
