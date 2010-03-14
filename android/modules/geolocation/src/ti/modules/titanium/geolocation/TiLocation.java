/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.util.List;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Context;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;

public class TiLocation
{
	private static final String LCAT = "TiLocation";
	private static final Boolean DBG = TiConfig.LOGD;

	public static final int ERR_UNKNOWN_ERROR = 0;
	public static final int ERR_PERMISSION_DENIED = 1;
	public static final int ERR_POSITION_UNAVAILABLE = 2;
	public static final int ERR_TIMEOUT = 3;

	public static final int ACCURACY_BEST = 0;
	public static final int ACCURACY_NEAREST_TEN_METERS = 1;
	public static final int ACCURACY_HUNDRED_METERS = 2;
	public static final int ACCURACY_KILOMETER = 3;
	public static final int ACCURACY_THREE_KILOMETERS = 4;

	public static final long MAX_GEO_ANALYTICS_FREQUENCY = 60000L;

	public static final String EVENT_LOCATION = "location";

	protected static final String OPTION_HIGH_ACCURACY = "enableHighAccuracy";

	private TiModule proxy;

	protected LocationManager locationManager;
	protected LocationListener geoListener;
	protected boolean listeningForGeo;

	protected long lastEventTimestamp; // This counter is instance specific. The actually queuing code
	                                   // will arbitrate between other instances. Since only one activity
									   // at a time can be active, there shouldn't be any contention.

	public TiLocation(TiModule proxy)
	{
		this.proxy = proxy;
		final TiModule fproxy = proxy;
		listeningForGeo = false;

		geoListener = new LocationListener() {

			public void onLocationChanged(Location location) {
				if (locationManager != null) {
					LocationProvider provider = locationManager.getProvider(location.getProvider());
					fproxy.fireEvent(EVENT_LOCATION, locationToTiDict(location, provider));
					if (location.getTime() - lastEventTimestamp > MAX_GEO_ANALYTICS_FREQUENCY) {
						// Null is returned if it's too early to send another event.
						// TODO Analytics
	//						TitaniumAnalyticsEvent event = TitaniumAnalyticsEventFactory.createAppGeoEvent(location);
	//						if (event != null) {
	//							app.postAnalyticsEvent(event);
	//							lastEventTimestamp = location.getTime();
	//						}
					}
				}
			}

			public void onProviderDisabled(String provider) {
				Log.d(LCAT, "Provider disabled: " + provider);
				fproxy.fireEvent(EVENT_LOCATION, TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, provider + " disabled."));
			}

			public void onProviderEnabled(String provider) {
				Log.d(LCAT, "Provider enabled: " + provider);
				//eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_POSITION_UNAVAILABLE, provider + " enabled."));
			}

			public void onStatusChanged(String provider, int status, Bundle extras) {
				Log.d(LCAT, "Status changed, provider = " + provider + " status=" + status);
				switch (status) {
				case LocationProvider.OUT_OF_SERVICE :
					fproxy.fireEvent(EVENT_LOCATION, TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, provider + " is out of service."));
					break;
				case LocationProvider.TEMPORARILY_UNAVAILABLE:
					fproxy.fireEvent(EVENT_LOCATION, TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, provider + " is currently unavailable."));
					break;
				case LocationProvider.AVAILABLE :
					if (DBG) {
						Log.i(LCAT, provider + " is available.");
					}
					break;
				}
			}
		};

		locationManager = (LocationManager) proxy.getTiContext().getActivity().getSystemService(Context.LOCATION_SERVICE);

	}

	public void getCurrentPosition(KrollCallback listener)
	{
		if (listener != null && locationManager != null) {
			Criteria criteria = createCriteria();
			String provider = locationManager.getBestProvider(criteria, true);
			Location location = locationManager.getLastKnownLocation(provider);
			if (location != null) {
				listener.callWithProperties(locationToTiDict(location, locationManager.getProvider(provider)));
			} else {
				listener.callWithProperties(TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, "location is currently unavailable."));
			}
		} else {
			listener.callWithProperties(TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, "location is currently unavailable."));
		}
	}

	protected void manageLocationListener(boolean register)
	{
		if (locationManager != null) {
			if (register) {

				Criteria criteria = createCriteria();
				String provider = locationManager.getBestProvider(criteria, true);
				if (provider != null) {

					// Compute update parameters
					float updateDistance = 10;
					int updateFrequency = 5000;

					Object accuracy = proxy.getDynamicValue("accuracy");
					if (accuracy != null) {
						int value = TiConvert.toInt(accuracy);
						switch(value) {
							case ACCURACY_BEST : updateDistance = 1.0f; break;
							case ACCURACY_NEAREST_TEN_METERS : updateDistance = 10.0f; break;
							case ACCURACY_HUNDRED_METERS : updateDistance = 100.0f; break;
							case ACCURACY_KILOMETER : updateDistance = 1000.0f; break;
							case ACCURACY_THREE_KILOMETERS : updateDistance = 3000.0f; break;
							default :
								Log.w(LCAT, "Ignoring unknown accuracy value " + value);
						}
					}

					Object frequency = proxy.getDynamicValue("frequency");
					if (frequency != null) {
						int value = TiConvert.toInt(frequency); // in seconds
						updateFrequency = value * 1000; // to millis
					}

					// Start updates
					locationManager.requestLocationUpdates(provider, updateFrequency, updateDistance, geoListener);
					listeningForGeo = true;
				} else {
					Log.w(LCAT, "No providers available. Unable to turn on Location support");
				}
			} else {
				if (listeningForGeo) {
					locationManager.removeUpdates(geoListener);
					listeningForGeo = false;
				}
			}
		}
	}

	protected Criteria createCriteria()
	{
		Criteria criteria = new Criteria();
		criteria.setAccuracy(Criteria.NO_REQUIREMENT);

		Object accuracy = proxy.getDynamicValue("accuracy");
		if (accuracy != null) {
			int value = TiConvert.toInt(accuracy);
			switch(value) {
				case ACCURACY_BEST :
				case ACCURACY_NEAREST_TEN_METERS :
				case ACCURACY_HUNDRED_METERS :
					criteria.setAccuracy(Criteria.ACCURACY_FINE);
					criteria.setAltitudeRequired(true);
					criteria.setBearingRequired(true);
					criteria.setSpeedRequired(true);
					break;
				case ACCURACY_KILOMETER :
				case ACCURACY_THREE_KILOMETERS :
					criteria.setAccuracy(Criteria.ACCURACY_COARSE);
					criteria.setAltitudeRequired(false);
					criteria.setBearingRequired(false);
					criteria.setSpeedRequired(false);
					break;
				default :
					Log.w(LCAT, "Ignoring unknown accuracy value " + value);
			}
		}

		return criteria;
	}

	// Helpers

	protected TiDict locationToTiDict(Location loc, LocationProvider provider)
	{
		TiDict coords = new TiDict();
		coords.put("latitude", loc.getLatitude());
		coords.put("longitude", loc.getLongitude());
		coords.put("altitude", loc.getAltitude());
		coords.put("accuracy", loc.getAccuracy());
		coords.put("altitudeAccuracy", null); // Not provided
		coords.put("heading", loc.getBearing());
		coords.put("speed", loc.getSpeed());
		coords.put("timestamp", loc.getTime());

		TiDict pos = new TiDict();
		pos.put("coords", coords);

		if (provider != null) {
			TiDict p = new TiDict();

			p.put("name", provider.getName());
			p.put("accuracy", provider.getAccuracy());
			p.put("power", provider.getPowerRequirement());

			pos.put("provider", p);
		}

		return pos;
	}

	public boolean isLocationEnabled() {
		boolean enabled = false;

		if (locationManager != null) {
			List<String> providers = locationManager.getProviders(true);
			if (providers != null && providers.size() > 0) {
				if (DBG) {
					Log.i(LCAT, "Enabled location provider count: " + providers.size());
				}
				enabled = true;
			}
		}

		return enabled;
	}

	public void onResume() {

		locationManager = (LocationManager) proxy.getTiContext().getActivity().getSystemService(Context.LOCATION_SERVICE);

		if (proxy.getTiContext().hasEventListener(EVENT_LOCATION, proxy)) {
			manageLocationListener(true);
		}
	}

	public void onPause() {

		if (listeningForGeo) {
			manageLocationListener(false);
		}

		locationManager = null;
	}

}
