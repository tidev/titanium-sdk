/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumPlatform;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumPlatformHelper;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.webkit.WebView;

public class TitaniumPlatform extends TitaniumBaseModule implements ITitaniumPlatform
{
	private static final String LCAT = "TiPlatform";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EMULATOR_PHONE_NUMBER = "650-657-5309";

	public TitaniumPlatform(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);
	}

	@Override
	public void register(WebView webView) {
		String name = super.getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumPlatform as " + name);
		}
		webView.addJavascriptInterface((ITitaniumPlatform) this, name);
	}

	public String createUUID() {
		return TitaniumPlatformHelper.createUUID();
	}

	public String getAddress() {
		return "127.0.0.1"; // for now, local IP address is meaningless for mobile
	}

	// CPU Architecture
	//TODO Cache getArchitecture
	public String getArchitecture() {
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

	public String getId() {
		return TitaniumPlatformHelper.getMobileId();
	}

	public String getMacAddress() {
		String macaddr = null;

		if(getContext().checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
			WifiManager wm = (WifiManager) getContext().getSystemService(Context.WIFI_SERVICE);
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
			macaddr = getId(); // just make it the unique ID if not found
 		}

		return macaddr;
	}

	public String getModuleName() {
		return "android";
	}

	public String getOsType() {
		return "32bit"; // TODO review hardcoded response of 32bit for ostype
	}

	public int getProcessorCount() {
		return Runtime.getRuntime().availableProcessors();
	}

	public String getUsername() {
		return Build.USER;
	}

	public String getVersion() {
		return Build.VERSION.RELEASE;
	}

	public double getAvailableMemory() {
		return Runtime.getRuntime().freeMemory();
	}

	public String getModel() {
		return Build.MODEL;
	}

	public boolean openApplication(String name) {
		if (DBG) {
			Log.d(LCAT, "Launching app: " + name);
		}

        PackageManager pm = getContext().getPackageManager();
        Intent main = new Intent(Intent.ACTION_MAIN, null);
        main.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> list = pm.queryIntentActivities(main, 0);

        boolean found = false;
        Intent app = new Intent(Intent.ACTION_MAIN, null);
		app.addCategory(Intent.CATEGORY_LAUNCHER);
		app.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        for (ResolveInfo r : list) {
        	ActivityInfo i = r.activityInfo;
        	if(i.name.equals(name)) {
        		app.setComponent(new ComponentName(i.packageName, i.name));
        		found = true;
        		break;
        	}
        }

        if (found) {
			try {
				getContext().startActivity(app);
				return true;
			} catch (ActivityNotFoundException e) {
				Log.e(LCAT, "Activity not found: " + name, e);
 			}
        }
		return false;
	}

	public boolean openUrl(String url) {
		if (DBG) {
			Log.d(LCAT, "Launching viewer for: " + url);
		}
		Uri uri = Uri.parse(url);
		Intent intent = new Intent(Intent.ACTION_VIEW, uri);
		try {
			getTitaniumWebView().getContext().startActivity(intent);
			return true;
		} catch (ActivityNotFoundException e) {
			Log.e(LCAT,"Activity not found: " + url, e);
		}
		return false;
	}

	public void logInstalledApplicationNames() {
        PackageManager pm = getContext().getPackageManager();
        Intent main = new Intent(Intent.ACTION_MAIN, null);
        main.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> list = pm.queryIntentActivities(main, 0);

        for (ResolveInfo r : list) {
        	if (DBG) {
        		Log.d(LCAT, "Application Name: " + r.activityInfo.name);
        	}
        }
	}
}
