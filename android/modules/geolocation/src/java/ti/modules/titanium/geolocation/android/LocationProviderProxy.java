/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation.android;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.location.Location;
import android.location.LocationListener;
import android.location.LocationProvider;
import android.os.Bundle;


/**
 * LocationProviderProxy represents a location provider that can be registered with the OS
 * and get location updates.  The interaction with the OS is driven by the name, distance and 
 * time properties.
 * <p>
 * Property descriptions:
 * <ul>
 * 	<li>name - the name of the OS location service that this provider is associated with</li>
 * 	<li>minUpdateDistance - the distance value to give to the OS when the provider is registered.
 * 		this value represents how far the device needs to move before the OS will send location 
 * 		updates for this provider.  this is just a suggestion to the OS and not a hard rule.</li>
 * 	<li>minUpdateTime - the time value to give to the OS when the provider is registered.
 * 		this value represents how often the OS will send location updates for this provider.  
 * 		this is just a suggestion to the OS and not a hard rule.</li>
 * </ul>
 */
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

	private static final String TAG = "LocationProviderProxy";

	private final double defaultMinUpdateDistance = 0.0;
	private final double defaultMinUpdateTime = 0;

	private LocationProviderListener providerListener;


	public interface LocationProviderListener
	{
		public abstract void onLocationChanged(Location location);
		public abstract void onProviderStateChanged(String providerName, int state);
		public abstract void onProviderUpdated(LocationProviderProxy locationProvider);
	}


	/**
	 * Constructor.  Used primarily when creating a location provider via 
	 * Ti.Geolocation.Android.createLocationProvider
	 * 
	 * @param creationArgs			creation arguments for the location provider
	 * @param providerListener		listener that will be notified when a location update is
	 * 								received or the provider state changes
	 */
	public LocationProviderProxy(Object[] creationArgs, LocationProviderListener providerListener)
	{
		super();

		defaultValues.put(TiC.PROPERTY_MIN_UPDATE_DISTANCE, defaultMinUpdateDistance);
		defaultValues.put(TiC.PROPERTY_MIN_UPDATE_TIME, defaultMinUpdateTime);
		handleCreationArgs(null, creationArgs);

		this.providerListener = providerListener;
	}

	/**
	 * Constructor.  Used primarily when creating a location provider via 
	 * internal platform code.
	 * 
	 * @param name					location service that the provider should be associated with
	 * @param minUpdateDistance		the distance in meters that the device should have to move before 
	 * 								the OS sends a location update for this provider
	 * @param minUpdateTime			the interval in milliseconds that the OS should wait before sending 
	 * 								a location update for this provider
	 * @param providerListener		listener that will be notified when a location update is
	 * 								received or the provider state changes
	 */
	public LocationProviderProxy(String name, double minUpdateDistance, double minUpdateTime, LocationProviderListener providerListener)
	{
		super();

		setProperty(TiC.PROPERTY_NAME, name);
		setProperty(TiC.PROPERTY_MIN_UPDATE_DISTANCE, minUpdateDistance);
		setProperty(TiC.PROPERTY_MIN_UPDATE_TIME, minUpdateTime);

		this.providerListener = providerListener;
	}

	/**
	 * @see android.location.LocationListener#onLocationChanged(android.location.Location)
	 */
	@Override
	public void onLocationChanged(Location location)
	{
		providerListener.onLocationChanged(location);
	}

	/**
	 * @see android.location.LocationListener#onProviderDisabled(java.lang.String)
	 */
	@Override
	public void onProviderDisabled(String provider)
	{
		providerListener.onProviderStateChanged(provider, STATE_DISABLED);
	}

	/**
	 * @see android.location.LocationListener#onProviderEnabled(java.lang.String)
	 */
	@Override
	public void onProviderEnabled(String provider)
	{
		providerListener.onProviderStateChanged(provider, STATE_ENABLED);
	}

	/**
	 * @see android.location.LocationListener#onStatusChanged(java.lang.String, int, android.os.Bundle)
	 */
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

	/**
	 * Returns the name associated with this provider
	 * 
	 * @return			name associated with this provider
	 */
	@Kroll.getProperty
	public String getName()
	{
		Object property = getProperty(TiC.PROPERTY_NAME);
		if (property == null) {
			Log.e(TAG, "No name found for location provider");

			return ""; // this shouldnt be possible
		}

		return (String) property;
	}

	/**
	 * Sets the name associated with this provider
	 * 
	 * @param			name to associate with this provider
	 */
	@Kroll.setProperty
	public void setName(String value)
	{
		Log.e(TAG, "Not allowed to set the name of a provider after creation");
	}

	/**
	 * Returns the minimum update distance associated with this provider
	 * 
	 * @return			minimum update distance for this provider
	 */
	@Kroll.getProperty
	public double getMinUpdateDistance()
	{
		Object property = getProperty(TiC.PROPERTY_MIN_UPDATE_DISTANCE);

		try {
			return TiConvert.toDouble(property);
		} catch (NumberFormatException e) {
			Log.e(TAG, "Invalid value [" + property + "] found for minUpdateDistance, returning default");
			return defaultMinUpdateDistance;
		}
	}

	/**
	 * Sets the minimum update distance associated with this provider
	 * 
	 * @param			minimum update distance to associate with this provider
	 */
	@Kroll.setProperty
	public void setMinUpdateDistance(double value)
	{
		setProperty(TiC.PROPERTY_MIN_UPDATE_DISTANCE, value);
		providerListener.onProviderUpdated(this);
	}

	/**
	 * Returns the minimum update time associated with this provider
	 * 
	 * @return			minimum update time for this provider
	 */
	@Kroll.getProperty
	public double getMinUpdateTime()
	{
		Object property = getProperty(TiC.PROPERTY_MIN_UPDATE_TIME);

		try {
			return TiConvert.toDouble(property);
		} catch (NumberFormatException e) {
			Log.e(TAG, "Invalid value [" + property + "] found for minUpdateTime, returning default");
			return defaultMinUpdateTime;
		}
	}

	/**
	 * Sets the minimum update time associated with this provider
	 * 
	 * @param			minimum update time to associate with this provider
	 */
	@Kroll.setProperty
	public void setMinUpdateTime(double value)
	{
		setProperty(TiC.PROPERTY_MIN_UPDATE_TIME, value);
		providerListener.onProviderUpdated(this);
	}
}

