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
import org.appcelerator.titanium.util.TiLogger;

@Kroll.module
public class APIModule extends KrollModule
{
	private static final String LCAT = "TiAPI";

	@Kroll.constant public static final int TRACE = TiLogger.TRACE;
	@Kroll.constant public static final int DEBUG = TiLogger.DEBUG;
	@Kroll.constant public static final int INFO = TiLogger.INFO;
	@Kroll.constant public static final int NOTICE = TiLogger.NOTICE;
	@Kroll.constant public static final int WARN = TiLogger.WARN;
	@Kroll.constant public static final int ERROR = TiLogger.ERROR;
	@Kroll.constant public static final int CRITICAL = TiLogger.CRITICAL;
	@Kroll.constant public static final int FATAL = TiLogger.FATAL;

	public APIModule()
	{
		super();
	}

	public APIModule(TiContext tiContext)
	{
		this();
	}

	private TiLogger logger = new TiLogger()
	{
		public void log(int level, String message)
		{
			internalLog(level, message);
		}
	};

	public TiLogger getLogger()
	{
		return logger;
	}

	public void setLogger(TiLogger logger)
	{
		this.logger = logger;
	}

	private String toString(Object msg)
	{
		if (msg == null) {
			return "null";
		}
		return msg.toString();
	}
	
	@Kroll.method
	public void debug(Object msg)
	{
		logger.log(DEBUG, toString(msg));
	}

	@Kroll.method
	public void info(Object msg)
	{
		logger.log(INFO, toString(msg));
	}

	@Kroll.method
	public void warn(Object msg)
	{
		logger.log(WARN, toString(msg));
	}

	@Kroll.method
	public void error(Object msg)
	{
		logger.log(ERROR, toString(msg));
	}

	@Kroll.method
	public void trace(Object msg)
	{
		logger.log(TRACE, toString(msg));
	}

	@Kroll.method
	public void notice(Object msg)
	{
		logger.log(NOTICE, toString(msg));
	}

	@Kroll.method
	public void critical(Object msg)
	{
		logger.log(CRITICAL, toString(msg));
	}

	@Kroll.method
	public void fatal(Object msg)
	{
		logger.log(FATAL, toString(msg));
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

		logger.log(severity, toString(msg));
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
