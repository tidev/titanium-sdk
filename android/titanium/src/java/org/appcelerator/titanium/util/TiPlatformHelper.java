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

import com.appcelerator.aps.APSAnalyticsHelper;

@SuppressWarnings("deprecation")
public class TiPlatformHelper extends APSAnalyticsHelper
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

	private static class InstanceHolder
	{
		private static final TiPlatformHelper INSTANCE = new TiPlatformHelper();
	}

	public static final TiPlatformHelper getInstance()
	{
		return InstanceHolder.INSTANCE;
	}

	private TiPlatformHelper()
	{

	}

	public void initialize()
	{
		APSAnalyticsHelper.getInstance().init(TiApplication.getInstance().getAppGUID(), TiApplication.getInstance());
	}

	public synchronized void intializeDisplayMetrics(Activity activity)
	{
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
	}

	public ITiAppInfo getAppInfo()
	{
		return TiApplication.getInstance().getAppInfo();
	}

	public String getLocale()
	{
		return Locale.getDefault().toString().replace("_", "-");
	}

	public Locale getLocale(String localeCode)
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

	public String getCurrencyCode(Locale locale)
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

	public String getCurrencySymbol(Locale locale)
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

	public String getCurrencySymbol(String currencyCode)
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

	public String getIpAddress()
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

	public String getNetmask()
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

}