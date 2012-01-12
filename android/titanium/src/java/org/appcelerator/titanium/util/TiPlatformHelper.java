/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.Currency;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.UUID;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.net.ConnectivityManager;
import android.net.DhcpInfo;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.provider.Settings;
import android.text.format.Formatter;
import android.util.DisplayMetrics;

public class TiPlatformHelper
{
	public static final String LCAT = "TiPlatformHelper";
	public static final boolean DBG = TiConfig.LOGD;
	private static final Map<String, Locale> locales = java.util.Collections.synchronizedMap(new HashMap<String, Locale>());
	private static final Map<Locale,  String> currencyCodes = java.util.Collections.synchronizedMap(new HashMap<Locale, String>());
	private static final Map<Locale,  String> currencySymbols = java.util.Collections.synchronizedMap(new HashMap<Locale, String>());
	private static final Map<String,  String> currencySymbolsByCode = java.util.Collections.synchronizedMap(new HashMap<String, String>());

	public static String platformId;
	public static String sessionId;
	public static StringBuilder sb = new StringBuilder(256);
	public static float applicationScaleFactor = 1.0F;
	public static int applicationLogicalDensity = DisplayMetrics.DENSITY_MEDIUM;
	private static boolean applicationDisplayInfoInitialized = false;

	public static void initialize() {
		TiApplication app = TiApplication.getInstance();
		// what is platform id?
		platformId = Settings.Secure.getString(app.getContentResolver(), Settings.Secure.ANDROID_ID);

		// this is a fix for the emulator only I think as a normal device should
		// never return null
		if (platformId == null) {
			Log.e(LCAT, "platformId is null, setting to empty string");
			platformId = "";
		}

		TiDatabaseHelper db = new TiDatabaseHelper(app);
		String storedMachineId = db.getPlatformParam("unique_machine_id", "");
		String hardwareMachineId = db.getPlatformParam("hardware_machine_id", "");

		// which is the value we need to be concerned with?
		String currentMachineId;
		if (!platformId.equals(hardwareMachineId)) {
			currentMachineId = platformId;
		} else {
			currentMachineId = storedMachineId;
		}

		// is the value in question valid?
		String[] badIds = {"9774d56d682e549c", "1234567890ABCDEF"};

		// load in the bad ids from tiapp.xml and insert into badIds array

		for (int i = 0; i < badIds.length; i++) {
			if (currentMachineId.equals(badIds [i])) {
				Log.e(LCAT, "renaming ID");
				currentMachineId = createUUID();
				break;
			}
		}

		// set the new value
		if (currentMachineId != storedMachineId) {
			db.updatePlatformParam("unique_machine_id", currentMachineId);
			db.updatePlatformParam("hardware_machine_id", platformId);
			db.updatePlatformParam("previous_machine_id", storedMachineId);
		}
		
		platformId = currentMachineId;
		sessionId = createUUID();
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
				applicationScaleFactor = (Float)compatInfo.getClass().getField("applicationScale").get(compatInfo);
			} catch (Exception e) {
				Log.w(LCAT, "Unable to get application scale factor, using reported density and it's factor");
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

	/*
	public static void initializeRhinoDateFormats(Context context)
	{
		// http://jira.appcelerator.org/browse/TIMOB-3742
		// toLocaleTimeString / toLocaleString don't honor the user's 24 hour setting
		if (NativeDate.localeDateFormatter != null) return;

		NativeDate.localeDateFormatter = android.text.format.DateFormat.getLongDateFormat(context);
		NativeDate.localeTimeFormatter = android.text.format.DateFormat.getTimeFormat(context);

		SimpleDateFormat timeFormat = (SimpleDateFormat)
			DateFormat.getDateTimeInstance(DateFormat.LONG, DateFormat.LONG);

		if (android.text.format.DateFormat.is24HourFormat(context)) {
			if (timeFormat != null) {
				String pattern = timeFormat.toLocalizedPattern();
				// Switch to 24 hour format: h->H, AM/PM goes away
				pattern = pattern.replaceAll("h", "H");
				pattern = pattern.replaceAll("a", "");
				timeFormat = new SimpleDateFormat(pattern, Locale.getDefault());
			}
		}

		NativeDate.localeDateTimeFormatter = timeFormat;
	}*/

	public static ITiAppInfo getAppInfo() {
		return TiApplication.getInstance().getAppInfo();
	}

	public static String getName() {
		return "android";
	}
	
	public static String getOS() {
		return "Android";
	}

	public static int getProcessorCount() {
		return Runtime.getRuntime().availableProcessors();
	}

	public static String getUsername() {
		return Build.USER;
	}

	public static String getVersion() {
		return Build.VERSION.RELEASE;
	}

	public static double getAvailableMemory() {
		return Runtime.getRuntime().freeMemory();
	}

	public static String getModel() {
		return Build.MODEL;
	}

	public static String getOstype() {
		return "32bit";
	}

	public static String getMobileId()
	{
		return platformId;
	}

	public static String createUUID() {
		return UUID.randomUUID().toString();
	}

	public static String getSessionId() {
		return sessionId;
	}

	public static String getLocale() {
		return Locale.getDefault().toString().replace("_", "-");
	}
	
	public static Locale getLocale(String localeCode)
    {
		if (localeCode == null) { return null; }
		String code = localeCode.replace('-', '_');
    	if (locales.containsKey(code)) {
    		return locales.get(code);
    	}
    	
    	String language = "", country = "", variant = "";
    	if (code.startsWith("__")) {
    		// This is weird, just a variant.  Whatever, give it a shot.
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

	public static String createEventId() {
		String s = null;
		synchronized(sb) {
			sb.append(createUUID()).append(":").append(getMobileId());
			s = sb.toString();
			sb.setLength(0); // reuse.
		}
		return s;
	}

	public static String getArchitecture() {
		String arch = "Unknown";
		try {
			BufferedReader reader = new BufferedReader(new FileReader("/proc/cpuinfo"), 8096);
			try {
				String l = null;
				while((l = reader.readLine()) != null) {
					if (l.startsWith("Processor")) {
						String[] values = l.split(":");
						arch = values[1].trim();
						break;
					}
				}
			} finally {
				reader.close();
			}

		} catch (IOException e) {
			Log.e(LCAT, "Error while trying to access processor info in /proc/cpuinfo", e);
		}

		return arch;

	}

	public static String getMacaddress() {
		String macaddr = null;
		TiApplication tiApp = TiApplication.getInstance();

		if(tiApp.getRootActivity().checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
			WifiManager wm = (WifiManager) tiApp.getRootActivity().getSystemService(Context.WIFI_SERVICE);
			if (wm != null) {
				WifiInfo wi = wm.getConnectionInfo();
				if (wi != null) {
					macaddr = wi.getMacAddress();
					if (DBG) {
						Log.d(LCAT, "Found mac address " + macaddr);
					}
				} else {
					if (DBG) {
						Log.d(LCAT, "no WifiInfo, enabling Wifi to get macaddr");
					}
					if (!wm.isWifiEnabled()) {
						if(wm.setWifiEnabled(true)) {
							if ((wi = wm.getConnectionInfo()) != null) {
								macaddr = wi.getMacAddress();
							} else {
								if (DBG) {
									Log.d(LCAT, "still no WifiInfo, assuming no macaddr");
								}
							}
							if (DBG) {
								Log.d(LCAT, "disabling wifi because we enabled it.");
							}
							wm.setWifiEnabled(false);
						} else {
							if (DBG) {
								Log.d(LCAT, "enabling wifi failed, assuming no macaddr");
							}
						}
					} else {
						if (DBG) {
							Log.d(LCAT, "wifi already enabled, assuming no macaddr");
						}
					}
				}
			}
		} else {
			Log.i(LCAT, "Must have android.permission.ACCESS_WIFI_STATE");
		}

		if (macaddr == null) {
			macaddr = getMobileId(); // just make it the unique ID if not found
 		}

		return macaddr;
	}

	public static String getIpAddress() {
		String ipAddress = null;
		TiApplication tiApp = TiApplication.getInstance();

		if(tiApp.getRootActivity().checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
			WifiManager wifiManager = (WifiManager) tiApp.getRootActivity().getSystemService(Context.WIFI_SERVICE);
			if (wifiManager != null) {
				WifiInfo wifiInfo = wifiManager.getConnectionInfo();
				if (wifiInfo != null) {
					ipAddress = Formatter.formatIpAddress(wifiInfo.getIpAddress());
					if (DBG) {
						Log.d(LCAT, "Found IP address: " + ipAddress);
					}
				} else {
					Log.e(LCAT, "Unable to access WifiInfo, failed to get IP address");
				}
			} else {
				Log.e(LCAT, "Unable to access the WifiManager, failed to get IP address");
			}
		} else {
			Log.e(LCAT, "Must have android.permission.ACCESS_WIFI_STATE, failed to get IP address");
		}

		return ipAddress;
	}

	public static String getNetmask() {
		String netmask = null;
		TiApplication tiApp = TiApplication.getInstance();

		if(tiApp.getRootActivity().checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
			WifiManager wifiManager = (WifiManager) tiApp.getRootActivity().getSystemService(Context.WIFI_SERVICE);
			if (wifiManager != null) {
				DhcpInfo dhcpInfo = wifiManager.getDhcpInfo();
				if(dhcpInfo != null) {
					netmask = Formatter.formatIpAddress(dhcpInfo.netmask);
					if (DBG) {
						Log.d(LCAT, "Found netmask: " + netmask);
					}
				} else {
					Log.e(LCAT, "Unable to access DhcpInfo, failed to get netmask");
				}
			} else {
				Log.e(LCAT, "Unable to access the WifiManager, failed to get netmask");
			}
		} else {
			Log.e(LCAT, "Must have android.permission.ACCESS_WIFI_STATE, failed to get netmask");
		}

		return netmask;
	}

	public static String getNetworkTypeName() {
		return networkTypeToTypeName(getNetworkType());
	}

	private static int getNetworkType() {
		int type = -1;

		ConnectivityManager connectivityManager = (ConnectivityManager)
			TiApplication.getInstance().getSystemService(Context.CONNECTIVITY_SERVICE);
		if (connectivityManager != null) {
			try {
				NetworkInfo ni = connectivityManager.getActiveNetworkInfo();
				if(ni != null && ni.isAvailable() && ni.isConnected()) {
					type = ni.getType();
				} else {
					type = -2 /*None*/;
				}
			} catch (SecurityException e) {
				Log.w(LCAT, "Permission has been removed. Cannot determine network type: " + e.getMessage());
			}
		}

		return type;
	}

	private static String networkTypeToTypeName(int type)
	{
		switch(type)
		{
			case -2 : return "NONE";
			case ConnectivityManager.TYPE_WIFI : return "WIFI";
			case ConnectivityManager.TYPE_MOBILE : return "MOBILE";
			case 3 : return "LAN";
			default : return "UNKNOWN";
		}
	}

}
