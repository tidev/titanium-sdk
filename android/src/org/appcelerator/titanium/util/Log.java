/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

public class Log
{
	private static long lastLog = System.currentTimeMillis();
	private static long firstLog = lastLog;

	public static synchronized void checkpoint(String msg) {
		lastLog = System.currentTimeMillis();
		firstLog = lastLog;
		i("Log", msg);
	}

	public static int v(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.v(tag, msg);
	}
	public static int v(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.v(tag, msg, t);
	}

	public static int d(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.d(tag, msg);
	}
	public static int d(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.d(tag, msg, t);
	}

	public static int i(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.i(tag, msg);
	}
	public static int i(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.i(tag, msg, t);
	}

	public static int w(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.w(tag, msg);
	}
	public static int w(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.w(tag, msg, t);
	}

	public static int e(String tag, String msg) {
		msg = onThread(msg);
		return android.util.Log.e(tag, msg);
	}
	public static int e(String tag, String msg, Throwable t) {
		msg = onThread(msg);
		return android.util.Log.e(tag, msg, t);
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
