/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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

	private static KrollLogging instance = new KrollLogging("TiAPI");

	private String tag;
	private LogListener listener;

	public static KrollLogging getDefault()
	{
		return instance;
	}

	public static void logWithDefaultLogger(int severity, String msg)
	{
		getDefault().internalLog(severity, msg);
	}

	public interface LogListener
	{
		public void onLog(int severity, String msg);
	}

	private KrollLogging(String tag)
	{
		this.tag = tag;
	}

	public void setLogListener(LogListener listener)
	{
		this.listener = listener;
	}
	
	public void debug(String... args)
	{
		internalLog(DEBUG, combineLogMessages(args));
	}

	public void info(String... args)
	{
		internalLog(INFO, combineLogMessages(args));
	}

	public void warn(String... args)
	{
		internalLog(WARN, combineLogMessages(args));
	}

	public void error(String... args)
	{
		internalLog(ERROR, combineLogMessages(args));
	}

	public void trace(String... args)
	{
		internalLog(TRACE, combineLogMessages(args));
	}

	public void notice(String... args)
	{
		internalLog(NOTICE, combineLogMessages(args));
	}

	public void critical(String... args)
	{
		internalLog(CRITICAL, combineLogMessages(args));
	}

	public void fatal(String... args)
	{
		internalLog(FATAL, combineLogMessages(args));
	}

	public void log(String level, String... args)
	{
		String ulevel = level.toUpperCase();
		String msg = combineLogMessages(args);
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

	private String combineLogMessages(String... args)
	{
		String msg;
		int length = (args == null ? 0 : args.length);

		if (length > 0) {
			msg = args[0];
		} else {
			msg = new String();
		}

		for (int i = 1; i < length; i++) {
			msg = msg.concat(String.format(" %s", args[i]));
		}
		return msg;
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
