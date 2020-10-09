/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.platform;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.io.TiFileProvider;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiUrl;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.res.AssetFileDescriptor;
import android.Manifest;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;

import com.appcelerator.aps.APSAnalytics;
import com.appcelerator.aps.APSAnalyticsMeta;

import java.io.BufferedReader;
import java.io.File;
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
	private int versionMajor;
	private int versionMinor;
	private int versionPatch;
	protected int batteryState;
	protected double batteryLevel;
	protected boolean batteryStateReady;

	protected BroadcastReceiver batteryStateReceiver;

	public PlatformModule()
	{
		super();

		batteryState = BATTERY_STATE_UNKNOWN;
		batteryLevel = -1;

		// Extract "<major>.<minor>" integers from OS version string.
		String[] versionComponents = Build.VERSION.RELEASE.split("\\.");
		try {
			this.versionMajor = Integer.parseInt(versionComponents[0]);
			if (versionComponents.length >= 2) {
				this.versionMinor = Integer.parseInt(versionComponents[1]);
				if (versionComponents.length >= 3) {
					this.versionPatch = Integer.parseInt(versionComponents[2]);
				}
			}
		} catch (Exception ex) {
			Log.e(TAG, "Failed to parse OS version string.", ex);
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public String getName()
	{
		return APSAnalyticsMeta.getPlatform();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getOsname()
	{
		return APSAnalyticsMeta.getPlatform();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getLocale()
	{
		return TiPlatformHelper.getInstance().getLocale();
	}

	@Kroll.method
	@Kroll.getProperty
	public DisplayCapsProxy getDisplayCaps()
	{
		if (displayCaps == null) {
			displayCaps = new DisplayCapsProxy();
			displayCaps.setActivity(TiApplication.getInstance().getCurrentActivity());
		}
		return displayCaps;
	}

	@Kroll.method
	@Kroll.getProperty
	public int getProcessorCount()
	{
		return Runtime.getRuntime().availableProcessors();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getUsername()
	{
		return Build.USER;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getVersion()
	{
		return APSAnalyticsMeta.getOsVersion();
	}

	@Kroll.getProperty
	public int getVersionMajor()
	{
		return this.versionMajor;
	}

	@Kroll.getProperty
	public int getVersionMinor()
	{
		return this.versionMinor;
	}

	@Kroll.getProperty
	public int getVersionPatch()
	{
		return this.versionPatch;
	}

	@Kroll.method
	@Kroll.getProperty
	public double getAvailableMemory()
	{
		return Runtime.getRuntime().freeMemory();
	}

	@Kroll.method
	@Kroll.getProperty
	public double getTotalMemory()
	{
		return Runtime.getRuntime().totalMemory();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getModel()
	{
		return Build.MODEL;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getManufacturer()
	{
		return Build.MANUFACTURER;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getOstype()
	{
		return APSAnalyticsMeta.getOsType();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getArchitecture()
	{
		return APSAnalyticsMeta.getArchitecture();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getAddress()
	{
		return TiPlatformHelper.getInstance().getIpAddress();
	}

	@Kroll.method
	@Kroll.getProperty
	public String getNetmask()
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
	public boolean canOpenURL(KrollInvocation invocation, String url)
	{
		// Validate argument.
		if ((url == null) || url.isEmpty()) {
			Log.e(TAG, "Ti.Platform.canOpenURL() was given a null or empty string.");
			return false;
		}

		// Determine if the system has a registered activity intent-filter for the given URL.
		boolean canOpen = false;
		try {
			Intent intent = createOpenUrlIntentFrom(invocation, url);
			if (hasValidFileReference(intent)) {
				PackageManager packageManager = TiApplication.getInstance().getPackageManager();
				if (intent.resolveActivity(packageManager) != null) {
					canOpen = true;
				}
			}
		} catch (Exception ex) {
		}
		return canOpen;
	}

	@Kroll.method
	public boolean openURL(KrollInvocation invocation, String url,
						   @Kroll.argument(optional = true) Object arg2, @Kroll.argument(optional = true) Object arg3)
	{
		// If given an optional callback, then call this method recursively without the callback.
		// Note: We might also receieve an optional KrollDict argument. This is iOS only and should be ignored.
		KrollFunction callback = null;
		if (arg2 instanceof KrollFunction) {
			callback = (KrollFunction) arg2;
		} else if (arg3 instanceof KrollFunction) {
			callback = (KrollFunction) arg3;
		}
		if (callback != null) {
			// Attempt to open the URL.
			boolean wasOpened = false;
			String errorMessage = null;
			try {
				wasOpened = openURL(invocation, url, null, null);
			} catch (Exception ex) {
				errorMessage = ex.getMessage();
			}

			// Invoke callback with the result on the next message pump. (Mimics iOS' behavior.)
			KrollDict event = new KrollDict();
			event.putCodeAndMessage(wasOpened ? 0 : 1, errorMessage);
			callback.callAsync(getKrollObject(), event);

			// Return the result immediately for backward compatibility.
			return wasOpened;
		}

		Log.d(TAG, "Launching viewer for: " + url, Log.DEBUG_MODE);

		// Validate argument.
		if ((url == null) || url.isEmpty()) {
			Log.e(TAG, "Ti.Platform.openURL() was given a null or empty string.");
			return false;
		}

		// Fetch an available activity.
		Activity activity = TiApplication.getAppRootOrCurrentActivity();
		if (activity == null) {
			Log.w(TAG, "Ti.Platform.openURL() cannot execute because there are no open windows to launch from.");
			return false;
		}

		// Create the intent that will open the given URL.
		Intent intent = createOpenUrlIntentFrom(invocation, url);
		if (intent == null) {
			Log.w(TAG, "Ti.Platform.openURL() was given invalid URL: " + url);
			return false;
		}

		// If intent references a local file, then make sure it exists.
		if (hasValidFileReference(intent) == false) {
			return false;
		}

		// If given URL references a file belonging to this app, then provide temporary read-only permission to it.
		// Note: Intent created above will generate a "content://" URI via TiFileProvider in this case.
		if (TiFileProvider.isMyUri(intent.getData())) {
			intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
		}

		// Attempt to open the URL.
		boolean wasSuccessful = false;
		try {
			activity.startActivity(intent);
			wasSuccessful = true;
		} catch (Exception ex) {
			Log.e(TAG, "Ti.Platform.openURL() failed to open: " + url);
		}
		return wasSuccessful;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getMacaddress()
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

	@Kroll.method
	@Kroll.getProperty
	public String getId()
	{
		return APSAnalytics.getInstance().getMachineId();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setBatteryMonitoring(boolean monitor)
	{
		if (monitor && batteryStateReceiver == null) {
			registerBatteryStateReceiver();
		} else if (!monitor && batteryStateReceiver != null) {
			unregisterBatteryStateReceiver();
			batteryStateReceiver = null;
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getBatteryMonitoring()
	{
		return batteryStateReceiver != null;
	}

	@Kroll.method
	@Kroll.getProperty
	public int getBatteryState()
	{
		return batteryState;
	}

	@Kroll.method
	@Kroll.getProperty
	public double getBatteryLevel()
	{
		return batteryLevel;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getRuntime()
	{
		return KrollRuntime.getInstance().getRuntimeName();
	}

	@Kroll.method
	@Kroll.getProperty
	public double getUptime()
	{
		return SystemClock.uptimeMillis() / 1000.0;
	}

	@Kroll.method
	public Object[] cpus()
	{
		List<Processor> processors = getProcessors();
		List<KrollDict> result = new ArrayList<KrollDict>(processors.size());
		for (Processor p : processors) {
			if (p.details.containsKey("processor")) {
				result.add(p.toKrollDict());
			}
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

	/**
	 * Creates an ACTION_VIEW (or similar) intent for the give url to be used to start an activity.
	 * This method is intended to be used by this class' canOpenURL() and openURL() methods.
	 * @param url
	 * The URL to create an intent for such as "http:", "mailto:", "geo:", "file:", etc.
	 * Can also be set to a file system path (ie: no URL scheme).
	 * Can be set to null or empty string.
	 * @return
	 * Returns an intent for the given URL to be used to start an activity.
	 * <p>
	 * Returns null if given a null or invalid URL argument.
	 */
	private Intent createOpenUrlIntentFrom(KrollInvocation invocation, String url)
	{
		// Validate argument.
		if ((url == null) || url.isEmpty()) {
			return null;
		}

		// Create a URI object from the given string.
		Uri uri = null;
		if (TiFileFactory.isLocalScheme(url)) {
			String resolvedUrl = url;
			if (invocation != null) {
				TiUrl tiUrl = TiUrl.createProxyUrl(invocation.getSourceUrl());
				resolvedUrl = TiUrl.resolve(tiUrl.baseUrl, url, null);
			}
			TiBaseFile tiFile = TiFileFactory.createTitaniumFile(resolvedUrl, false);
			uri = TiFileProvider.createUriFrom(tiFile);
		}
		if (uri == null) {
			uri = Uri.parse(url);
			if (uri == null) {
				return null;
			}
		}

		// Fetch the URL's scheme.
		String scheme = uri.getScheme();
		if (scheme == null) {
			return null;
		}

		// Create an intent for the given URL.
		Intent intent = null;
		if (scheme.equals("tel")) {
			intent = new Intent(Intent.ACTION_DIAL, uri);
		} else {
			intent = new Intent(Intent.ACTION_VIEW, uri);
			try {
				String mimeType = null;
				if (scheme.equals(ContentResolver.SCHEME_CONTENT)) {
					mimeType = TiApplication.getInstance().getContentResolver().getType(uri);
				} else if (scheme.equals(ContentResolver.SCHEME_FILE)) {
					mimeType = TiMimeTypeHelper.getMimeType(uri, null);
				}
				if ((mimeType != null) && (mimeType.length() > 0)) {
					intent.setDataAndType(uri, mimeType);
				}
			} catch (Exception ex) {
			}
		}
		return intent;
	}

	/**
	 * If given intent references a local file, then this method checks if it exists.
	 * @param intent The intent to be validated. Can be null.
	 * @return
	 * Returns true if intent's reference file exists or if intent does not reference a file.
	 * Returns false if intent's referenced file does not exist or if given a null argument.
	 */
	private boolean hasValidFileReference(Intent intent)
	{
		// Validate argument.
		if (intent == null) {
			return false;
		}

		// If the intent references a local file, then make sure it exists.
		Uri uri = intent.getData();
		String scheme = (uri != null) ? uri.getScheme() : null;
		if (scheme != null) {
			if (scheme.equals(ContentResolver.SCHEME_CONTENT)) {
				// We were given a "content://" URL. Check if its ContentProvider can provide file access.
				// Note: Will typically throw a "FileNotFoundException" or return null if file doesn't exist.
				ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
				if (contentResolver != null) {
					// First, check if we're referencing an existing file embedded within a file.
					// Example: A file under the APK's "assets" or "res" folder.
					boolean wasFileFound = false;
					try (AssetFileDescriptor descriptor = contentResolver.openAssetFileDescriptor(uri, "r")) {
						wasFileFound = (descriptor != null);
					} catch (Exception ex) {
					}

					// If above failed, check if referencing an existing sandboxed file in the file system.
					if (wasFileFound == false) {
						try (ParcelFileDescriptor descriptor = contentResolver.openFileDescriptor(uri, "r")) {
							wasFileFound = (descriptor != null);
						} catch (Exception ex) {
						}
					}

					// If above failed, then check if we can open a file stream. (The most expensive check.)
					// This can happen with in-memory files or decoded files.
					if (wasFileFound == false) {
						try (InputStream stream = contentResolver.openInputStream(uri)) {
							wasFileFound = (stream != null);
						} catch (Exception ex) {
						}
					}

					// Do not continue if cannot access file via ContentProvider.
					if (wasFileFound == false) {
						return false;
					}
				}
			} else if (scheme.equals(ContentResolver.SCHEME_FILE)) {
				// We were given a "file://" URL. Check if it exists in file system.
				File file = new File(uri.getPath());
				if (file.exists() == false) {
					return false;
				}
			}
		}

		// Intent references an existing file or does not reference a file at all.
		return true;
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
			if (this.details.containsKey("processor")) {
				this.index = Integer.valueOf(this.details.get("processor"));
				return this.index;
			}
			return 0;
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
				String[] args = {
					"/system/bin/cat",
					"/sys/devices/system/cpu/cpu" + getIndex() + "/cpufreq/scaling_cur_freq"
				};
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
