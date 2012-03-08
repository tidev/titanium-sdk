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


@Kroll.module(parentModule=GeolocationModule.class)
public class AndroidModule extends KrollModule
{
	public static HashMap<String, LocationProviderProxy> manualLocationProviders = new HashMap<String, LocationProviderProxy>();
	public static ArrayList<LocationRuleProxy> manualLocationRules = new ArrayList<LocationRuleProxy>();

	private static final String TAG = "AndroidModule";

	private static GeolocationModule geolocationModule;


	public AndroidModule()
	{
		super();

		geolocationModule = GeolocationModule.getInstance();
	}

	// mimic the generated create function
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

	// mimic the generated create function
	@Kroll.method
	public LocationRuleProxy createLocationRule(Object creationArgs[])
	{
		return new LocationRuleProxy(creationArgs);
	}

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

	@Kroll.method
	public void addLocationRule(LocationRuleProxy locationRule)
	{
		manualLocationRules.add(locationRule);
	}

	@Kroll.method
	public void removeLocationRule(LocationRuleProxy locationRule)
	{
		int locationRuleIndex = manualLocationRules.indexOf(locationRule);
		if(locationRuleIndex > -1) {
			manualLocationRules.remove(locationRuleIndex);
		}
	}
}

