/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;

import android.content.Context;
import android.location.Criteria;
import android.location.LocationListener;
import android.location.LocationManager;

public class TiLocationHelper
{
	public static final int ERR_UNKNOWN_ERROR = 0;
	public static final int ERR_PERMISSION_DENIED = 1;
	public static final int ERR_POSITION_UNAVAILABLE = 2;
	public static final int ERR_TIMEOUT = 3;
	public static final int ACCURACY_BEST = 0;
	public static final int ACCURACY_NEAREST_TEN_METERS = 1;
	public static final int ACCURACY_HUNDRED_METERS = 2;
	public static final int ACCURACY_KILOMETER = 3;
	public static final int ACCURACY_THREE_KILOMETERS = 4;

	private static final String LCAT = "TiLocationHelper";
	private static final Boolean DBG = true; //TiConfig.LOGD;

	private static AtomicInteger listenerCount = new AtomicInteger();
	private static KrollProxy proxy = null;
	private static LocationManager locationManager;

	public static LocationManager getLocationManager()
	{
		if (locationManager == null) {
				locationManager = (LocationManager) TiApplication.getInstance().getSystemService(Context.LOCATION_SERVICE);
		}
		return locationManager;
	}

	public static void registerListener(KrollProxy proxy, LocationListener listener)
	{
		getLocationManager();

		String provider = fetchProvider();
		if (provider != null) {
			float updateDistance = 10;
			int updateFrequency = 5000;

			TiLocationHelper.proxy = proxy;
			if (proxy != null) {
				Object accuracy = proxy.getProperty(TiC.PROPERTY_ACCURACY);
				Object frequency = proxy.getProperty(TiC.PROPERTY_FREQUENCY);

				if (accuracy != null) {
					int value = TiConvert.toInt(accuracy);
					switch(value) {
						case ACCURACY_BEST : updateDistance = 1.0f; break;
						case ACCURACY_NEAREST_TEN_METERS : updateDistance = 10.0f; break;
						case ACCURACY_HUNDRED_METERS : updateDistance = 100.0f; break;
						case ACCURACY_KILOMETER : updateDistance = 1000.0f; break;
						case ACCURACY_THREE_KILOMETERS : updateDistance = 3000.0f; break;
						default :
							Log.w(LCAT, "Ignoring unknown accuracy value " + value);
					}
				}

				if (frequency != null) {
					int value = TiConvert.toInt(frequency); // in seconds
					updateFrequency = value * 1000; // to millis
				}
			}

			locationManager.requestLocationUpdates(provider, updateFrequency, updateDistance, listener);  // locationListener should be module that implements, etc
			listenerCount.incrementAndGet();
		} else {
			Log.e(LCAT, "unable to register, provider is null");
		}
	}

	public static void unregisterListener(LocationListener listener)
	{
		if (locationManager != null) {
			locationManager.removeUpdates(listener);

			if (listenerCount.decrementAndGet() == 0) {
				locationManager = null;
			}
		} else {
			Log.e(LCAT, "unable to unregister, locationManager is null");
		}
	}

	protected static boolean isLocationProviderEnabled(String name)
	{
		try {
			return getLocationManager().isProviderEnabled(name);
		} catch (Exception e) {
			// Ignore - it's expected
			e = null;
		}
		return false;
	}

	protected static boolean isValidProvider(String name)
	{
		boolean enabled = (name.equals(LocationManager.GPS_PROVIDER) || name.equals(LocationManager.NETWORK_PROVIDER));

		if (enabled) {
			// So far we have a valid name but let's check to see if the provider is enabled on this device
			enabled = false;
			try{
				enabled = isLocationProviderEnabled(name);
			} catch(Exception ex){
				ex = null;
			} finally {
				if (!enabled) {
					Log.w(LCAT, "Preferred provider ["+name+"] isn't enabled on this device.  Will default to auto-select of GPS provider.");
				}
			}
		}

		return enabled;
	}

	public static String fetchProvider()
	{
		String preferredProvider = null;
		if (proxy != null) {
			preferredProvider = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_PREFERRED_PROVIDER));
		}

		String provider;		
		if ((preferredProvider != null) && isValidProvider(preferredProvider)) {
			provider = preferredProvider;
		} else {
			Criteria criteria = createCriteria();
			provider = getLocationManager().getBestProvider(criteria, true);
		}		
		
		return provider;
	}

	protected static Criteria createCriteria()
	{
		Criteria criteria = new Criteria();
		criteria.setAccuracy(Criteria.NO_REQUIREMENT);

		if (proxy != null) {
			Object accuracy = null;

			accuracy = proxy.getProperty(TiC.PROPERTY_ACCURACY);

			if (accuracy != null) {
				int value = TiConvert.toInt(accuracy);
				switch(value) {
					case ACCURACY_BEST :
					case ACCURACY_NEAREST_TEN_METERS :
					case ACCURACY_HUNDRED_METERS :
						criteria.setAccuracy(Criteria.ACCURACY_FINE);
						criteria.setAltitudeRequired(true);
						criteria.setBearingRequired(true);
						criteria.setSpeedRequired(true);
						break;
					case ACCURACY_KILOMETER :
					case ACCURACY_THREE_KILOMETERS :
						criteria.setAccuracy(Criteria.ACCURACY_COARSE);
						criteria.setAltitudeRequired(false);
						criteria.setBearingRequired(false);
						criteria.setSpeedRequired(false);
						break;
					default :
						Log.w(LCAT, "Ignoring unknown accuracy value " + value);
				}
			}
		}

		return criteria;
	}

	public static boolean isLocationEnabled()
	{
		boolean enabled = false;

		List<String> providers = getLocationManager().getProviders(true);
		if (providers != null && providers.size() > 0) {
			if (DBG) {
				Log.i(LCAT, "Enabled location provider count: " + providers.size());
				// Extra debugging
				for (String name : providers) {
					Log.i(LCAT, "Location ["+name+"] Service available ");
				}
			}
			enabled = true;
		} else {
			Log.i(LCAT, "No available providers");
		}

		return enabled;
	}
}

