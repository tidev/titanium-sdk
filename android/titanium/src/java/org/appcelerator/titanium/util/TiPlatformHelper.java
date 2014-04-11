/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.reflect.Method;
import java.util.Currency;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.StringTokenizer;

import org.appcelerator.analytics.ACSAnalyticsEvent;
import org.appcelerator.analytics.ACSAnalyticsHelper;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.net.DhcpInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.text.format.Formatter;
import android.util.DisplayMetrics;

public class TiPlatformHelper extends ACSAnalyticsHelper
{
	public static final String TAG = "TiPlatformHelper";
	private static final Map<String, Locale> locales = java.util.Collections.synchronizedMap(new HashMap<String, Locale>());
	private static final Map<Locale, String> currencyCodes = java.util.Collections
		.synchronizedMap(new HashMap<Locale, String>());
	private static final Map<Locale, String> currencySymbols = java.util.Collections
		.synchronizedMap(new HashMap<Locale, String>());
	private static final Map<String, String> currencySymbolsByCode = java.util.Collections
		.synchronizedMap(new HashMap<String, String>());

	public static float applicationScaleFactor = 1.0F;
	public static int applicationLogicalDensity = DisplayMetrics.DENSITY_MEDIUM;
	private static boolean applicationDisplayInfoInitialized = false;

	public static void initialize()
	{
		ACSAnalyticsHelper.init(TiApplication.getInstance().getAppGUID(), TiApplication.getInstance());
	}

	public static void initAnalytics()
	{
		ACSAnalyticsHelper.initAnalytics();
	}

	public static synchronized void intializeDisplayMetrics(Activity activity)
	{
		if (!applicationDisplayInfoInitialized) {
			DisplayMetrics dm = new DisplayMetrics();
			activity.getWindowManager().getDefaultDisplay().getMetrics(dm);

			// Note: this isn't public API, so there should be lots of error checking here
			try {
				Method gciMethod = Resources.class.getMethod("getCompatibilityInfo");
				Object compatInfo = gciMethod.invoke(activity.getResources());
				applicationScaleFactor = (Float) compatInfo.getClass().getField("applicationScale").get(compatInfo);
			} catch (Exception e) {
				Log.w(TAG, "Unable to get application scale factor, using reported density and its factor", Log.DEBUG_MODE);
			}

			if (applicationScaleFactor == 1.0f) {
				applicationLogicalDensity = dm.densityDpi;
			} else if (applicationScaleFactor > 1.0f) {
				applicationLogicalDensity = DisplayMetrics.DENSITY_MEDIUM;
			} else {
				applicationLogicalDensity = DisplayMetrics.DENSITY_LOW;
			}

			applicationDisplayInfoInitialized = true;
		}
	}

	public static ITiAppInfo getAppInfo()
	{
		return TiApplication.getInstance().getAppInfo();
	}

	/**
	 * The name of platform means the SDK family of Ti.mobile ('iphone' vs. 'android').
	 * The naming has a historical legacy.
	 */
	public static String getName()
	{
		return ACSAnalyticsHelper.getName();
	}

	/**
	 * The name of OS is to indicate (potential future) forks of the OS.
	 */
	public static String getOS()
	{
		return ACSAnalyticsHelper.getOS();
	}

	public static void setSdkVersion(String ver)
	{
		ACSAnalyticsHelper.setSdkVersion(ver);
	}

	public static void setAppName(String name)
	{
		ACSAnalyticsHelper.setAppName(name);
	}

	public static void setAppId(String id)
	{
		ACSAnalyticsHelper.setAppId(id);
	}

	public static void setAppVersion(String ver)
	{
		ACSAnalyticsHelper.setAppVersion(ver);
	}

	public static int getProcessorCount()
	{
		return ACSAnalyticsHelper.getProcessorCount();
	}

	public static String getUsername()
	{
		return ACSAnalyticsHelper.getUsername();
	}

	public static String getVersion()
	{
		return ACSAnalyticsHelper.getVersion();
	}

	public static double getAvailableMemory()
	{
		return ACSAnalyticsHelper.getAvailableMemory();
	}

	public static String getModel()
	{
		return ACSAnalyticsHelper.getModel();
	}

	public static String getManufacturer()
	{
		return ACSAnalyticsHelper.getManufacturer();
	}

	public static String getOstype()
	{
		return ACSAnalyticsHelper.getOstype();
	}

	public static String getMobileId()
	{
		return ACSAnalyticsHelper.getMobileId();
	}

	public static String createUUID()
	{
		return ACSAnalyticsHelper.createUUID();
	}

	public static String getSessionId()
	{
		return ACSAnalyticsHelper.getSessionId();
	}

	public static String getLocale()
	{
		return Locale.getDefault().toString().replace("_", "-");
	}

	public static void setDeployType(String type)
	{
		ACSAnalyticsHelper.setDeployType(type);
	}

	public static Locale getLocale(String localeCode)
	{
		if (localeCode == null) {
			return null;
		}
		String code = localeCode.replace('-', '_');
		if (locales.containsKey(code)) {
			return locales.get(code);
		}

		String language = "", country = "", variant = "";
		if (code.startsWith("__")) {
			// This is weird, just a variant. Whatever, give it a shot.
			StringTokenizer tokens = new StringTokenizer(code, "__");
			if (tokens.hasMoreElements()) {
				variant = tokens.nextToken();
			}
		} else if (code.startsWith("_")) {
			// No language specified, but country specified and maybe variant.
			StringTokenizer tokens = new StringTokenizer(code, "_");
			if (tokens.hasMoreElements()) {
				country = tokens.nextToken();
			}
			if (tokens.hasMoreElements()) {
				variant = tokens.nextToken();
			}
		} else if (code.contains("__")) {
			// this is language__variant
			StringTokenizer tokens = new StringTokenizer(code, "__");
			if (tokens.hasMoreElements()) {
				language = tokens.nextToken();
			}
			if (tokens.hasMoreElements()) {
				variant = tokens.nextToken();
			}
		} else {
			StringTokenizer tokens = new StringTokenizer(code, "__");
			if (tokens.hasMoreElements()) {
				language = tokens.nextToken();
			}
			if (tokens.hasMoreElements()) {
				country = tokens.nextToken();
			}
			if (tokens.hasMoreElements()) {
				variant = tokens.nextToken();
			}
		}

		Locale l = new Locale(language, country, variant);
		locales.put(code, l);
		return l;
	}

	public static String getCurrencyCode(Locale locale)
	{
		String code;
		if (currencyCodes.containsKey(locale)) {
			code = currencyCodes.get(locale);
		} else {
			code = Currency.getInstance(locale).getCurrencyCode();
			currencyCodes.put(locale, code);
		}
		return code;
	}

	public static String getCurrencySymbol(Locale locale)
	{
		String symbol;
		if (currencySymbols.containsKey(locale)) {
			symbol = currencySymbols.get(locale);
		} else {
			symbol = Currency.getInstance(locale).getSymbol(locale);
			currencySymbols.put(locale, symbol);
		}
		return symbol;
	}

	public static String getCurrencySymbol(String currencyCode)
	{
		String symbol;
		if (currencySymbolsByCode.containsKey(currencyCode)) {
			symbol = currencySymbolsByCode.get(currencyCode);
		} else {
			symbol = Currency.getInstance(currencyCode).getSymbol();
			currencySymbolsByCode.put(currencyCode, symbol);
		}
		return symbol;
	}

	public static String createEventId()
	{
		return ACSAnalyticsHelper.createEventId();
	}

	public static String getArchitecture()
	{
		return ACSAnalyticsHelper.getArchitecture();
	}

	public static String getMacaddress()
	{
		return ACSAnalyticsHelper.getMacaddress();
	}

	public static String getIpAddress()
	{
		String ipAddress = null;
		TiApplication tiApp = TiApplication.getInstance();

		if (tiApp.getRootActivity().checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
			WifiManager wifiManager = (WifiManager) tiApp.getRootActivity().getSystemService(Context.WIFI_SERVICE);
			if (wifiManager != null) {
				WifiInfo wifiInfo = wifiManager.getConnectionInfo();
				if (wifiInfo != null) {
					ipAddress = Formatter.formatIpAddress(wifiInfo.getIpAddress());
					Log.d(TAG, "Found IP address: " + ipAddress, Log.DEBUG_MODE);
				} else {
					Log.e(TAG, "Unable to access WifiInfo, failed to get IP address");
				}
			} else {
				Log.e(TAG, "Unable to access the WifiManager, failed to get IP address");
			}
		} else {
			Log.e(TAG, "Must have android.permission.ACCESS_WIFI_STATE, failed to get IP address");
		}

		return ipAddress;
	}

	public static String getNetmask()
	{
		String netmask = null;
		TiApplication tiApp = TiApplication.getInstance();

		if (tiApp.getRootActivity().checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
			WifiManager wifiManager = (WifiManager) tiApp.getRootActivity().getSystemService(Context.WIFI_SERVICE);
			if (wifiManager != null) {
				DhcpInfo dhcpInfo = wifiManager.getDhcpInfo();
				if (dhcpInfo != null) {
					netmask = Formatter.formatIpAddress(dhcpInfo.netmask);
					Log.d(TAG, "Found netmask: " + netmask, Log.DEBUG_MODE);
				} else {
					Log.e(TAG, "Unable to access DhcpInfo, failed to get netmask");
				}
			} else {
				Log.e(TAG, "Unable to access the WifiManager, failed to get netmask");
			}
		} else {
			Log.e(TAG, "Must have android.permission.ACCESS_WIFI_STATE, failed to get netmask");
		}

		return netmask;
	}

	public static String getNetworkTypeName()
	{
		return ACSAnalyticsHelper.getNetworkTypeName();
	}

	public static void postAnalyticsEvent(ACSAnalyticsEvent event)
	{
		ACSAnalyticsHelper.postAnalyticsEvent(event);
	}
	
	public static String getLastEventID()
	{
		return lastEventID;
	}
}
