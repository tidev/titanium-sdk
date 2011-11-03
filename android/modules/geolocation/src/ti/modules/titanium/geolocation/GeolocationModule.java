/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiLocationHelper;
import org.appcelerator.titanium.util.TiSensorHelper;

import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Message;


@Kroll.module @ContextSpecific
public class GeolocationModule extends KrollModule
{
	@Kroll.constant public static final int ACCURACY_BEST = TiLocationHelper.ACCURACY_BEST;
	@Kroll.constant public static final int ACCURACY_NEAREST_TEN_METERS = TiLocationHelper.ACCURACY_NEAREST_TEN_METERS;
	@Kroll.constant public static final int ACCURACY_HUNDRED_METERS = TiLocationHelper.ACCURACY_HUNDRED_METERS;
	@Kroll.constant public static final int ACCURACY_KILOMETER = TiLocationHelper.ACCURACY_KILOMETER;
	@Kroll.constant public static final int ACCURACY_THREE_KILOMETERS = TiLocationHelper.ACCURACY_THREE_KILOMETERS;
	@Kroll.constant public static final String PROVIDER_GPS = LocationManager.GPS_PROVIDER;
	@Kroll.constant public static final String PROVIDER_NETWORK = LocationManager.NETWORK_PROVIDER;

	public static final long MAX_GEO_ANALYTICS_FREQUENCY = TiAnalyticsEventFactory.MAX_GEO_ANALYTICS_FREQUENCY;
	public static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	public static final int MSG_LOOKUP = MSG_FIRST_ID + 100;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private static final String LCAT = "GeolocationModule";
	private static final boolean DBG = TiConfig.LOGD;

	private TiCompass tiCompass;
	private TiLocation tiLocation;
	private boolean compassRegistered = false;
	private boolean locationRegistered = false;


	public GeolocationModule(TiContext tiContext)
	{
		super(tiContext);
		tiCompass = new TiCompass(this);
		tiLocation = new TiLocation(this);
	}

	@Override
	public int addEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		if (TiC.EVENT_HEADING.equals(eventName)) {
			if (!compassRegistered) {
				tiCompass.registerListener();
				compassRegistered = true;
			}
		} else if (TiC.EVENT_LOCATION.equals(eventName)) {
			if (!locationRegistered) {
				tiLocation.registerListener();
				locationRegistered = true;
			}
		}
		return super.addEventListener(invocation, eventName, listener);
	}

	@Override
	public void removeEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		if (TiC.EVENT_HEADING.equals(eventName)) {
			if (compassRegistered) {
				tiCompass.unregisterListener();
				compassRegistered = false;
			}
		} else if (TiC.EVENT_LOCATION.equals(eventName)) {
			if (locationRegistered) {
				tiLocation.unregisterListener();
				locationRegistered = false;
			}
		}
		super.removeEventListener(invocation, eventName, listener);
	}

	@Kroll.getProperty @Kroll.method
	public boolean getLocationServicesEnabled(KrollInvocation invocation)
	{
		return tiLocation.getLocationServicesEnabled(invocation);
	}
	
	@Kroll.method
	public boolean isLocationProviderEnabled(KrollInvocation invocation, String requestedProvider)
	{
		return tiLocation.isLocationProviderEnabled(invocation, requestedProvider);
	}

	@Kroll.method @Kroll.getProperty
	public boolean getHasCompass(KrollInvocation invocation)
	{
		return tiCompass.getHasCompass(invocation);
	}

	@Kroll.method
	public void getCurrentHeading(KrollInvocation invocation, final KrollCallback listener)
	{
		tiCompass.getCurrentHeading(invocation, listener);
	}

	@Kroll.method
	public void getCurrentPosition(KrollInvocation invocation, KrollCallback listener)
	{
		tiLocation.getCurrentPosition(invocation, listener);
	}

	@Kroll.method
	public void forwardGeocoder(String address, KrollCallback listener)
	{
		tiLocation.forwardGeocoder(address, listener);
	}

	@Kroll.method
	public void reverseGeocoder(double latitude, double longitude, KrollCallback callback)
	{
		tiLocation.reverseGeocoder(latitude, longitude, callback);
	}

	@Override
	public boolean handleMessage(final Message msg)
	{
		if (msg.what == MSG_LOOKUP) {
			AsyncTask<Object, Void, Integer> task = tiLocation.getLookUpTask();
			task.execute(msg.getData().getString(TiC.PROPERTY_URL), msg.getData().getString(TiC.PROPERTY_DIRECTION), msg.obj);

			return true;
		}

		return super.handleMessage(msg);
	}
}

