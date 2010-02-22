package ti.modules.titanium.platform;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiPlatformHelper;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;

public class PlatformModule extends TiModule
{
	private static final String LCAT = "PlatformModule";
	private static final boolean DBG = TiConfig.LOGD;

	public static int BATTERY_STATE_UNKNOWN = 0;
	public static int BATTERY_STATE_UNPLUGGED = 1;
	public static int BATTERY_STATE_CHARGING = 2;
	public static int BATTERY_STATE_FULL = 3;

	private static TiDict constants;

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

	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("BATTERY_STATE_UNKNOWN", BATTERY_STATE_UNKNOWN);
			constants.put("BATTERY_STATE_UNPLUGGED", BATTERY_STATE_UNPLUGGED);
			constants.put("BATTERY_STATE_CHARGING", BATTERY_STATE_CHARGING);
			constants.put("BATTERY_STATE_FULL", BATTERY_STATE_FULL);
		}

		return constants;
	}



	public String getName() {
		return "android";
	}

	public DisplayCapsProxy getDisplayCaps() {
		if (displayCaps == null) {
			displayCaps = new DisplayCapsProxy(getTiContext());
		}
		return displayCaps;
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

	public String getOstype() {
		return "32bit";
	}

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

	public String getMacaddress() {
		String macaddr = null;

		if(getTiContext().getActivity().checkCallingOrSelfPermission(Manifest.permission.ACCESS_WIFI_STATE) == PackageManager.PERMISSION_GRANTED) {
			WifiManager wm = (WifiManager) getTiContext().getActivity().getSystemService(Context.WIFI_SERVICE);
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
	public String getId() {
		return TiPlatformHelper.getMobileId();
	}

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
	public void listenerAdded(String type, int count, final TiProxy proxy)
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

	                TiDict event = new TiDict();
	                event.put("level", convertBatteryLevel(level, scale));
	                event.put("state", convertBatteryStatus(status));

	                proxy.fireEvent("battery", event);
				}
			};

			registerBatteryReceiver(batteryStateReceiver);
		}
	}

	@Override
	public void listenerRemoved(String type, int count, TiProxy proxy)
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
