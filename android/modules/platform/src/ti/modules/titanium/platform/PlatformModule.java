/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.platform;

import java.util.concurrent.Semaphore;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiPlatformHelper;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.BatteryManager;

@Kroll.module
public class PlatformModule extends KrollModule
{
	private static final String LCAT = "PlatformModule";
	private static final boolean DBG = TiConfig.LOGD;

	@Kroll.constant public static int BATTERY_STATE_UNKNOWN = 0;
	@Kroll.constant public static int BATTERY_STATE_UNPLUGGED = 1;
	@Kroll.constant public static int BATTERY_STATE_CHARGING = 2;
	@Kroll.constant public static int BATTERY_STATE_FULL = 3;

	protected DisplayCapsProxy displayCaps;

	protected int batteryState;
	protected double batteryLevel;

	protected BroadcastReceiver batteryStateReceiver;

	public PlatformModule(TiContext context)
	{
		super(context);

		context.addOnEventChangeListener(this);

		batteryState = -1;
		batteryLevel = -1;
	}

	@Kroll.getProperty @Kroll.method
	public String getName() {
		return TiPlatformHelper.getName();
	}

	@Kroll.getProperty @Kroll.method
	public String getOsname() {
		return TiPlatformHelper.getName();
	}

	@Kroll.getProperty @Kroll.method
	public String getLocale() {
		return TiPlatformHelper.getLocale();
	}

	@Kroll.getProperty @Kroll.method
	public DisplayCapsProxy getDisplayCaps() {
		if (displayCaps == null) {
			displayCaps = new DisplayCapsProxy(getTiContext());
		}
		return displayCaps;
	}

	@Kroll.getProperty @Kroll.method
	public int getProcessorCount() {
		return TiPlatformHelper.getProcessorCount();
	}

	@Kroll.getProperty @Kroll.method
	public String getUsername() {
		return TiPlatformHelper.getUsername();
	}

	@Kroll.getProperty @Kroll.method
	public String getVersion() {
		return TiPlatformHelper.getVersion();
	}
	
	@Kroll.getProperty @Kroll.method
	public double getAvailableMemory() {
		return TiPlatformHelper.getAvailableMemory();
	}

	@Kroll.getProperty @Kroll.method
	public String getModel() {
		return TiPlatformHelper.getModel();
	}

	@Kroll.getProperty @Kroll.method
	public String getOstype() {
		return TiPlatformHelper.getOstype();
	}

	@Kroll.getProperty @Kroll.method
	public String getArchitecture() {
		return TiPlatformHelper.getArchitecture();
	}

	@Kroll.method
	public String createUUID() {
		return TiPlatformHelper.createUUID();
	}

	@Kroll.method
	public boolean openURL(String url) {
		if (DBG) {
			Log.d(LCAT, "Launching viewer for: " + url);
		}
		Uri uri = Uri.parse(url);
		Intent intent = new Intent(Intent.ACTION_VIEW, uri);
		try {
			getTiContext().getActivity().startActivity(intent);
			return true;
		} catch (ActivityNotFoundException e) {
			Log.e(LCAT,"Activity not found: " + url, e);
		}
		return false;
	}

	@Kroll.getProperty @Kroll.method
	public String getMacaddress() {
		return TiPlatformHelper.getMacaddress();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getId() {
		return TiPlatformHelper.getMobileId();
	}

	@Kroll.getProperty @Kroll.method
	public int getBatteryState()
	{
		Semaphore lock = new Semaphore(0);
		updateBatteryState(lock);

		try {
			lock.acquire();
		} catch (InterruptedException e) {
			// Ignore
		}

		return batteryState;
	}

	@Kroll.getProperty @Kroll.method
	public double getBatteryLevel()
	{
		Semaphore lock = new Semaphore(0);
		updateBatteryState(lock);

		try {
			lock.acquire();
		} catch (InterruptedException e) {
			// Ignore
		}
		return batteryLevel;
	}


	@Override
	public void listenerAdded(String type, int count, final KrollProxy proxy)
	{
		if ("battery".equals(type) && batteryStateReceiver == null) {

			batteryStateReceiver = new BroadcastReceiver()
			{
				@Override
				public void onReceive(Context context, Intent intent)
				{
	                int level = intent.getIntExtra("level", -1);
	                int scale = intent.getIntExtra("scale", -1);
	                int status = intent.getIntExtra("status", -1);

	                KrollDict event = new KrollDict();
	                event.put("level", convertBatteryLevel(level, scale));
	                event.put("state", convertBatteryStatus(status));

	                proxy.fireEvent("battery", event);
				}
			};

			registerBatteryReceiver(batteryStateReceiver);
		}
	}

	@Override
	public void listenerRemoved(String type, int count, KrollProxy proxy)
	{
		if ("battery".equals(type) && count == 0 && batteryStateReceiver != null) {
			getTiContext().getActivity().unregisterReceiver(batteryStateReceiver);
			batteryStateReceiver = null;
		}
	}

	private void updateBatteryState(final Semaphore lock)
	{
		Activity a = getTiContext().getActivity();

		BroadcastReceiver batteryReceiver = new BroadcastReceiver()
		{
			@Override
			public void onReceive(Context context, Intent intent)
			{
				// One-shot
                context.unregisterReceiver(this);

                try {
	                int level = intent.getIntExtra("level", -1);
	                int scale = intent.getIntExtra("scale", -1);
	                int status = intent.getIntExtra("status", -1);

	                batteryState = convertBatteryStatus(status);
	                batteryLevel = convertBatteryLevel(level, scale);
                } finally {
                	lock.release();
                }
			}
		};
		registerBatteryReceiver(batteryReceiver);
	}

	private int convertBatteryStatus(int status)
	{
		int state = BATTERY_STATE_UNKNOWN;
        switch(status) {
	        case BatteryManager.BATTERY_STATUS_CHARGING : {
	        	state = BATTERY_STATE_CHARGING;
	        	break;
	        }
	        case BatteryManager.BATTERY_STATUS_FULL : {
	        	state = BATTERY_STATE_FULL;
	        	break;
	        }
	        case BatteryManager.BATTERY_STATUS_DISCHARGING :
	        case BatteryManager.BATTERY_STATUS_NOT_CHARGING : {
	        	state = BATTERY_STATE_UNPLUGGED;
	        	break;
	        }
        }
        return state;
	}

	private double convertBatteryLevel(int level, int scale) {
		int l = -1;

        if (level >= 0 && scale > 0) {
            l = (level * 100) / scale;
        }

        return l;
	}

	private void registerBatteryReceiver(BroadcastReceiver batteryReceiver) {
		Activity a = getTiContext().getActivity();
        IntentFilter batteryFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        a.registerReceiver(batteryReceiver, batteryFilter);
	}

	@Override
	public void onResume()
	{
		super.onResume();

		if (batteryStateReceiver != null) {
			if (DBG) {
				Log.i(LCAT, "Reregistering battery changed receiver");
			}
			registerBatteryReceiver(batteryStateReceiver);
		}
	}

	@Override
	public void onPause()
	{
		super.onPause();
		if (batteryStateReceiver != null) {
			if (DBG) {
				Log.i(LCAT, "Unregistering battery changed receiver.");
			}
			getTiContext().getActivity().unregisterReceiver(batteryStateReceiver);
		}
	}
}
