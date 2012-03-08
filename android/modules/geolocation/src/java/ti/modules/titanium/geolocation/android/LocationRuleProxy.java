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
import org.appcelerator.titanium.util.TiConvert;

import android.location.Location;


@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_PROVIDER,
	TiC.PROPERTY_ACCURACY,
	TiC.PROPERTY_TIME
})
public class LocationRuleProxy extends KrollProxy
{
	public LocationRuleProxy(Object[] creationArgs)
	{
		super();

		handleCreationArgs(null, creationArgs);
	}

	public LocationRuleProxy(String provider, Double accuracy, Double time)
	{
		super();

		setProperty(TiC.PROPERTY_PROVIDER, provider);
		setProperty(TiC.PROPERTY_ACCURACY, accuracy);
		setProperty(TiC.PROPERTY_TIME, time);
	}

	public boolean check(Location currentLocation, Location newLocation)
	{
		boolean passed = true;

		String provider = TiConvert.toString(properties.get(TiC.PROPERTY_PROVIDER));
		if(provider != null) {
			if(!(provider.equals(newLocation.getProvider()))) {
				passed = false;
			}
		}

		Object rawAccuracy = properties.get(TiC.PROPERTY_ACCURACY);
		if(rawAccuracy != null) {
			double accuracyValue = TiConvert.toDouble(rawAccuracy);
			if(accuracyValue < newLocation.getAccuracy()) {
				passed = false;
			}
		}

		Object rawTime = properties.get(TiC.PROPERTY_TIME);
		if(rawTime != null) {
			double timeValue = TiConvert.toDouble(rawTime);

			// make sure the update breaks the time threshold on the diff of the
			// current and new location
			if(timeValue < (newLocation.getTime() - currentLocation.getTime())) {
				passed = false;
			}
		}

		return passed;
	}
}

