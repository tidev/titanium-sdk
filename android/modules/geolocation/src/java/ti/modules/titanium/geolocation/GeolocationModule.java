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


/**
 * GeolocationModule exposes all common methods and properties relating to geolocation behavior 
 * associated with Ti.Geolocation to the Titanium developer.  Only cross platform API points should 
 * be exposed through this class as Android only API points or types should be put in a Android module 
 * under this module.
 * 
 * The GeolocationModule provides management for 3 different location behavior modes (detailed 
 * descriptions will follow below):
 * <ul>
 * 	<li>legacy - existing behavior found in Titanium Mobile 1.7 and 1.8. <b>DEPRECATED</b></li>
 * 	<li>simple - replacement for the old legacy mode that allows for better parity across platforms</li>
 * 	<li>manual - Android specific mode that exposes full control over the providers and rules</li>
 * </ul>
 * 
 * <p>
 * <b>Legacy location mode</b>:<br>
 * This mode operates on receiving location updates from a single active provider at a time.  Settings 
 * used to pick and register a provider with the OS are pulled from the PROPERTY_ACCURACY, PROPERTY_FREQUENCY
 * and PROPERTY_PREFERRED_PROVIDER properties on the module.
 * <p>
 * The valid accuracy properties for this location mode are ACCURACY_BEST, ACCURACY_NEAREST_TEN_METERS, 
 * ACCURACY_HUNDRED_METERS, ACCURACY_KILOMETER and ACCURACY_THREE_KILOMETERS.  The accuracy property is a 
 * double value that will be used by the OS as a way to determine how many meters should change in location 
 * before a new update is sent.  Accuracy properties other than this will either be ignored or change the 
 * current location behavior mode.  The frequency property is a double value that is used by the OS to determine 
 * how much time in milliseconds should pass before a new update is sent.  
 * <p>
 * The OS uses some fuzzy logic to determine the update frequency and these values are treated as no more than 
 * suggestions.  For example:  setting the frequency to 0 milliseconds and the accuracy to 10 meters may not 
 * result in a update being sent as fast as possible which is what frequency of 0 ms indicates.  This is due to 
 * the OS not sending updates till the accuracy property is satisfied.  If the desired behavior is to get updates 
 * purely based on time then the suggested mechanism would be to set the accuracy to 0 meters and then set the 
 * frequency to the desired update interval in milliseconds.
 * 
 * <p>
 * <b>Simple location mode</b>:<br>
 * This mode operates on receiving location updates from multiple sources.  The simple mode has two states - high 
 * accuracy and low accuracy.  The difference in these two modes is that low accuracy has the passive and network 
 * providers registered by default where the high accuracy state enables the gps provider in addition to the passive 
 * and network providers.  The simple mode utilizes location rules for filtering location updates to try and fall back 
 * gracefully (when in high accuracy state) to the network and passive providers if a gps update has not been received 
 * recently.  
 * <p>
 * No specific controls for time or distance (better terminology in line with native Android docs but these 
 * are called frequency and accuracy in legacy mode) are exposed to the Titanium developer as the details of this mode 
 * are supposed to be driven by Appcelerator based on our observations.  If greater control on the part of the Titanium 
 * developer is needed then the manual behavior mode can and should be used.
 * 
 * <p>
 * <b>Manual location mode</b>:<br>
 * This mode put full control over providers and rules in the hands of the Titanium developer.  The developer will be 
 * responsible for registering location providers, setting time and distance settings per provider and defining the rule 
 * set if any rules are desired.
 * <p>
 * In this mode, the developer would create a Ti.Geolocation.Android.LocationProvider object for each provider they want 
 * to use and add this to the list of manual providers via addLocationProvider(LocationProviderProxy).  In order to set 
 * rules, the developer will have to create a Ti.Geolocation.Android.LocationRule object per rule and then add register 
 * those via addLocationRule(LocationRuleProxy).  These rules will be applied to any location updates that come from the 
 * registered providers.  Further information on the LocationProvider and LocationRule objects can be found by looking at 
 * those specific classes.
 * 
 * <p>
 * <b>General location behavior</b>:<br>
 * The GeolocationModule is capable of switching modes at any time and keeping setting per mode separated.  Changing modes 
 * is usually done by updating the Ti.Geolocation.accuracy property. Based on the new value of the accuracy property, the 
 * legacy or simple modes may be enabled (and turn off the previous mode).  For enabling the manual mode, this is done by 
 * adding or removing location providers or updating existing location providers.  NOTE:  updating the location rules will 
 * not update the mode.
 * <p>
 * In regards to actually "turning on" the providers by registering them with the OS - this is triggered by the presence of 
 * "location" event listeners on the GeolocationModule.  When the first listener is added, providers start being registered 
 * with the OS.  When there are no listeners then all the providers are de-registered.  Changes made to location providers or
 * accuracy, frequency properties or even changing modes are respected and kept but don't actually get applied on the OS until 
 * the listener count is greater than 0.
 */
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

	/**
	 * Constructor
	 */
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

	/**
	 * Constructor
	 * 
	 * @deprecated
	 */
	@Deprecated public GeolocationModule(TiContext tiContext)
	{
		this();
	}

	/**
	 * Called by a registered location provider when a location update is received
	 * 
	 * @param location			location update that was received
	 * 
	 * @see ti.modules.titanium.geolocation.android.LocationProviderProxy.LocationProviderListener#onLocationChanged(android.location.Location)
	 */
	public void onLocationChanged(Location location)
	{
		if(shouldUseUpdate(location)) {
			fireEvent(TiC.EVENT_LOCATION, buildLocationEvent(location, TiLocation.locationManager.getProvider(location.getProvider())));
			currentLocation = location;
			TiLocation.doAnalytics(location);
		}
	}

	/**
	 * Called by a registered location provider when it's state changes
	 * 
	 * @param providerName		name of the provider who's state has changed
	 * @param state				new state of the provider
	 * 
	 * @see ti.modules.titanium.geolocation.android.LocationProviderProxy.LocationProviderListener#onProviderStateChanged(java.lang.String, int)
	 */
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

	/**
	 * Called when the location provider has had one of it's properties updated and thus needs to be re-registered with the OS
	 * 
	 * @param locationProvider		the location provider that needs to be re-registered
	 * 
	 * @see ti.modules.titanium.geolocation.android.LocationProviderProxy.LocationProviderListener#onProviderUpdated(ti.modules.titanium.geolocation.android.LocationProviderProxy)
	 */
	public void onProviderUpdated(LocationProviderProxy locationProvider)
	{
		if((locationBehaviorMode == MANUAL_BEHAVIOR_MODE) && (numLocationListeners > 0)) {
			TiLocation.locationManager.removeUpdates(locationProvider);
			registerLocationProvider(locationProvider);

		} else if(locationBehaviorMode != MANUAL_BEHAVIOR_MODE) {
			enableLocationBehaviorMode(MANUAL_BEHAVIOR_MODE);
		}
	}

	/**
	 * @see org.appcelerator.kroll.KrollModule#propertyChanged(java.lang.String, java.lang.Object, java.lang.Object, org.appcelerator.kroll.KrollProxy)
	 */
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

	/**
	 * @see org.appcelerator.kroll.KrollProxy#eventListenerAdded(java.lang.String, int, org.appcelerator.kroll.KrollProxy)
	 */
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

	/**
	 * @see org.appcelerator.kroll.KrollProxy#eventListenerRemoved(java.lang.String, int, org.appcelerator.kroll.KrollProxy)
	 */
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

	/**
	 * Returns the singleton instance of the module
	 * 
	 * @return			instance of <code>GeolocationModule</code>
	 */
	public static GeolocationModule getInstance()
	{
		return geolocationModule;
	}

	/**
	 * Checks if the device has a compass sensor
	 * 
	 * @return			<code>true</code> if the device has a compass, <code>false</code> if not
	 */
	@Kroll.method @Kroll.getProperty
	public boolean getHasCompass()
	{
		return tiCompass.getHasCompass();
	}

	/**
	 * Retrieves the current compass heading and returns it to the specified Javascript function
	 * 
	 * @param listener			Javascript function that will be invoked with the compass heading
	 */
	@Kroll.method
	public void getCurrentHeading(final KrollFunction listener)
	{
		tiCompass.getCurrentHeading(listener);
	}

	/**
	 * Registers the specified location provider with the OS.  Once the provider is registered, the OS 
	 * will begin to provider location updates as they are available
	 * 
	 * @param locationProvider			location provider to be registered
	 */
	public void registerLocationProvider(LocationProviderProxy locationProvider)
	{
		TiLocation.locationManager.requestLocationUpdates(
				TiConvert.toString(locationProvider.getProperty(TiC.PROPERTY_NAME)), 
				(long) locationProvider.getMinUpdateTime(),
				(float) locationProvider.getMinUpdateDistance(),
				locationProvider);
	}

	/**
	 * Enables the specified location behavior mode by registering the associated 
	 * providers with the OS.  Even if the specified mode is currently active, the 
	 * current mode will be disabled by de-registering all the associated providers 
	 * for that mode with the OS and then registering 
	 * them again.  This can be useful in cases where the properties for all the 
	 * providers have been updated and they need to be re-registered in order for the
	 * change to take effect.
	 * 
	 * @param behaviorMode			behavior mode to enable
	 */
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

	/**
	 * Disables the current mode by de-registering all the associated providers 
	 * for that mode with the OS.  Providers are just de-registered with the OS, 
	 * not removed from the list of providers we associate with the behavior mode.
	 */
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

	/**
	 * Checks if the device has a valid location service present.  The passive location service 
	 * is not counted.
	 * 
	 * @return			<code>true</code> if a valid location service is available on the device, 
	 * 					<code>false</code> if not
	 */
	@Kroll.getProperty @Kroll.method
	public boolean getLocationServicesEnabled()
	{
		return TiLocation.getLocationServicesEnabled();
	}

	/**
	 * Retrieves the last known location and returns it to the specified Javascript function
	 * 
	 * @param callback			Javascript function that will be invoked with the last known location
	 */
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

	/**
	 * Converts the specified address to coordinates and returns the value to the specified 
	 * Javascript function
	 * 
	 * @param address			address to be converted
	 * @param callback			Javascript function that will be invoked with the coordinates 
	 * 							for the specified address if available
	 */
	@Kroll.method
	public void forwardGeocoder(String address, KrollFunction callback)
	{
		TiLocation.forwardGeocode(address, createGeocodeResponseHandler(callback));
	}

	/**
	 * Converts the specified latitude and longitude to a human readable address and returns 
	 * the value to the specified Javascript function
	 * 
	 * @param latitude			latitude to be used in looking up the associated address
	 * @param longitude			longitude to be used in looking up the associated address
	 * @param callback			Javascript function that will be invoked with the address 
	 * 							for the specified latitude and longitude if available
	 */
	@Kroll.method
	public void reverseGeocoder(double latitude, double longitude, KrollFunction callback)
	{
		TiLocation.reverseGeocode(latitude, longitude, createGeocodeResponseHandler(callback));
	}

	/**
	 * Convenience method for creating a response handler that is used when doing a 
	 * geocode lookup.
	 * 
	 * @param callback			Javascript function that the response handler will invoke 
	 * 							once the geocode response is ready
	 * @return					the geocode response handler
	 */
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

	/**
	 * Called to determine if the specified location is "better" than the current location.
	 * This is determined by comparing the new location to the current location according 
	 * to the location rules (if any are set) for the current behavior mode.  If no rules 
	 * are set for the current behavior mode, the new location is always accepted.
	 * 
	 * @param newLocation		location to evaluate
	 * @return					<code>true</code> if the location has been deemed better than 
	 * 							the current location based on the existing rules set for the 
	 * 							current behavior mode, <code>false</code> if not
	 */
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

	/**
	 * Convenience method used to package a location from a location provider into a 
	 * consumable form for the Titanium developer before it is fire back to Javascript.
	 * 
	 * @param location				location that needs to be packaged into consumable form
	 * @param locationProvider		location provider that provided the location update
	 * @return						map of property names and values that contain information 
	 * 								pulled from the specified location
	 */
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


