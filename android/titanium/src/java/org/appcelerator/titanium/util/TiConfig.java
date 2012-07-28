/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.util.Config;

/**
 * This class is deprecated, use org.appcelerator.kroll.common.TiConfig instead
 */
@Deprecated
public class TiConfig
{
	public static boolean LOGD = Config.DEBUG;
	public static boolean LOGV = Config.DEBUG;
	public static boolean DEBUG = Config.DEBUG;
	public static boolean RELEASE = !Config.DEBUG;
	public static boolean PROFILE = Config.PROFILE;
}
