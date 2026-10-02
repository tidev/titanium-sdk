/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

/**
 * A replacement class for org.appcelerator.titanium.config.TitaniumConfig so that I can change
 * settings via tiapp.xml
 *
 * @author Don Thorp
 *
 */
public class TiConfig
{
	/**
	* Whether or not debug logging has been enabled by the Titanium application. This is normally set in the application's <code>tiapp.xml</code> with the
	* <code>ti.android.debug</code> property:
	* <pre>
	* &lt;property name="ti.android.debug" type="bool"&gt;true&lt;/property&gt;
	* </pre>
	*/
	public static boolean LOGD = false;
	public static boolean LOGV = false;
	public static boolean DEBUG = false;
	public static boolean RELEASE = true;
	public static boolean PROFILE = false;
}
