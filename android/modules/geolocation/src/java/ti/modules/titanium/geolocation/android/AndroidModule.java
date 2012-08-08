/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation.android;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.geolocation.GeolocationModule;
import ti.modules.titanium.geolocation.TiLocation;
import android.location.LocationManager;
import android.os.Handler;
import android.os.Message;


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
	implements Handler.Callback
{
	@Kroll.constant public static final String PROVIDER_PASSIVE = LocationManager.PASSIVE_PROVIDER;
	@Kroll.constant public static final String PROVIDER_NETWORK = LocationManager.NETWORK_PROVIDER;
	@Kroll.constant public static final String PROVIDER_GPS = LocationManager.GPS_PROVIDER;

	public HashMap<String, LocationProviderProxy> manualLocationProviders = new HashMap<String, LocationProviderProxy>();
	public ArrayList<LocationRuleProxy> manualLocationRules = new ArrayList<LocationRuleProxy>();
	public boolean manualMode = false;

	protected static final int MSG_ADD_LOCATION_PROVIDER = KrollModule.MSG_LAST_ID + 100;
	protected static final int MSG_REMOVE_LOCATION_PROVIDER = KrollModule.MSG_LAST_ID + 101;
	protected static final int MSG_LAST_ID = MSG_REMOVE_LOCATION_PROVIDER;

	private static final String TAG = "AndroidModule";

	private GeolocationModule geolocationModule;
	private TiLocation tiLocation;


	/**
	 * Constructor
	 */
	public AndroidModule()
	{
		super("geolocation.android");

		geolocationModule = (GeolocationModule) TiApplication.getInstance().getModuleByName("geolocation");
		geolocationModule.androidModule = this;
		tiLocation = geolocationModule.tiLocation;
	}

	/**
	 * @see org.appcelerator.kroll.KrollProxy#handleMessage(android.os.Message)
	 */
	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_ADD_LOCATION_PROVIDER: {
				Object locationProvider = msg.obj;
				doAddLocationProvider((LocationProviderProxy) locationProvider);

				return true;
			}
			case MSG_REMOVE_LOCATION_PROVIDER: {
				Object locationProvider = msg.obj;
				doRemoveLocationProvider((LocationProviderProxy) locationProvider);

				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if the manual location providers are being used instead of the simple 
	 * or legacy providers
	 * 
	 * @return			<code>true</code> if the manual location providers are being 
	 * 					used, <code>false</code> if not
	 */
	@Kroll.getProperty
	public boolean getManualMode()
	{
		return manualMode;
	}

	/**
	 * Sets whether the manual location providers should be used in place of the 
	 * simple or legacy providers
	 * 
	 * @param manualMode			<code>boolean</code> value to indicate whether 
	 * 								the manual providers should be used
	 */
	@Kroll.setProperty
	public void setManualMode(boolean manualMode)
	{
		if (this.manualMode != manualMode) {
			this.manualMode = manualMode;
			if (manualMode) {
				geolocationModule.enableLocationProviders(manualLocationProviders);

			} else {
				if (geolocationModule.legacyModeActive) {
					geolocationModule.enableLocationProviders(geolocationModule.legacyLocationProviders);

				} else {
					geolocationModule.enableLocationProviders(geolocationModule.simpleLocationProviders);
				}
			}
		}
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

		if ((creationArgs.length > 0) && (creationArgs[0] instanceof HashMap)) {
			Object nameProperty = ((HashMap) creationArgs[0]).get(TiC.PROPERTY_NAME);
			if (nameProperty instanceof String) {
				if (tiLocation.isProvider((String) nameProperty)) {
					name = (String) nameProperty;
				}
			}
		}

		if (name != null) {
			return new LocationProviderProxy(creationArgs, geolocationModule);

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
	 * Wrapper to ensure task executes on the runtime thread
	 * 
	 * @param locationProvider		the location provider to add
	 */
	@Kroll.method
	public void addLocationProvider(LocationProviderProxy locationProvider)
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			doAddLocationProvider(locationProvider);

		} else {
			Message message = getRuntimeHandler().obtainMessage(MSG_ADD_LOCATION_PROVIDER, locationProvider);
			message.sendToTarget();
		}
	}

	/**
	 * Adds the specified location provider to the list of manual location providers.  If a location 
	 * provider with the same "name" property already exists in the list of manual location 
	 * providers then the existing provider will be removed and the specified one will be added in it's
	 * place.
	 * 
	 * @param locationProvider		the location provider to add
	 */
	private void doAddLocationProvider(LocationProviderProxy locationProvider)
	{
		String providerName = TiConvert.toString(locationProvider.getProperty(TiC.PROPERTY_NAME));
		if (!(tiLocation.isProvider(providerName))) {
			Log.e(TAG, "Unable to add location provider [" + providerName + "], does not exist");

			return;
		}

		// if doesn't exist, add new - otherwise update properties
		LocationProviderProxy existingLocationProvider = manualLocationProviders.get(providerName);
		if (existingLocationProvider == null) {
			manualLocationProviders.put(providerName, locationProvider);

		} else {
			manualLocationProviders.remove(providerName);

			if (manualMode && (geolocationModule.numLocationListeners > 0)) {
				tiLocation.locationManager.removeUpdates(existingLocationProvider);
			}

			manualLocationProviders.put(providerName, locationProvider);
		}

		if (manualMode && (geolocationModule.numLocationListeners > 0)) {
			geolocationModule.registerLocationProvider(locationProvider);

		}
	}

	/**
	 * Wrapper to ensure task executes on the runtime thread
	 * 
	 * @param locationProvider		the location provider to remove
	 */
	@Kroll.method
	public void removeLocationProvider(LocationProviderProxy locationProvider)
	{
		if (KrollRuntime.getInstance().isRuntimeThread()) {
			doRemoveLocationProvider(locationProvider);

		} else {
			Message message = getRuntimeHandler().obtainMessage(MSG_REMOVE_LOCATION_PROVIDER, locationProvider);
			message.sendToTarget();
		}
	}

	/**
	 * Removed the specified location provider from the list of manual location providers.
	 * 
	 * @param locationProvider		the location provider to remove
	 */
	private void doRemoveLocationProvider(LocationProviderProxy locationProvider)
	{
		manualLocationProviders.remove(locationProvider.getName());
		if (manualMode && (geolocationModule.numLocationListeners > 0)) {
			tiLocation.locationManager.removeUpdates(locationProvider);
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
		if (locationRuleIndex > -1) {
			manualLocationRules.remove(locationRuleIndex);
		}
	}
}

