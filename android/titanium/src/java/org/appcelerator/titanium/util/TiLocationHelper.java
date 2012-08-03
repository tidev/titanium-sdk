/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

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
	public static final int DEFAULT_UPDATE_FREQUENCY = 5000;
	public static final float DEFAULT_UPDATE_DISTANCE = 10;

	private static final String TAG = "TiLocationHelper";

	private static AtomicInteger listenerCount = new AtomicInteger();
	private static LocationManager locationManager;


	public static LocationManager getLocationManager()
	{
		if (locationManager == null) {
				locationManager = (LocationManager) TiApplication.getInstance().getSystemService(Context.LOCATION_SERVICE);
		}
		return locationManager;
	}

	private static int buildUpdateFrequency(Integer frequency)
	{
		if (frequency != null) {
			return frequency.intValue() * 1000;
		} else {
			return DEFAULT_UPDATE_FREQUENCY;
		}
	}

	private static float buildUpdateDistance(Integer accuracy)
	{
		float updateDistance = DEFAULT_UPDATE_DISTANCE;

		if (accuracy != null) {
			switch(accuracy.intValue()) {
				case ACCURACY_BEST : updateDistance = 1.0f; break;
				case ACCURACY_NEAREST_TEN_METERS : updateDistance = 10.0f; break;
				case ACCURACY_HUNDRED_METERS : updateDistance = 100.0f; break;
				case ACCURACY_KILOMETER : updateDistance = 1000.0f; break;
				case ACCURACY_THREE_KILOMETERS : updateDistance = 3000.0f; break;
				default :
					Log.w(TAG, "Ignoring unknown accuracy value [" + accuracy.intValue() + "]");
			}
		}

		return updateDistance;
	}

	public static void registerListener(String preferredProvider, Integer accuracy, Integer frequency, LocationListener listener)
	{
		getLocationManager();

		String provider = fetchProvider(preferredProvider, accuracy);
		if (provider != null) {
			int updateFrequency = buildUpdateFrequency(frequency);
			float updateDistance = buildUpdateDistance(accuracy);

			Log.i(TAG, "registering listener with provider [" + provider + "], frequency [" + updateFrequency
				+ "], distance [" + updateDistance + "]", Log.DEBUG_MODE);

			locationManager.requestLocationUpdates(provider, updateFrequency, updateDistance, listener);
			listenerCount.incrementAndGet();
		} else {
			Log.e(TAG, "Unable to register listener, provider is null");
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
			Log.e(TAG, "Unable to unregister listener, locationManager is null");
		}
	}

	public static void updateProvider(String preferredProvider, Integer accuracy, String provider, Integer frequency, LocationListener listener)
	{
		if (locationManager != null) {
			String currentProvider = fetchProvider(preferredProvider, accuracy);

			if (!(provider.equals(currentProvider))) {
				int updateFrequency = buildUpdateFrequency(frequency);
				float updateDistance = buildUpdateDistance(accuracy);

				Log.i(TAG, "updating listener with provider [" + currentProvider + "], frequency [" + updateFrequency
					+ "], distance [" + updateDistance + "]", Log.DEBUG_MODE);

				locationManager.removeUpdates(listener);
				locationManager.requestLocationUpdates(currentProvider, updateFrequency, updateDistance, listener);
			}
		} else {
			Log.e(TAG, "Unable to update provider, locationManager is null");
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
			enabled = false;

			try{
				enabled = isLocationProviderEnabled(name);
			} catch(Exception ex){
				ex = null;
			} finally {
				if (!enabled) {
					Log.w(TAG, "Preferred provider [" + name + "] isn't enabled on this device. Will default to auto-select of GPS provider.");
				}
			}
		}

		return enabled;
	}

	public static String fetchProvider(String preferredProvider, Integer accuracy)
	{
		String provider;

		if ((preferredProvider != null) && isValidProvider(preferredProvider)) {
			provider = preferredProvider;
		} else {
			Criteria criteria = createCriteria(accuracy);
			provider = getLocationManager().getBestProvider(criteria, true);
		}		

		return provider;
	}

	protected static Criteria createCriteria(Integer accuracy)
	{
		Criteria criteria = new Criteria();
		criteria.setAccuracy(Criteria.NO_REQUIREMENT);

		if (accuracy != null) {
			int value = accuracy.intValue();

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
					Log.w(TAG, "Ignoring unknown accuracy value [" + value + "]");
			}
		}

		return criteria;
	}

	public static boolean isLocationEnabled()
	{
		boolean enabled = false;

		List<String> providers = getLocationManager().getProviders(true);
		if (providers != null && providers.size() > 0) {
			Log.i(TAG, "Enabled location provider count: " + providers.size(), Log.DEBUG_MODE);
			for (String name : providers) {
				Log.i(TAG, "Location [" + name + "] service available", Log.DEBUG_MODE);
			}
			enabled = true;
		} else {
			Log.i(TAG, "No available providers", Log.DEBUG_MODE);
		}

		return enabled;
	}
}

