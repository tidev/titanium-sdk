/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.geolocation.TiLocation.GeocodeResponseHandler;
import ti.modules.titanium.geolocation.android.AndroidModule;
import ti.modules.titanium.geolocation.android.LocationProviderProxy;
import ti.modules.titanium.geolocation.android.LocationProviderProxy.LocationProviderListener;
import ti.modules.titanium.geolocation.android.LocationRuleProxy;
import android.location.Location;
import android.location.LocationManager;
import android.location.LocationProvider;


@Kroll.module(propertyAccessors={
	TiC.PROPERTY_ACCURACY,
	TiC.PROPERTY_FREQUENCY,
	TiC.PROPERTY_PREFERRED_PROVIDER
})
public class GeolocationModule extends KrollModule
	implements LocationProviderListener
{
	@Kroll.constant public static final String PROVIDER_PASSIVE = LocationManager.PASSIVE_PROVIDER;
	@Kroll.constant public static final String PROVIDER_NETWORK = LocationManager.NETWORK_PROVIDER;
	@Kroll.constant public static final String PROVIDER_GPS = LocationManager.GPS_PROVIDER;
	@Kroll.constant public static final int ACCURACY_BEST = 0;
	@Kroll.constant public static final int ACCURACY_NEAREST_TEN_METERS = 1;
	@Kroll.constant public static final int ACCURACY_HUNDRED_METERS = 2;
	@Kroll.constant public static final int ACCURACY_KILOMETER = 3;
	@Kroll.constant public static final int ACCURACY_THREE_KILOMETERS = 4;
	@Kroll.constant public static final int ACCURACY_HIGH = 5;
	@Kroll.constant public static final int ACCURACY_LOW = 6;

	public static final long MAX_GEO_ANALYTICS_FREQUENCY = TiAnalyticsEventFactory.MAX_GEO_ANALYTICS_FREQUENCY;
	public static final int MANUAL_BEHAVIOR_MODE = 2;

	public static int numLocationListeners = 0;
	public static int locationBehaviorMode; // LEGACY_BEHAVIOR_MODE, SIMPLE_BEHAVIOR_MODE or MANUAL_BEHAVIOR_MODE (found in AndroidModule)

	private static final String TAG = "GeolocationModule";
	private static final boolean DBG = TiConfig.LOGD;
	@Deprecated private static final int LEGACY_BEHAVIOR_MODE = 0;
	private static final int SIMPLE_BEHAVIOR_MODE = 1;
	private static final double SIMPLE_LOCATION_PASSIVE_DISTANCE = 0.0;
	private static final double SIMPLE_LOCATION_PASSIVE_TIME = 0;
	private static final double SIMPLE_LOCATION_NETWORK_DISTANCE = 10.0;
	private static final double SIMPLE_LOCATION_NETWORK_TIME = 10000;
	private static final double SIMPLE_LOCATION_GPS_DISTANCE = 3.0;
	private static final double SIMPLE_LOCATION_GPS_TIME = 3000;
	private static final double SIMPLE_LOCATION_NETWORK_DISTANCE_RULE = 200;
	private static final double SIMPLE_LOCATION_NETWORK_TIME_RULE = 60000;

	private static GeolocationModule geolocationModule;
	@Deprecated private static HashMap<String, LocationProviderProxy> legacyLocationProviders = new HashMap<String, LocationProviderProxy>();
	@Deprecated private static int legacyLocationAccuracyProperty = ACCURACY_NEAREST_TEN_METERS;
	@Deprecated private static HashMap<Integer, Double> legacyLocationAccuracyMap = new HashMap<Integer, Double>();
	@Deprecated private static double legacyLocationFrequency = 5000;
	@Deprecated private static String legacyLocationPreferredProvider = PROVIDER_NETWORK;
	private static HashMap<String, LocationProviderProxy> simpleLocationProviders = new HashMap<String, LocationProviderProxy>();
	private static int simpleLocationAccuracyProperty = ACCURACY_LOW;
	private static ArrayList<LocationRuleProxy> simpleLocationRules = new ArrayList<LocationRuleProxy>();
	private static LocationRuleProxy simpleLocationGpsRule;

	private TiCompass tiCompass;
	private boolean compassListenersRegistered = false;
	private Location currentLocation;


	public GeolocationModule()
	{
		super();

		geolocationModule = this;
		tiCompass = new TiCompass(this);

		// initialize the behavior mode
		locationBehaviorMode = LEGACY_BEHAVIOR_MODE;

		// initialize the legacy location accuracy map
		legacyLocationAccuracyMap.put(ACCURACY_BEST, 0.0); // this needs to be 0.0 to work for only time based updates
		legacyLocationAccuracyMap.put(ACCURACY_NEAREST_TEN_METERS, 10.0);
		legacyLocationAccuracyMap.put(ACCURACY_HUNDRED_METERS, 100.0);
		legacyLocationAccuracyMap.put(ACCURACY_KILOMETER, 1000.0);
		legacyLocationAccuracyMap.put(ACCURACY_THREE_KILOMETERS, 3000.0);

		legacyLocationProviders.put(PROVIDER_NETWORK, new LocationProviderProxy(PROVIDER_NETWORK, 10.0f, legacyLocationFrequency, this));

		simpleLocationProviders.put(PROVIDER_NETWORK, new LocationProviderProxy(PROVIDER_NETWORK, SIMPLE_LOCATION_NETWORK_DISTANCE, SIMPLE_LOCATION_NETWORK_TIME, this));
		simpleLocationProviders.put(PROVIDER_PASSIVE, new LocationProviderProxy(PROVIDER_PASSIVE, SIMPLE_LOCATION_PASSIVE_DISTANCE, SIMPLE_LOCATION_PASSIVE_TIME, this));

		simpleLocationRules.add(new LocationRuleProxy(PROVIDER_NETWORK, SIMPLE_LOCATION_NETWORK_DISTANCE_RULE, SIMPLE_LOCATION_NETWORK_TIME_RULE));

		// create this now but we don't want to include this in the rule set unless the simple GPS provider is enabled
		simpleLocationGpsRule = new LocationRuleProxy(PROVIDER_GPS, null, null);
	}

	public GeolocationModule(TiContext tiContext)
	{
		this();
	}

	public void onLocationChanged(Location location)
	{
		if(shouldUseUpdate(location)) {
			fireEvent(TiC.EVENT_LOCATION, buildLocationEvent(location, TiLocation.locationManager.getProvider(location.getProvider())));
			currentLocation = location;
			TiLocation.doAnalytics(location);
		}
	}

	public void onProviderStateChanged(String providerName, int state)
	{
		String message = providerName;

		// TODO this is trash.  deprecate the existing mechanism of bundling status updates with the
		// location event and create a new "locationState" (or whatever) event like there should
		// have been in the first place.  for the time being, this solution kills my soul slightly
		// less than the previous one
		switch(state) {
			case LocationProviderProxy.STATE_DISABLED:
				message += "is disabled";
				if(DBG) {
					Log.i(TAG, message);
				}
				fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(state, message));

				break;

			case LocationProviderProxy.STATE_ENABLED:
				message += "is enabled";
				if(DBG) {
					Log.i(TAG, message);
				}

				break;

			case LocationProviderProxy.STATE_OUT_OF_SERVICE:
				message += "is out of service";
				if(DBG) {
					Log.i(TAG, message);
				}
				fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(state, message));

				break;

			case LocationProviderProxy.STATE_UNAVAILABLE:
				message += "is unavailable";
				if(DBG) {
					Log.i(TAG, message);
				}
				fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(state, message));

				break;

			case LocationProviderProxy.STATE_AVAILABLE:
				message += "is available";
				if(DBG) {
					Log.i(TAG, message);
				}

				break;

			case LocationProviderProxy.STATE_UNKNOWN:
				message += "is in a unknown state [" + state + "]";
				if(DBG) {
					Log.i(TAG, message);
				}
				fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(state, message));

				break;

			default:
				message += "is in a unknown state [" + state + "]";
				if(DBG) {
					Log.i(TAG, message);
				}
				fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(state, message));

				break;
		}
	}

	public void onProviderUpdated(LocationProviderProxy locationProvider)
	{
		if((locationBehaviorMode == MANUAL_BEHAVIOR_MODE) && (numLocationListeners > 0)) {
			TiLocation.locationManager.removeUpdates(locationProvider);
			registerLocationProvider(locationProvider);

		} else if(locationBehaviorMode != MANUAL_BEHAVIOR_MODE) {
			enableLocationBehaviorMode(MANUAL_BEHAVIOR_MODE);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if(key.equals(TiC.PROPERTY_ACCURACY)) {
			int accuracyProperty = TiConvert.toInt(newValue);

			// is this a legacy accuracy property?
			Double accuracyLookupResult = legacyLocationAccuracyMap.get(accuracyProperty);
			if(accuracyLookupResult != null) {
				// has the value changed from the last known good value?
				if(accuracyProperty != legacyLocationAccuracyProperty) {
					legacyLocationAccuracyProperty = accuracyProperty;

					Iterator<String> iterator = legacyLocationProviders.keySet().iterator();
					while(iterator.hasNext()) {
						LocationProviderProxy locationProvider = legacyLocationProviders.get(iterator.next());
						locationProvider.setProperty(TiC.PROPERTY_MIN_UPDATE_DISTANCE, accuracyLookupResult);
					}
				}

				if(((accuracyProperty != legacyLocationAccuracyProperty) && (locationBehaviorMode == LEGACY_BEHAVIOR_MODE)) || (locationBehaviorMode != LEGACY_BEHAVIOR_MODE)) {
					enableLocationBehaviorMode(LEGACY_BEHAVIOR_MODE);
				}

			// is this a simple accuracy property?
			} else if((accuracyProperty == ACCURACY_HIGH) || (accuracyProperty == ACCURACY_LOW)) {
				// has the value changed from the last known good value?
				if(accuracyProperty != simpleLocationAccuracyProperty) {
					simpleLocationAccuracyProperty = accuracyProperty;
					LocationProviderProxy gpsProvider = simpleLocationProviders.get(PROVIDER_GPS);

					if((accuracyProperty == ACCURACY_HIGH) && (gpsProvider == null)) {
						gpsProvider = new LocationProviderProxy(PROVIDER_GPS, SIMPLE_LOCATION_GPS_DISTANCE, SIMPLE_LOCATION_GPS_TIME, this);
						simpleLocationProviders.put(PROVIDER_GPS, gpsProvider);
						simpleLocationRules.add(simpleLocationGpsRule);

						if((locationBehaviorMode == SIMPLE_BEHAVIOR_MODE) && (numLocationListeners > 0)) {
							registerLocationProvider(gpsProvider);
						}

					} else if((accuracyProperty == ACCURACY_LOW) && (gpsProvider != null)) {
						simpleLocationProviders.remove(PROVIDER_GPS);
						simpleLocationRules.remove(simpleLocationGpsRule);

						if((locationBehaviorMode == SIMPLE_BEHAVIOR_MODE) && (numLocationListeners > 0)) {
							TiLocation.locationManager.removeUpdates(gpsProvider);
						}
					}
				}

				if(locationBehaviorMode != SIMPLE_BEHAVIOR_MODE) {
					enableLocationBehaviorMode(SIMPLE_BEHAVIOR_MODE);
				}
			}

		} else if(key.equals(TiC.PROPERTY_FREQUENCY)) {
			double frequencyProperty = TiConvert.toDouble(newValue) * 1000;
			if(frequencyProperty != legacyLocationFrequency) {
				legacyLocationFrequency = frequencyProperty;

				Iterator<String> iterator = legacyLocationProviders.keySet().iterator();
				while(iterator.hasNext()) {
					LocationProviderProxy locationProvider = legacyLocationProviders.get(iterator.next());
					locationProvider.setProperty(TiC.PROPERTY_MIN_UPDATE_TIME, legacyLocationFrequency);
				}
			}

			if(((frequencyProperty != legacyLocationFrequency) && (locationBehaviorMode == LEGACY_BEHAVIOR_MODE)) || (locationBehaviorMode != LEGACY_BEHAVIOR_MODE)) {
				enableLocationBehaviorMode(LEGACY_BEHAVIOR_MODE);
			}

		} else if(key.equals(TiC.PROPERTY_PREFERRED_PROVIDER)) {
			String preferredProviderProperty = TiConvert.toString(newValue);
			if(!(preferredProviderProperty.equals(PROVIDER_NETWORK)) && (!(preferredProviderProperty.equals(PROVIDER_GPS)))) {
				return;
			}

			if(!(preferredProviderProperty.equals(legacyLocationPreferredProvider))) {
				LocationProviderProxy newProvider = legacyLocationProviders.get(preferredProviderProperty);
				LocationProviderProxy oldProvider = legacyLocationProviders.get(legacyLocationPreferredProvider);

				if(oldProvider != null) {
					legacyLocationProviders.remove(legacyLocationPreferredProvider);

					if((locationBehaviorMode == LEGACY_BEHAVIOR_MODE) && (numLocationListeners > 0)) {
						TiLocation.locationManager.removeUpdates(oldProvider);
					}
				}

				if(newProvider == null) {
					newProvider = new LocationProviderProxy(preferredProviderProperty, legacyLocationAccuracyMap.get(legacyLocationAccuracyProperty), legacyLocationFrequency, this);
					legacyLocationProviders.put(preferredProviderProperty, newProvider);

					if((locationBehaviorMode == LEGACY_BEHAVIOR_MODE) && (numLocationListeners > 0)) {
						registerLocationProvider(newProvider);
					}
				}

				legacyLocationPreferredProvider = preferredProviderProperty;
			}

			if(locationBehaviorMode != LEGACY_BEHAVIOR_MODE) {
				enableLocationBehaviorMode(LEGACY_BEHAVIOR_MODE);
			}
		}
	}

	@Override
	protected void eventListenerAdded(String event, int count, KrollProxy proxy)
	{
		if (TiC.EVENT_HEADING.equals(event)) {
			if (!compassListenersRegistered) {
				tiCompass.registerListener();
				compassListenersRegistered = true;
			}

		} else if (TiC.EVENT_LOCATION.equals(event)) {
			numLocationListeners++;
			if(numLocationListeners == 1) {
				enableLocationBehaviorMode(locationBehaviorMode);

				// fire off an initial location fix if one is available
				Location lastKnownLocation = TiLocation.getLastKnownLocation();
				if(lastKnownLocation != null) {
					fireEvent(TiC.EVENT_LOCATION, buildLocationEvent(lastKnownLocation, TiLocation.locationManager.getProvider(lastKnownLocation.getProvider())));
				}
			}
		}

		super.eventListenerAdded(event, count, proxy);
	}

	@Override
	protected void eventListenerRemoved(String event, int count, KrollProxy proxy)
	{
		if (TiC.EVENT_HEADING.equals(event)) {
			if (compassListenersRegistered) {
				tiCompass.unregisterListener();
				compassListenersRegistered = false;
			}

		} else if (TiC.EVENT_LOCATION.equals(event)) {
			numLocationListeners--;
			if(numLocationListeners == 0) {
				disableLocationProviders();
			}
		}

		super.eventListenerRemoved(event, count, proxy);
	}

	public static GeolocationModule getInstance()
	{
		return geolocationModule;
	}

	@Kroll.method @Kroll.getProperty
	public boolean getHasCompass()
	{
		return tiCompass.getHasCompass();
	}

	@Kroll.method
	public void getCurrentHeading(final KrollFunction listener)
	{
		tiCompass.getCurrentHeading(listener);
	}

	public void registerLocationProvider(LocationProviderProxy locationProvider)
	{
		TiLocation.locationManager.requestLocationUpdates(
				TiConvert.toString(locationProvider.getProperty(TiC.PROPERTY_NAME)), 
				(long) locationProvider.getMinUpdateTime(),
				(float) locationProvider.getMinUpdateDistance(),
				locationProvider);
	}

	public void enableLocationBehaviorMode(int behaviorMode)
	{
		HashMap<String, LocationProviderProxy> locationProviders = new HashMap<String, LocationProviderProxy>();
		boolean validMode = false;

		if(behaviorMode == LEGACY_BEHAVIOR_MODE) {
			locationProviders = legacyLocationProviders;
			validMode = true;

		} else if(behaviorMode == SIMPLE_BEHAVIOR_MODE) {
			locationProviders = simpleLocationProviders;
			validMode = true;

		} else if(behaviorMode == MANUAL_BEHAVIOR_MODE) {
			locationProviders = AndroidModule.manualLocationProviders;
			validMode = true;

		}

		if(!validMode) {
			return;
		}

		locationBehaviorMode = behaviorMode;

		if(numLocationListeners > 0) {
			disableLocationProviders();

			Iterator<String> iterator = locationProviders.keySet().iterator();
			while(iterator.hasNext()) {
				LocationProviderProxy locationProvider = locationProviders.get(iterator.next());
				registerLocationProvider(locationProvider);
			}
		}
	}

	private void disableLocationProviders()
	{
		Iterator<String> iterator = simpleLocationProviders.keySet().iterator();
		while(iterator.hasNext()) {
			LocationProviderProxy locationProvider = simpleLocationProviders.get(iterator.next());
			TiLocation.locationManager.removeUpdates(locationProvider);
		}

		iterator = AndroidModule.manualLocationProviders.keySet().iterator();
		while(iterator.hasNext()) {
			LocationProviderProxy locationProvider = AndroidModule.manualLocationProviders.get(iterator.next());
			TiLocation.locationManager.removeUpdates(locationProvider);
		}

		iterator = legacyLocationProviders.keySet().iterator();
		while(iterator.hasNext()) {
			LocationProviderProxy locationProvider = legacyLocationProviders.get(iterator.next());
			TiLocation.locationManager.removeUpdates(locationProvider);
		}
	}

	@Kroll.getProperty @Kroll.method
	public boolean getLocationServicesEnabled()
	{
		return TiLocation.getLocationServicesEnabled();
	}

	@Kroll.method
	public void getCurrentPosition(KrollFunction callback)
	{
		if (callback != null) {
			Location latestKnownLocation = TiLocation.getLastKnownLocation();

			if (latestKnownLocation != null) {
				callback.call(this.getKrollObject(), new Object[] {
					buildLocationEvent(latestKnownLocation, TiLocation.locationManager.getProvider(latestKnownLocation.getProvider()))
				});

				TiLocation.doAnalytics(latestKnownLocation);

			} else {
				Log.e(TAG, "unable to get current position, location is null");
				callback.call(this.getKrollObject(), new Object[] {
					TiConvert.toErrorObject(TiLocation.ERR_POSITION_UNAVAILABLE, "location is currently unavailable.")
				});
			}
		}
	}

	@Kroll.method
	public void forwardGeocoder(String address, KrollFunction callback)
	{
		TiLocation.forwardGeocode(address, createGeocodeResponseHandler(callback));
	}

	@Kroll.method
	public void reverseGeocoder(double latitude, double longitude, KrollFunction callback)
	{
		TiLocation.reverseGeocode(latitude, longitude, createGeocodeResponseHandler(callback));
	}

	private GeocodeResponseHandler createGeocodeResponseHandler(final KrollFunction callback)
	{
		return new GeocodeResponseHandler() {
			@Override
			public void handleGeocodeResponse(HashMap<String, Object> geocodeResponse)
			{
				geocodeResponse.put(TiC.EVENT_PROPERTY_SOURCE, geolocationModule);
				callback.call(getKrollObject(), new Object[] { geocodeResponse });
			}
		};
	}

	private boolean shouldUseUpdate(Location newLocation)
	{
		boolean passed = false;

		if(locationBehaviorMode == SIMPLE_BEHAVIOR_MODE) {
			for(LocationRuleProxy rule : simpleLocationRules) {
				if(rule.check(currentLocation, newLocation)) {
					passed = true;
				}
			}

		} else if(locationBehaviorMode == MANUAL_BEHAVIOR_MODE) {
			// no rules have been set so always accept the update
			if(AndroidModule.manualLocationRules.size() > 0) {
				for(LocationRuleProxy rule : AndroidModule.manualLocationRules) {
					if(rule.check(currentLocation, newLocation)) {
						passed = true;
					}
				}

			} else {
				passed = true; // no rules set, always accept
			}

		} else {
			// the legacy mode will fall here, don't filter the results
			passed = true;
		}

		return passed;
	}

	private HashMap<String, Object> buildLocationEvent(Location location, LocationProvider locationProvider)
	{
		HashMap<String, Object> coordinates = new HashMap<String, Object>();
		coordinates.put(TiC.PROPERTY_LATITUDE, location.getLatitude());
		coordinates.put(TiC.PROPERTY_LONGITUDE, location.getLongitude());
		coordinates.put(TiC.PROPERTY_ALTITUDE, location.getAltitude());
		coordinates.put(TiC.PROPERTY_ACCURACY, location.getAccuracy());
		coordinates.put(TiC.PROPERTY_ALTITUDE_ACCURACY, null); // Not provided
		coordinates.put(TiC.PROPERTY_HEADING, location.getBearing());
		coordinates.put(TiC.PROPERTY_SPEED, location.getSpeed());
		coordinates.put(TiC.PROPERTY_TIMESTAMP, location.getTime());

		HashMap<String, Object> event = new HashMap<String, Object>();
		event.put(TiC.PROPERTY_SUCCESS, true);
		event.put(TiC.PROPERTY_COORDS, coordinates);

		if (locationProvider != null) {
			HashMap<String, Object> provider = new HashMap<String, Object>();
			provider.put(TiC.PROPERTY_NAME, locationProvider.getName());
			provider.put(TiC.PROPERTY_ACCURACY, locationProvider.getAccuracy());
			provider.put(TiC.PROPERTY_POWER, locationProvider.getPowerRequirement());

			event.put(TiC.PROPERTY_PROVIDER, provider);
		}

		return event;
	}
}


