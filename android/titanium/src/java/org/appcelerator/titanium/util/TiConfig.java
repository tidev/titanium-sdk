/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

/**
 * This class is deprecated, use org.appcelerator.kroll.common.TiConfig instead
 * @deprecated
 * @module.api
 */
@Deprecated
public class TiConfig
{
	public static boolean LOGD = org.appcelerator.kroll.common.TiConfig.LOGD;
	public static boolean LOGV = org.appcelerator.kroll.common.TiConfig.LOGV;
	public static boolean DEBUG = org.appcelerator.kroll.common.TiConfig.DEBUG;
	public static boolean RELEASE = org.appcelerator.kroll.common.TiConfig.RELEASE;
	public static boolean PROFILE = org.appcelerator.kroll.common.TiConfig.RELEASE;
}
