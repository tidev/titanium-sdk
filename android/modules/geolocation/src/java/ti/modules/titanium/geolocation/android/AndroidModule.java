/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation.android;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.geolocation.GeolocationModule;
import ti.modules.titanium.geolocation.TiLocation;


/**
 * AndroidModule exposes all Android specific methods and properties relating to geolocation behavior 
 * associated with Ti.Geolocation.Android to the Titanium developer.  Cross platform API points should 
 * be exposed through GeolocationModule (Ti.Geolocation).
 * 
 * <p>
 * The main purpose of this class beyond providing a Android specific namespace under Ti.Geolocation is 
 * to support managing manual location providers and location rules.
 */
@Kroll.module(parentModule=GeolocationModule.class)
public class AndroidModule extends KrollModule
{
	public static HashMap<String, LocationProviderProxy> manualLocationProviders = new HashMap<String, LocationProviderProxy>();
	public static ArrayList<LocationRuleProxy> manualLocationRules = new ArrayList<LocationRuleProxy>();

	private static final String TAG = "AndroidModule";

	private static GeolocationModule geolocationModule;


	/**
	 * Constructor
	 */
	public AndroidModule()
	{
		super();

		geolocationModule = GeolocationModule.getInstance();
	}

	/**
	 * Creates a new instance of a location provider.  Mimics that normal proxy mechanism 
	 * provided via annotations.  This is needed due to a flaw in how the annotation driven 
	 * proxy creation works in the sub module.
	 * 
	 * @param creationArgs		creation arguments for the proxy that are passed in from Javascript
	 * @return					new instance of a location provider
	 */
	@Kroll.method
	public LocationProviderProxy createLocationProvider(Object creationArgs[])
	{
		String name = null;

		if(creationArgs[0] instanceof HashMap) {
			Object nameProperty = ((HashMap) creationArgs[0]).get(TiC.PROPERTY_NAME);
			if(nameProperty instanceof String) {
				if(TiLocation.isProvider((String) nameProperty)) {
					name = (String) nameProperty;
				}
			}
		}

		if(name != null) {
			return new LocationProviderProxy(creationArgs, GeolocationModule.getInstance());

		} else {
			throw new IllegalArgumentException("Invalid provider name, unable to create location provider");
		}
	}

	/**
	 * Creates a new instance of a location rule.  Mimics that normal proxy mechanism 
	 * provided via annotations.  This is needed due to a flaw in how the annotation driven 
	 * proxy creation works in the sub module.
	 * 
	 * @param creationArgs		creation arguments for the proxy that are passed in from Javascript
	 * @return					new instance of a location rule
	 */
	@Kroll.method
	public LocationRuleProxy createLocationRule(Object creationArgs[])
	{
		return new LocationRuleProxy(creationArgs);
	}

	/**
	 * Adds the specified location provider to the list of manual location providers.  If a location 
	 * provider with the same "name" property already exists in the list of manual location 
	 * providers then the existing provider will be removed and the specified one will be added in it's
	 * place.
	 * 
	 * @param locationProvider		the location provider to add
	 */
	@Kroll.method
	public void addLocationProvider(LocationProviderProxy locationProvider)
	{
		String providerName = TiConvert.toString(locationProvider.getProperty(TiC.PROPERTY_NAME));
		if (!(TiLocation.isProvider(providerName))) {
			Log.e(TAG, "unable to add location provider [" + providerName + "], does not exist");

			return;
		}

		// if doesn't exist, add new - otherwise update properties
		LocationProviderProxy existingLocationProvider = manualLocationProviders.get(providerName);
		if(existingLocationProvider == null) {
			manualLocationProviders.put(providerName, locationProvider);

		} else {
			manualLocationProviders.remove(providerName);

			if((GeolocationModule.locationBehaviorMode == GeolocationModule.MANUAL_BEHAVIOR_MODE) && (GeolocationModule.numLocationListeners > 0)) {
				TiLocation.locationManager.removeUpdates(existingLocationProvider);
			}

			manualLocationProviders.put(providerName, locationProvider);
		}

		if((GeolocationModule.locationBehaviorMode == GeolocationModule.MANUAL_BEHAVIOR_MODE) && (GeolocationModule.numLocationListeners > 0)) {
			geolocationModule.registerLocationProvider(locationProvider);

		} else {
			geolocationModule.enableLocationBehaviorMode(GeolocationModule.MANUAL_BEHAVIOR_MODE);
		}
	}

	/**
	 * Removed the specified location provider from the list of manual location providers.
	 * 
	 * @param locationProvider		the location provider to remove
	 */
	@Kroll.method
	public void removeLocationProvider(LocationProviderProxy locationProvider)
	{
		manualLocationProviders.remove(locationProvider);
		if((GeolocationModule.locationBehaviorMode == GeolocationModule.MANUAL_BEHAVIOR_MODE) && (GeolocationModule.numLocationListeners > 0)) {
			TiLocation.locationManager.removeUpdates(locationProvider);

		} else {
			geolocationModule.enableLocationBehaviorMode(GeolocationModule.MANUAL_BEHAVIOR_MODE);
		}
	}

	/**
	 * Adds the specified location rule to the list of manual location rules.
	 * 
	 * @param locationRule		the location rule to add
	 */
	@Kroll.method
	public void addLocationRule(LocationRuleProxy locationRule)
	{
		manualLocationRules.add(locationRule);
	}

	/**
	 * Removed the specified location rule from the list of manual location rules.
	 * 
	 * @param locationRule		the location rule to remove
	 */
	@Kroll.method
	public void removeLocationRule(LocationRuleProxy locationRule)
	{
		int locationRuleIndex = manualLocationRules.indexOf(locationRule);
		if(locationRuleIndex > -1) {
			manualLocationRules.remove(locationRuleIndex);
		}
	}
}

