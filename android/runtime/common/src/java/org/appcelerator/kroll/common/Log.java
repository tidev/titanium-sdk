/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

/**
 * API to send log output. Supported severity-levels include: 'debug', 'warn', 'info' and 'error'.
 * Refer to <a href="http://developer.android.com/reference/android/util/Log.html">Android Log documentation</a> for more information. 
 */
public class Log
{
	private static long lastLog = System.currentTimeMillis();
	private static long firstLog = lastLog;

	public static synchronized void checkpoint(String tag, String msg)
	{
		lastLog = System.currentTimeMillis();
		firstLog = lastLog;
		i(tag, msg);
	}

	// We use modes in case we want to add other modes like 'developer' in the future

	/**
	 * A constant for the release mode.  In this mode, logs are always processed. This is the default mode if none are specified.
	 * @module.api
	 */
	public static final String RELEASE_MODE = "RELEASE_MODE";
	/**
	 * A constant for debug mode. In this mode, logs are only processed when TiConfig.DEBUG is true. (TiConfig.DEBUG
	 * corresponds to the 'ti.android.debug' property set by the user)
	 * @module.api
	 */
	public static final String DEBUG_MODE = "DEBUG_MODE";

	private static final int DEBUG = 1;
	private static final int INFO = 2;
	private static final int WARN = 3;
	private static final int ERROR = 4;
	private static final int VERBOSE = 5;
	
	/**
	 * Sends a 'verbose' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int v(String tag, String msg, String mode)
	{
		return processLog(VERBOSE, tag, msg, mode);
	}

	/**
	 * Sends a 'verbose' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int v(String tag, String msg)
	{
		return v(tag, msg, RELEASE_MODE);
	}

	/**
	 * Sends a 'verbose' log message, with the thread name and time stamp pre-appended, and log the exception.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int v(String tag, String msg, Throwable t, String mode)
	{
		return processLogWithException(VERBOSE, tag, msg, t, mode);
	}

	/**
	 * Sends a 'verbose' log message, with the thread name and time stamp pre-appended, and log the exception.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int v(String tag, String msg, Throwable t)
	{
		return v(tag, msg, t, RELEASE_MODE);
	}

	/**
	 * Sends a 'debug' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int d(String tag, String msg, String mode)
	{
		return processLog(DEBUG, tag, msg, mode);
	}

	/**
	 * Sends a 'debug' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int d(String tag, String msg)
	{
		return d(tag, msg, RELEASE_MODE);
	}

	// Old debug method to support backwards compatibility.
	public static int debug(String tag, String msg)
	{
		return d(tag, msg, RELEASE_MODE);
	}

	/**
	 * Sends a 'debug' log message, with the thread name and time stamp pre-appended, and log the exception.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int d(String tag, String msg, Throwable t, String mode)
	{
		return processLogWithException(DEBUG, tag, msg, t, mode);
	}

	/**
	 * Sends a 'debug' log message, with the thread name and time stamp pre-appended, and log the exception.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int d(String tag, String msg, Throwable t)
	{
		return d(tag, msg, t, RELEASE_MODE);
	}

	/**
	 * Sends a 'info' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int i(String tag, String msg, String mode)
	{
		return processLog(INFO, tag, msg, mode);
	}

	/**
	 * Sends a 'info' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int i(String tag, String msg)
	{
		return i(tag, msg, RELEASE_MODE);
	}

	/**
	 * Sends a 'info' log message, with the thread name and time stamp pre-appended, and log the exception. 
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to idenfity the source of the message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int i(String tag, String msg, Throwable t, String mode)
	{
		return processLogWithException(INFO, tag, msg, t, mode);
	}

	/**
	 * Sends a 'info' log message, with the thread name and time stamp pre-appended, and log the exception. 
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to idenfity the source of the message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int i(String tag, String msg, Throwable t)
	{
		return i(tag, msg, t, RELEASE_MODE);
	}

	/**
	 * Sends a 'warn' log message, with the thread name and time stamp pre-appended.
	 * For example, "(main) [298, 474] hello" --> "(thread-name) [elapsed time, total time] msg".
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int w(String tag, String msg, String mode)
	{
		return processLog(WARN, tag, msg, mode);
	}
	
	/**
	 * Sends a 'warn' log message, with the thread name and time stamp pre-appended.
	 * For example, "(main) [298, 474] hello" --> "(thread-name) [elapsed time, total time] msg".
	 * This method is thread safe.
	 * @param tag  used to identify the source of the message.
	 * @param msg  the message to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int w(String tag, String msg)
	{
		return w(tag, msg, RELEASE_MODE);
	}

	/**
	 * Sends a 'warn' log message, with the thread name and time stamp pre-appended, and log the exception.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of message.
	 * @param msg  the message to log.
	 * @param t    an exception to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int w(String tag, String msg, Throwable t, String mode)
	{
		return processLogWithException(WARN, tag, msg, t, mode);
	}

	/**
	 * Sends a 'warn' log message, with the thread name and time stamp pre-appended, and log the exception.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of message.
	 * @param msg  the message to log.
	 * @param t    an exception to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int w(String tag, String msg, Throwable t)
	{
		return w(tag, msg, t, RELEASE_MODE);
	}

	/**
	 * Sends a 'error' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of message.
	 * @param msg  the message to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int e(String tag, String msg, String mode)
	{
		return processLog(ERROR, tag, msg, mode);
	}

	/**
	 * Sends a 'error' log message, with the thread name and time stamp pre-appended.
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of message.
	 * @param msg  the message to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int e(String tag, String msg)
	{
		return e(tag, msg, RELEASE_MODE);
	}

	/**
	 * Sends a 'error' log message, with the thread name and time stamp pre-appended, and log the exception
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @param mode the mode to determine whether the log should be processed
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int e(String tag, String msg, Throwable t, String mode)
	{
		return processLogWithException(ERROR, tag, msg, t, mode);
	}

	/**
	 * Sends a 'error' log message, with the thread name and time stamp pre-appended, and log the exception
	 * For more information regarding formatting, refer to {@link #w(String, String)}.
	 * This method is thread safe.
	 * @param tag  used to identify the source of message.
	 * @param msg  the message to log.
	 * @param t    the exception to log.
	 * @return     an integer that is dependent on the content and tag of the log. 
	 *             Two different msgs would have two different return values.
	 * @module.api
	 */
	public static int e(String tag, String msg, Throwable t)
	{
		return e(tag, msg, t, RELEASE_MODE);
	}

	public static boolean isDebugModeEnabled()
	{
		return TiConfig.DEBUG;
	}

	private static int processLog(int severity, String tag, String msg, String mode)
	{
		if (DEBUG_MODE.equals(mode) && !isDebugModeEnabled()) {
			return 0;
		}
		msg = onThread(msg);
		switch (severity) {
			case DEBUG:
				return android.util.Log.d(tag, msg);
			case INFO:
				return android.util.Log.i(tag, msg);
			case WARN:
				return android.util.Log.w(tag, msg);
			case VERBOSE:
				return android.util.Log.v(tag, msg);
			case ERROR:
			default:
				return android.util.Log.e(tag, msg);
		}
	}

	private static int processLogWithException(int severity, String tag, String msg, Throwable t, String mode)
	{
		if (DEBUG_MODE.equals(mode) && !isDebugModeEnabled()) {
			return 0;
		}
		msg = onThread(msg);
		switch (severity) {
			case DEBUG:
				return android.util.Log.d(tag, msg, t);
			case INFO:
				return android.util.Log.i(tag, msg, t);
			case WARN:
				return android.util.Log.w(tag, msg, t);
			case VERBOSE:
				return android.util.Log.v(tag, msg, t);
			case ERROR:
			default:
				return android.util.Log.e(tag, msg, t);
		}
	}

	private static synchronized String onThread(String msg)
	{
		long currentMillis = System.currentTimeMillis();
		long elapsed = currentMillis - lastLog;
		long total = currentMillis - firstLog;
		lastLog = currentMillis;

		StringBuilder sb = new StringBuilder(256);
		sb.append("(").append(Thread.currentThread().getName()).append(") [")
			.append(elapsed).append(",").append(total).append("] ")
			.append(msg)
		;
		String s = sb.toString();
		sb.setLength(0);
		return s;
	}
}
