/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumGeolocation;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEvent;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEventFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;
import android.webkit.WebView;

public class TitaniumGeolocation extends TitaniumBaseModule implements ITitaniumGeolocation
{
	private static final String LCAT = "TiGeo";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final int ERR_UNKNOWN_ERROR = 0;
	protected static final int ERR_PERMISSION_DENIED = 1;
	protected static final int ERR_POSITION_UNAVAILABLE = 2;
	protected static final int ERR_TIMEOUT = 3;

	public static final long MAX_GEO_ANALYTICS_FREQUENCY = 60000L;

	protected static final String OPTION_HIGH_ACCURACY = "enableHighAccuracy";

	public static final String EVENT_GEO = "geo";

	protected TitaniumApplication app;
	protected TitaniumJSEventManager eventManager;
	protected LocationManager locationManager;
	protected LocationListener geoListener;
	protected boolean listeningForGeo;
	protected Criteria criteria;

	protected long lastEventTimestamp; // This counter is instance specific. The actually queuing code
	                                   // will arbitrate between other instances. Since only one activity
									   // at a time can be active, there shouldn't be any contention.

	public TitaniumGeolocation(TitaniumModuleManager manager, String moduleName)
	{
		super(manager, moduleName);
		eventManager = new TitaniumJSEventManager(manager);
		eventManager.supportEvent(EVENT_GEO);
		lastEventTimestamp = 0;
		app = (TitaniumApplication) manager.getActivity().getApplication();

		listeningForGeo = false;

		geoListener = new LocationListener() {

			public void onLocationChanged(Location location) {
				LocationProvider provider = locationManager.getProvider(location.getProvider());
				try {
					eventManager.invokeSuccessListeners(EVENT_GEO, locationToJSONString(location, provider));
					if (location.getTime() - lastEventTimestamp > MAX_GEO_ANALYTICS_FREQUENCY) {
						// Null is returned if it's too early to send another event.
						TitaniumAnalyticsEvent event = TitaniumAnalyticsEventFactory.createAppGeoEvent(location);
						if (event != null) {
							app.postAnalyticsEvent(event);
							lastEventTimestamp = location.getTime();
						}
					}
				} catch (JSONException e) {
					eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_UNKNOWN_ERROR, e.getMessage()));
				}
			}

			public void onProviderDisabled(String provider) {
				Log.d(LCAT, "Provider disabled: " + provider);
				eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_POSITION_UNAVAILABLE, provider + " disabled."));
			}

			public void onProviderEnabled(String provider) {
				Log.d(LCAT, "Provider enabled: " + provider);
				eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_POSITION_UNAVAILABLE, provider + " enabled."));
			}

			public void onStatusChanged(String provider, int status, Bundle extras) {
				Log.d(LCAT, "Status changed, provider = " + provider + " status=" + status);
				switch (status) {
				case LocationProvider.OUT_OF_SERVICE :
					eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_POSITION_UNAVAILABLE, provider + " is out of service."));
					break;
				case LocationProvider.TEMPORARILY_UNAVAILABLE:
					eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_POSITION_UNAVAILABLE, provider + " is currently unavailable."));
					break;
				case LocationProvider.AVAILABLE :
					eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_POSITION_UNAVAILABLE, provider + " is available."));
					break;
				}
			}
		};
	}

	@Override
	public void register(WebView webView) {
		String name = super.getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumGeolocation as " + name);
		}
		webView.addJavascriptInterface((ITitaniumGeolocation) this, name);
	}

	public void getCurrentPosition(String successListener, String failureListener, String options)
	{
		if (locationManager != null) {
			String provider = locationManager.getBestProvider(createCriteria(options, Criteria.ACCURACY_FINE), true);
			Location loc = locationManager.getLastKnownLocation(provider);

			if (loc != null) {
				try {
					invokeUserCallback(successListener, locationToJSONString(loc, locationManager.getProvider(provider)));
				} catch (JSONException e) {
					String msg = "Error creating result object: " + e.getMessage();
					invokeUserCallback(failureListener, createJSONError(ERR_UNKNOWN_ERROR, msg));
				}
			} else {
				invokeUserCallback(failureListener, createJSONError(ERR_POSITION_UNAVAILABLE, "No last known location."));
			}
		} else {
			invokeUserCallback(failureListener, createJSONError(ERR_POSITION_UNAVAILABLE, "Location manager is not available."));
		}
	}

	public int watchPosition(String successListener, String failureListener, String options)
	{
		int pos = -1;

		if (locationManager != null) {

			//TODO handle multiple sets of criteria
			this.criteria = createCriteria(options);
			String provider = locationManager.getBestProvider(criteria, true);
			if (provider != null) {
				pos = eventManager.addListener(EVENT_GEO, successListener, failureListener);
				if (!listeningForGeo) {
					manageGeoListener(true, provider);
				}
			}
		} else {
			invokeUserCallback(failureListener, createJSONError(ERR_POSITION_UNAVAILABLE, "Location manager is not available."));
		}

		return pos;
	}

	public void clearWatch(int watchId)
	{
		eventManager.removeListener(EVENT_GEO, watchId);
		if (listeningForGeo && !eventManager.hasListeners(EVENT_GEO)) {
			manageGeoListener(false, null);
		}
	}

	protected void manageGeoListener(boolean register, String provider)
	{
		if (locationManager != null) {
			if (register) {
				locationManager.requestLocationUpdates(provider, 5000, 1.0f, geoListener);
				listeningForGeo = true;
			} else {
				if (listeningForGeo) {
					locationManager.removeUpdates(geoListener);
					listeningForGeo = false;
				}
			}
		}
	}

	@Override
	public void onResume() {
		super.onResume();

		locationManager = (LocationManager) getActivity().getSystemService(Context.LOCATION_SERVICE);
		if (eventManager.hasListeners(EVENT_GEO)) {
			String provider = locationManager.getBestProvider(criteria, true);
			if (provider != null) {
				manageGeoListener(true, provider);
			}
		}
	}

	@Override
	public void onPause() {
		super.onPause();

		if (listeningForGeo) {
			manageGeoListener(false, null);
		}
		locationManager = null;
	}

	protected Criteria createCriteria(String json) {
		return createCriteria(json, Criteria.ACCURACY_COARSE);
	}

	protected Criteria createCriteria(String json, int defaultAccuracy)
	{
		Criteria criteria = new Criteria();
		criteria.setAccuracy(defaultAccuracy);

		if (json != null) {
			try {
				JSONObject o = new JSONObject(json);

				if (o.has(OPTION_HIGH_ACCURACY)) {
					if (o.getBoolean(OPTION_HIGH_ACCURACY)) {
						criteria.setAccuracy(Criteria.ACCURACY_FINE);
						criteria.setAltitudeRequired(true);
						criteria.setBearingRequired(true);
						criteria.setSpeedRequired(true);
					} else {
						criteria.setAccuracy(Criteria.ACCURACY_COARSE);
					}
				}
			} catch (JSONException e) {
				Log.e(LCAT, "Error parsing options: ", e);
			}
		}

		return criteria;
	}

	protected String locationToJSONString(Location loc, LocationProvider provider) throws JSONException
	{
		String result = null;

		JSONObject coords = new JSONObject();
		coords.put("latitude", loc.getLatitude());
		coords.put("longitude", loc.getLongitude());
		coords.put("altitude", loc.getAltitude());
		coords.put("accuracy", loc.getAccuracy());
		coords.put("altitudeAccuracy",null); // Not provided
		coords.put("heading", loc.getBearing());
		coords.put("speed", loc.getSpeed());

		JSONObject pos = new JSONObject();
		pos.put("coords", coords);
		pos.put("timestamp", loc.getTime());

		if (provider != null) {
			JSONObject p = new JSONObject();

			p.put("name", provider.getName());
			p.put("accuracy", provider.getAccuracy());
			p.put("power", provider.getPowerRequirement());

			pos.put("provider", p);
		}

		result = pos.toString();

		return result;
	}
}
