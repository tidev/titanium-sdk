/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.kroll.common;

import android.util.Config;

/**
 * A replacement class for org.appcelerator.titanium.config.TitaniumConfig so that I can change
 * settings via tiapp.xml
 *
 * @author Don Thorp
 *
 */
public class TiConfig
{
	public static boolean LOGD = Config.DEBUG;
	public static boolean LOGV = Config.DEBUG;
	public static boolean DEBUG = Config.DEBUG;
	public static boolean RELEASE = !Config.DEBUG;
	public static boolean PROFILE = Config.PROFILE;
}
