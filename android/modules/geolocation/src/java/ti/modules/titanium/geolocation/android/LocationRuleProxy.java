/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation.android;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.location.Location;


@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_PROVIDER,
	TiC.PROPERTY_TIME,
	TiC.PROPERTY_ACCURACY
})
public class LocationRuleProxy extends KrollProxy
{
	public LocationRuleProxy(Object[] creationArgs)
	{
		super();
		handleCreationArgs(null, creationArgs);
	}

	public boolean check(Location currentLocation, Location newLocation)
	{
		boolean isTrue = true;

		String provider = TiConvert.toString(properties.get(TiC.PROPERTY_PROVIDER));
		if(provider != null) {
			if(provider != newLocation.getProvider()) {
				isTrue = false;
			}
		}

		double time = TiConvert.toDouble(properties.get(TiC.PROPERTY_TIME));
		if(time > 0) {
			// make sure the update breaks the time threshold on the diff of the
			// current and new location
			if(time > (newLocation.getTime() - currentLocation.getTime())) {
				isTrue = false;
			}
		}

		float accuracy = TiConvert.toFloat(properties.get(TiC.PROPERTY_ACCURACY));
		if(accuracy > 0) {
			if(accuracy > newLocation.getAccuracy()) {
				isTrue = false;
			}
		}

		return isTrue;
	}
}

