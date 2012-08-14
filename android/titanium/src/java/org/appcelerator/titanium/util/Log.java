/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

/**
 * This class is deprecated, use org.appcelerator.kroll.common.Log instead
 * @deprecated
 * @module.api
 */
@Deprecated
public class Log
{
	@Deprecated
	public static void checkpoint(String tag, String msg)
	{
		org.appcelerator.kroll.common.Log.checkpoint(tag, msg);
	}

	@Deprecated
	public static int debug(String tag, String msg)
	{
		return org.appcelerator.kroll.common.Log.debug(tag, msg);
	}

	@Deprecated
	public static int v(String tag, String msg)
	{
		return org.appcelerator.kroll.common.Log.v(tag, msg);
	}

	@Deprecated
	public static int d(String tag, String msg)
	{
		return org.appcelerator.kroll.common.Log.d(tag, msg);
	}

	@Deprecated
	public static int d(String tag, String msg, Throwable t)
	{
		return org.appcelerator.kroll.common.Log.d(tag, msg, t);
	}

	@Deprecated
	public static int i(String tag, String msg)
	{
		return org.appcelerator.kroll.common.Log.i(tag, msg);
	}

	@Deprecated
	public static int i(String tag, String msg, Throwable t)
	{
		return org.appcelerator.kroll.common.Log.i(tag, msg, t);
	}

	@Deprecated
	public static int w(String tag, String msg)
	{
		return org.appcelerator.kroll.common.Log.w(tag, msg);
	}

	@Deprecated
	public static int w(String tag, String msg, Throwable t)
	{
		return org.appcelerator.kroll.common.Log.w(tag, msg, t);
	}

	@Deprecated
	public static int e(String tag, String msg)
	{
		return org.appcelerator.kroll.common.Log.e(tag, msg);
	}

	@Deprecated
	public static int e(String tag, String msg, Throwable t)
	{
		return org.appcelerator.kroll.common.Log.e(tag, msg, t);
	}
}
