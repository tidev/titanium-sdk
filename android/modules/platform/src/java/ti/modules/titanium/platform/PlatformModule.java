/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.platform;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiPlatformHelper;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.Manifest;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.SystemClock;

import com.appcelerator.aps.APSAnalytics;
import com.appcelerator.aps.APSAnalyticsMeta;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Kroll.module
public class PlatformModule extends KrollModule
{
	private static final String TAG = "PlatformModule";

	@Kroll.constant
	public static final int BATTERY_STATE_UNKNOWN = 0;
	@Kroll.constant
	public static final int BATTERY_STATE_UNPLUGGED = 1;
	@Kroll.constant
	public static final int BATTERY_STATE_CHARGING = 2;
	@Kroll.constant
	public static final int BATTERY_STATE_FULL = 3;

	protected DisplayCapsProxy displayCaps;

	private List<Processor> processors;

	protected int batteryState;
	protected double batteryLevel;
	protected boolean batteryStateReady;

	protected BroadcastReceiver batteryStateReceiver;

	public PlatformModule()
	{
		super();

		batteryState = BATTERY_STATE_UNKNOWN;
		batteryLevel = -1;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getName()
	// clang-format on
	{
		return APSAnalyticsMeta.getPlatform();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getOsname()
	// clang-format on
	{
		return APSAnalyticsMeta.getPlatform();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getLocale()
	// clang-format on
	{
		return TiPlatformHelper.getInstance().getLocale();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public DisplayCapsProxy getDisplayCaps()
	// clang-format on
	{
		if (displayCaps == null) {
			displayCaps = new DisplayCapsProxy();
			displayCaps.setActivity(TiApplication.getInstance().getCurrentActivity());
		}
		return displayCaps;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getProcessorCount()
	// clang-format on
	{
		return Runtime.getRuntime().availableProcessors();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getUsername()
	// clang-format on
	{
		return Build.USER;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getVersion()
	// clang-format on
	{
		return APSAnalyticsMeta.getOsVersion();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public double getAvailableMemory()
	// clang-format on
	{
		return Runtime.getRuntime().freeMemory();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public double getTotalMemory()
	// clang-format on
	{
		return Runtime.getRuntime().totalMemory();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getModel()
	// clang-format on
	{
		return Build.MODEL;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getManufacturer()
	// clang-format on
	{
		return Build.MANUFACTURER;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getOstype()
	// clang-format on
	{
		return APSAnalyticsMeta.getOsType();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getArchitecture()
	// clang-format on
	{
		return APSAnalyticsMeta.getArchitecture();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getAddress()
	// clang-format on
	{
		return TiPlatformHelper.getInstance().getIpAddress();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getNetmask()
	// clang-format on
	{
		return TiPlatformHelper.getInstance().getNetmask();
	}

	@Kroll.method
	public boolean is24HourTimeFormat()
	{
		TiApplication app = TiApplication.getInstance();
		if (app != null) {
			return android.text.format.DateFormat.is24HourFormat(app.getApplicationContext());
		}
		return false;
	}

	@Kroll.method
	public String createUUID()
	{
		return UUID.randomUUID().toString();
	}

	@Kroll.method
	public boolean openURL(String url)
	{
		Log.d(TAG, "Launching viewer for: " + url, Log.DEBUG_MODE);
		Uri uri = Uri.parse(url);
		Intent intent = new Intent(Intent.ACTION_VIEW, uri);
		try {
			Activity activity = TiApplication.getAppRootOrCurrentActivity();

			if (activity != null) {
				activity.startActivity(intent);
			} else {
				throw new ActivityNotFoundException("No valid root or current activity found for application instance");
			}
			return true;
		} catch (ActivityNotFoundException e) {
			Log.e(TAG, "Activity not found: " + url, e);
		}
		return false;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getMacaddress()
	// clang-format on
	{
		String macaddr = null;
		TiApplication tiApp = TiApplication.getInstance();

		if (tiApp.checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE)
			== PackageManager.PERMISSION_GRANTED) {
			WifiManager wm = (WifiManager) tiApp.getSystemService(Context.WIFI_SERVICE);
			if (wm != null) {
				WifiInfo wi = wm.getConnectionInfo();
				if (wi != null) {
					macaddr = wi.getMacAddress();
					Log.d(TAG, "Found mac address " + macaddr);
				} else {
					Log.d(TAG, "Mo WifiInfo, enabling Wifi to get mac address");
					if (!wm.isWifiEnabled()) {
						if (wm.setWifiEnabled(true)) {
							if ((wi = wm.getConnectionInfo()) != null) {
								macaddr = wi.getMacAddress();
							} else {
								Log.d(TAG, "Still no WifiInfo, assuming no mac address");
							}
							Log.d(TAG, "Disabling wifi because we enabled it.");
							wm.setWifiEnabled(false);
						} else {
							Log.d(TAG, "Enabling wifi failed, assuming no mac address");
						}
					} else {
						Log.d(TAG, "Wifi already enabled, assuming no mac address");
					}
				}
			}
		} else {
			Log.w(TAG, "Must have android.permission.ACCESS_WIFI_STATE to get mac address.");
		}

		if (macaddr == null) {
			macaddr = getId(); // just make it the unique ID if not found
		}

		return macaddr;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getId()
	// clang-format on
	{
		return APSAnalytics.getInstance().getMachineId();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setBatteryMonitoring(boolean monitor)
	// clang-format on
	{
		if (monitor && batteryStateReceiver == null) {
			registerBatteryStateReceiver();
		} else if (!monitor && batteryStateReceiver != null) {
			unregisterBatteryStateReceiver();
			batteryStateReceiver = null;
		}
	}
	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getBatteryMonitoring()
	// clang-format on
	{
		return batteryStateReceiver != null;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getBatteryState()
	// clang-format on
	{
		return batteryState;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public double getBatteryLevel()
	// clang-format on
	{
		return batteryLevel;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getRuntime()
	// clang-format on
	{
		return KrollRuntime.getInstance().getRuntimeName();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public double getUptime()
	// clang-format on
	{
		return SystemClock.uptimeMillis() / 1000.0;
	}

	// clang-format off
	@Kroll.method
	public Object[] cpus()
	// clang-format on
	{
		List<Processor> processors = getProcessors();
		List<KrollDict> result = new ArrayList<KrollDict>(processors.size());
		for (Processor p : processors) {
			result.add(p.toKrollDict());
		}
		return result.toArray();
	}

	private synchronized List<Processor> getProcessors()
	{
		if (this.processors != null) {
			return this.processors;
		}
		final int processorCount = getProcessorCount();
		processors = new ArrayList<Processor>(processorCount);

		// Now read in their details
		BufferedReader in = null;
		List<Map> groups = new ArrayList<Map>();
		Map<String, String> current = new HashMap<String, String>();
		try {
			String[] args = { "/system/bin/cat", "/proc/cpuinfo" };
			ProcessBuilder cmd = new ProcessBuilder(args);
			Process process = cmd.start();
			InputStream inStream = process.getInputStream();
			in = new BufferedReader(new InputStreamReader(inStream));
			String line = null;
			while ((line = in.readLine()) != null) {
				if (line.length() == 0) {
					// new group!
					groups.add(current);
					current = new HashMap<String, String>();
				} else {
					// entry, split by ':'
					int colonIndex = line.indexOf(':');
					String key = line.substring(0, colonIndex).trim();
					String value = line.substring(colonIndex + 1).trim();
					current.put(key, value);
				}
			}
			for (Map<String, String> group : groups) {
				processors.add(new Processor(group));
			}
			// TODO Sort processors by index, fill in model name by preceding if unknown

		} catch (IOException ex) {
			// somethign went wrong, create "default" set of processors?
			this.processors = new ArrayList<Processor>(processorCount);
			for (int i = 0; i < processorCount; i++) {
				this.processors.add(Processor.unknown(i));
			}
		} finally {
			try {
				if (in != null) {
					in.close();
				}
			} catch (IOException e) {
				// ignore
			}
		}
		return processors;
	}

	protected void registerBatteryStateReceiver()
	{
		batteryStateReceiver = new BroadcastReceiver() {
			@Override
			public void onReceive(Context context, Intent intent)
			{
				int scale = intent.getIntExtra(TiC.PROPERTY_SCALE, -1);
				batteryLevel = convertBatteryLevel(intent.getIntExtra(TiC.PROPERTY_LEVEL, -1), scale);
				batteryState = convertBatteryStatus(intent.getIntExtra(TiC.PROPERTY_STATUS, -1));

				KrollDict event = new KrollDict();
				event.put(TiC.PROPERTY_LEVEL, batteryLevel);
				event.put(TiC.PROPERTY_STATE, batteryState);
				fireEvent(TiC.EVENT_BATTERY, event);
			}
		};

		registerBatteryReceiver(batteryStateReceiver);
	}

	protected void unregisterBatteryStateReceiver()
	{
		getActivity().unregisterReceiver(batteryStateReceiver);
	}

	@Override
	public void eventListenerAdded(String type, int count, final KrollProxy proxy)
	{
		super.eventListenerAdded(type, count, proxy);
		if (TiC.EVENT_BATTERY.equals(type) && batteryStateReceiver == null) {
			registerBatteryStateReceiver();
		}
	}

	@Override
	public void eventListenerRemoved(String type, int count, KrollProxy proxy)
	{
		super.eventListenerRemoved(type, count, proxy);
		if (TiC.EVENT_BATTERY.equals(type) && count == 0 && batteryStateReceiver != null) {
			unregisterBatteryStateReceiver();
			batteryStateReceiver = null;
		}
	}

	private int convertBatteryStatus(int status)
	{
		int state = BATTERY_STATE_UNKNOWN;
		switch (status) {
			case BatteryManager.BATTERY_STATUS_CHARGING: {
				state = BATTERY_STATE_CHARGING;
				break;
			}
			case BatteryManager.BATTERY_STATUS_FULL: {
				state = BATTERY_STATE_FULL;
				break;
			}
			case BatteryManager.BATTERY_STATUS_DISCHARGING:
			case BatteryManager.BATTERY_STATUS_NOT_CHARGING: {
				state = BATTERY_STATE_UNPLUGGED;
				break;
			}
		}
		return state;
	}

	private double convertBatteryLevel(int level, int scale)
	{
		int l = -1;
		if (level >= 0 && scale > 0) {
			l = (level * 100) / scale;
		}
		return l;
	}

	private void registerBatteryReceiver(BroadcastReceiver batteryReceiver)
	{
		Activity a = getActivity();
		IntentFilter batteryFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
		a.registerReceiver(batteryReceiver, batteryFilter);
	}

	@Override
	public void onResume(Activity activity)
	{
		super.onResume(activity);
		if (batteryStateReceiver != null) {
			Log.i(TAG, "Reregistering battery changed receiver", Log.DEBUG_MODE);
			registerBatteryReceiver(batteryStateReceiver);
		}
	}

	@Override
	public void onPause(Activity activity)
	{
		super.onPause(activity);
		if (batteryStateReceiver != null) {
			unregisterBatteryStateReceiver();
			batteryStateReceiver = null;
		}
	}

	@Override
	public void onDestroy(Activity activity)
	{
		super.onDestroy(activity);
		if (batteryStateReceiver != null) {
			unregisterBatteryStateReceiver();
			batteryStateReceiver = null;
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Platform";
	}

	private static class Processor
	{
		private Map<String, String> details;
		private Double speed;
		private Integer index;
		private String model;

		public Processor(Map<String, String> details)
		{
			this.details = details;
		}

		// Used for error case when we have processor count but can't get any details on them
		private Processor(int index)
		{
			this.index = index;
			this.model = "unknown";
		}

		public synchronized int getIndex()
		{
			if (this.index != null) {
				return this.index;
			}
			this.index = Integer.valueOf(this.details.get("processor"));
			return this.index;
		}
		// TODO: try to group key/value pairs per-processor?
		// What we really want here is to pull out "model name" and "cpu MHz" for each grouping
		// We need to fallback for "model name" to "Processor", (or "cpu model") (if former is not available and latter is)
		// https://github.com/libuv/libuv/blob/0813f5b97afe086a7b4d827774605b1f2e99191c/src/unix/linux-core.c
		// No fallback for cpuMHz, ignore BogoMIPs as that's meaningless
		// Instead need to *try* and read "/sys/devices/system/cpu/cpu%u/cpufreq/scaling_cur_freq" and divide by 1000.0

		public synchronized double getSpeed()
		{
			if (this.speed != null) {
				return this.speed;
			}
			if (details.containsKey("cpu MHz")) {
				this.speed = Double.parseDouble(details.get("cpu MHz"));
				return this.speed;
			}
			Long freq = readCPUFrequency();
			if (freq != null) {
				this.speed = freq / 1000.0;
			} else {
				this.speed = 0.0;
			}
			return this.speed;
		}

		private Long readCPUFrequency()
		{
			BufferedReader in = null;
			try {
				String[] args = { "/system/bin/cat",
								  "/sys/devices/system/cpu/cpu" + getIndex() + "/cpufreq/scaling_cur_freq" };
				ProcessBuilder cmd = new ProcessBuilder(args);
				Process process = cmd.start();
				InputStream inStream = process.getInputStream();
				in = new BufferedReader(new InputStreamReader(inStream));
				String line = in.readLine();
				if (line != null) {
					return Long.parseLong(line);
				}
			} catch (IOException ex) {
				// ignore
			} finally {
				try {
					if (in != null) {
						in.close();
					}
				} catch (IOException e) {
					// ignore
				}
			}
			return null;
		}

		public synchronized String getModel()
		{
			if (this.model != null) {
				return this.model;
			}
			if (details.containsKey("model name")) {
				this.model = details.get("model name");
			} else if (details.containsKey("Processor")) {
				this.model = details.get("Processor");
			} else if (details.containsKey("cpu model")) {
				this.model = details.get("cpu model");
			} else {
				// FIXME We can also infer same model as preceding cpu!
				this.model = "unknown";
			}
			return this.model;
		}

		public KrollDict toKrollDict()
		{
			KrollDict dict = new KrollDict();
			dict.put("model", getModel());
			dict.put("speed", getSpeed());
			KrollDict times = new KrollDict();
			times.put("user", 0);
			times.put("nice", 0);
			times.put("sys", 0);
			times.put("idle", 0);
			times.put("irq", 0);
			dict.put("times", times);
			return dict;
		}

		public static Processor unknown(int index)
		{
			return new Processor(index);
		}
	}
}
