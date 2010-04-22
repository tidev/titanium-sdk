/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.api;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;

public class APIModule extends TiModule
{
	private static final String LCAT = "TiAPI";

	private static TiDict constants;

	public static final int TRACE = 1;
	public static final int DEBUG = 2;
	public static final int INFO = 3;
	public static final int NOTICE = 4;
	public static final int WARN = 5;
	public static final int ERROR = 6;
	public static final int CRITICAL = 7;
	public static final int FATAL = 8;

	public APIModule(TiContext tiContext) {
		super(tiContext);
	}


	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("TRACE", TRACE);
			constants.put("DEBUG", DEBUG);
			constants.put("INFO", INFO);
			constants.put("NOTICE", NOTICE);
			constants.put("WARN", WARN);
			constants.put("ERROR", ERROR);
			constants.put("CRITICAL", CRITICAL);
			constants.put("FATAL", FATAL);
		}

		return constants;
	}

	public void debug(Object msg) {
		Log.d(LCAT, msg.toString());
	}

	public void info(Object msg) {
		Log.i(LCAT, msg.toString());
	}

	public void warn(Object msg) {
		Log.w(LCAT, msg.toString());
	}

	public void error(Object msg) {
		Log.e(LCAT, msg.toString());
	}

	public void trace(Object msg) {
		Log.d(LCAT, msg.toString());
	}

	public void notice(Object msg) {
		Log.i(LCAT, msg.toString());
	}

	public void critical(Object msg) {
		Log.e(LCAT, msg.toString());
	}

	public void fatal(Object msg) {
		Log.e(LCAT, msg.toString());
	}

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

		internalLog(severity, msg.toString());
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
