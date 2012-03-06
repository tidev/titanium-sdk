/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation.android;

import java.util.HashMap;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

import ti.modules.titanium.geolocation.GeolocationModule;
import ti.modules.titanium.geolocation.TiLocation;


@Kroll.module(parentModule=GeolocationModule.class)
public class AndroidModule extends KrollModule
{
	public AndroidModule()
	{
		super();
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
}

