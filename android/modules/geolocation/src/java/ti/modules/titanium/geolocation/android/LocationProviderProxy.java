/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation.android;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;

import android.location.Location;
import android.location.LocationListener;
import android.location.LocationProvider;
import android.os.Bundle;


@Kroll.proxy
public class LocationProviderProxy extends KrollProxy
	implements LocationListener
{
	public static final int STATE_DISABLED = 0;
	public static final int STATE_ENABLED = 1;
	public static final int STATE_OUT_OF_SERVICE = 2;
	public static final int STATE_UNAVAILABLE = 3;
	public static final int STATE_AVAILABLE = 4;
	public static final int STATE_UNKNOWN = 5;
	public static final double defaultMinUpdateDistance = 1.0;
	public static final double defaultMinUpdateTime = 5000;

	private static final String TAG = "LocationProviderProxy";

	private LocationProviderListener providerListener;


	public interface LocationProviderListener
	{
		public abstract void onLocationChanged(Location location);
		public abstract void onProviderStateChanged(String providerName, int state);
		public abstract void onProviderUpdated(LocationProviderProxy locationProvider);
	}


	public LocationProviderProxy(Object[] creationArgs, LocationProviderListener providerListener)
	{
		super();

		defaultValues.put(TiC.PROPERTY_MIN_UPDATE_DISTANCE, defaultMinUpdateDistance);
		defaultValues.put(TiC.PROPERTY_MIN_UPDATE_TIME, defaultMinUpdateTime);
		handleCreationArgs(null, creationArgs);

		this.providerListener = providerListener;
	}

	public LocationProviderProxy(String name, double minUpdateDistance, double minUpdateTime, LocationProviderListener providerListener)
	{
		super();

		setProperty(TiC.PROPERTY_NAME, name);
		setProperty(TiC.PROPERTY_MIN_UPDATE_DISTANCE, minUpdateDistance);
		setProperty(TiC.PROPERTY_MIN_UPDATE_TIME, minUpdateTime);

		this.providerListener = providerListener;
	}

	@Override
	public void onLocationChanged(Location location)
	{
		providerListener.onLocationChanged(location);
	}

	@Override
	public void onProviderDisabled(String provider)
	{
		providerListener.onProviderStateChanged(provider, STATE_DISABLED);
	}

	@Override
	public void onProviderEnabled(String provider)
	{
		providerListener.onProviderStateChanged(provider, STATE_ENABLED);
	}

	@Override
	public void onStatusChanged(String provider, int status, Bundle extras)
	{
		switch(status) {
			case LocationProvider.OUT_OF_SERVICE:
				providerListener.onProviderStateChanged(provider, STATE_OUT_OF_SERVICE);

				break;

			case LocationProvider.TEMPORARILY_UNAVAILABLE:
				providerListener.onProviderStateChanged(provider, STATE_UNAVAILABLE);

				break;

			case LocationProvider.AVAILABLE:
				providerListener.onProviderStateChanged(provider, STATE_AVAILABLE);

				break;

			default:
				providerListener.onProviderStateChanged(provider, STATE_UNKNOWN);

				break;
		}
	}

	@Kroll.getProperty
	public String getName()
	{
		Object property = getProperty(TiC.PROPERTY_NAME);
		if(property == null) {
			Log.e(TAG, "no name found for location provider");

			return ""; // this shouldnt be possible
		}

		return (String) property;
	}

	@Kroll.setProperty
	public void setName(String value)
	{
		Log.e(TAG, "not allowed to set the name of a provider after creation");
	}

	@Kroll.getProperty
	public double getMinUpdateDistance()
	{
		Object property = getProperty(TiC.PROPERTY_MIN_UPDATE_DISTANCE);
		if(property == null || !(property instanceof Double)) {
			Log.e(TAG, "invalid value [" + property + "] found for minUpdateDistance, returning default");

			return defaultMinUpdateDistance;
		}

		return (Double) property;
	}

	@Kroll.setProperty
	public void setMinUpdateDistance(double value)
	{
		setProperty(TiC.PROPERTY_MIN_UPDATE_DISTANCE, value);
		providerListener.onProviderUpdated(this);
	}

	@Kroll.getProperty
	public double getMinUpdateTime()
	{
		Object property = getProperty(TiC.PROPERTY_MIN_UPDATE_TIME);
		if(property == null || !(property instanceof Double)) {
			Log.e(TAG, "invalid value [" + property + "] found for minUpdateTime, returning default");

			return defaultMinUpdateTime;
		}

		return (Double) property;
	}

	@Kroll.setProperty
	public void setMinUpdateTime(double value)
	{
		setProperty(TiC.PROPERTY_MIN_UPDATE_TIME, value);
		providerListener.onProviderUpdated(this);
	}
}

