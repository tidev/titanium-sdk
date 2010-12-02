/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.analytics.TiAnalyticsEvent;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Context;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;

public class TiLocation extends TiGeoHelper
{
	private static final String LCAT = "TiLocation";
	private static final Boolean DBG = true; //TiConfig.LOGD;

	public static final int ERR_UNKNOWN_ERROR = 0;
	public static final int ERR_PERMISSION_DENIED = 1;
	public static final int ERR_POSITION_UNAVAILABLE = 2;
	public static final int ERR_TIMEOUT = 3;

	public static final int ACCURACY_BEST = 0;
	public static final int ACCURACY_NEAREST_TEN_METERS = 1;
	public static final int ACCURACY_HUNDRED_METERS = 2;
	public static final int ACCURACY_KILOMETER = 3;
	public static final int ACCURACY_THREE_KILOMETERS = 4;

	public static final long MAX_GEO_ANALYTICS_FREQUENCY = TiAnalyticsEventFactory.MAX_GEO_ANALYTICS_FREQUENCY;

	public static final String EVENT_LOCATION = "location";

	protected static final String OPTION_HIGH_ACCURACY = "enableHighAccuracy";

	//private KrollModule proxy;

	protected LocationManager locationManager;
	protected LocationListener geoListener;
	protected boolean listeningForGeo;

	protected long lastEventTimestamp;	// This counter is instance specific. The actually queuing code
										// will arbitrate between other instances. Since only one activity
										// at a time can be active, there shouldn't be any contention.

	public TiLocation(TiContext context, KrollModule proxy)
	{
		super(context, proxy);
		listeningForGeo = false;

		geoListener = new LocationListener() {

			public void onLocationChanged(Location location) {
				LocationProvider provider = getLocationManager().getProvider(location.getProvider());
				fireEvent(EVENT_LOCATION, locationToKrollDict(location, provider));
				doAnalytics(location);
			}

			public void onProviderDisabled(String provider) {
				Log.d(LCAT, "Provider disabled: " + provider);
				fireEvent(EVENT_LOCATION, TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, provider + " disabled."));
			}

			public void onProviderEnabled(String provider) {
				Log.d(LCAT, "Provider enabled: " + provider);
				//eventManager.invokeErrorListeners(EVENT_GEO, createJSONError(ERR_POSITION_UNAVAILABLE, provider + " enabled."));
			}

			public void onStatusChanged(String provider, int status, Bundle extras) {
				Log.d(LCAT, "Status changed, provider = " + provider + " status=" + status);
				switch (status) {
					case LocationProvider.OUT_OF_SERVICE :
						fireEvent(EVENT_LOCATION, TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, provider + " is out of service."));
					break;
					case LocationProvider.TEMPORARILY_UNAVAILABLE:
						fireEvent(EVENT_LOCATION, TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, provider + " is currently unavailable."));
					break;
					case LocationProvider.AVAILABLE :
						if (DBG) {
							Log.i(LCAT, provider + " is available.");
						}
					break;
					default:
						Log.w(LCAT, "Unknown status update from ["+provider+"] - passed code: "+status);
					break;
				}
			}
		};

		locationManager = (LocationManager) context.getActivity().getSystemService(Context.LOCATION_SERVICE);

	}

	public void getCurrentPosition(KrollCallback listener)
	{
		if (listener != null) {
			// Prefer the user selected provider
			String provider = fetchProvider();
			
			if (provider != null) {
				// We should really query all active providers - one may have a more accurate fix
				Location location = getLocationManager().getLastKnownLocation(provider);
				if (location != null) {
					listener.call(locationToKrollDict(location, getLocationManager().getProvider(provider)));
					doAnalytics(location);
				} else {
					Log.i(LCAT, "getCurrentPosition - location is null");
					listener.call(TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, "location is currently unavailable."));
				}
			} else {
				Log.i(LCAT, "getCurrentPosition - no providers are available");
				listener.call(TiConvert.toErrorObject(ERR_POSITION_UNAVAILABLE, "no providers are available."));
			}
		}
	}
	
	private void doAnalytics(Location location) {
		TiContext context = weakContext.get();
		if (context == null) {
			Log.w(LCAT, "Unable to report analytics location event; context has been GC'd");
			return;
		}
		if (location.getTime() - lastEventTimestamp > MAX_GEO_ANALYTICS_FREQUENCY) {
			// Null is returned if it's too early to send another event.
			TiAnalyticsEvent event = TiAnalyticsEventFactory.createAppGeoEvent(location);
			if (event != null) {
				context.getTiApp().postAnalyticsEvent(event);
				lastEventTimestamp = location.getTime();
			}
		}
	}
	
	protected boolean isLocationProviderEnabled(String name) {
		try {
			return getLocationManager().isProviderEnabled(name);
		} catch (Exception e) {
			// Ignore - it's expected
			e = null;
		}
		return false;
	}

	protected boolean isValidProvider(String name) {
		
		boolean enabled = (name.equals(LocationManager.GPS_PROVIDER) || name.equals(LocationManager.NETWORK_PROVIDER));
		
		if (enabled) {
			// So far we have a valid name but let's check to see if the provider is enabled on this device
			enabled = false;
			try{
				enabled = isLocationProviderEnabled(name);
			} catch(Exception ex){
				ex = null;
			} finally {
				if (!enabled) {
					Log.w(LCAT, "Preferred provider ["+name+"] isn't enabled on this device.  Will default to auto-select of GPS provider.");
				}
			}
		}
		
		return enabled;		
	}
	
	protected String fetchProvider() {
		// Refactored for reuse
		KrollModule proxy = weakProxy.get();
		String preferredProvider = null;
		if (proxy != null) {
			preferredProvider = TiConvert.toString(proxy.getProperty("preferredProvider"));
		}
		String provider;
		
		if (!(null == preferredProvider) && isValidProvider(preferredProvider)) {
			provider = preferredProvider;
		} else {
			Criteria criteria = createCriteria();
			provider = getLocationManager().getBestProvider(criteria, true);
		}		
		
		return provider;
	}
	
	
	protected void manageLocationListener(boolean register)
	{
		if (register && locationManager == null) {
			getLocationManager(); // forces load of locationManager
		}
		if (locationManager != null) {
			if (register && !listeningForGeo) {
				
				String provider = fetchProvider();

				if (DBG) {
					Log.i(LCAT,"Location Provider ["+provider+"] selected.");
				}
				
				if (provider != null) {

					// Compute update parameters
					float updateDistance = 10;
					int updateFrequency = 5000;

					Object accuracy = null;
					Object frequency = null;
					KrollModule proxy = weakProxy.get();
					if (proxy != null) {
						accuracy = proxy.getProperty("accuracy");
						frequency = proxy.getProperty("frequency");
					}
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
				if (listeningForGeo && locationManager != null) {
					locationManager.removeUpdates(geoListener);
				}
				listeningForGeo = false;
			}
		}
	}

	protected Criteria createCriteria()
	{
		Criteria criteria = new Criteria();
		criteria.setAccuracy(Criteria.NO_REQUIREMENT);

		Object accuracy = null;
		KrollModule proxy = weakProxy.get();
		if (proxy != null) {
			accuracy = proxy.getProperty("accuracy");
		}
		
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

	protected KrollDict locationToKrollDict(Location loc, LocationProvider provider)
	{
		KrollDict coords = new KrollDict();
		coords.put("latitude", loc.getLatitude());
		coords.put("longitude", loc.getLongitude());
		coords.put("altitude", loc.getAltitude());
		coords.put("accuracy", loc.getAccuracy());
		coords.put("altitudeAccuracy", null); // Not provided
		coords.put("heading", loc.getBearing());
		coords.put("speed", loc.getSpeed());
		coords.put("timestamp", loc.getTime());

		KrollDict pos = new KrollDict();
		pos.put("success", true);
		pos.put("coords", coords);

		if (provider != null) {
			KrollDict p = new KrollDict();

			p.put("name", provider.getName());
			p.put("accuracy", provider.getAccuracy());
			p.put("power", provider.getPowerRequirement());

			pos.put("provider", p);
		}

		return pos;
	}

	public boolean isLocationEnabled() {
		boolean enabled = false;

		List<String> providers = getLocationManager().getProviders(true);
		if (providers != null && providers.size() > 0) {
			if (DBG) {
				Log.i(LCAT, "Enabled location provider count: " + providers.size());
				// Extra debugging
				for (String name : providers) {
					Log.i(LCAT, "Location ["+name+"] Service available ");
				}					
			}
			enabled = true;
		} else {
			Log.i(LCAT, "No available providers");
		}

		return enabled;
	}

	private LocationManager getLocationManager() {
		if (locationManager == null) {
			TiContext context = weakContext.get();
			if (context != null) {
				locationManager = (LocationManager) context.getActivity().getSystemService(Context.LOCATION_SERVICE);
			}
		}
		return locationManager;
	}
	
	@Override
	protected void attach()
	{
		manageLocationListener(true);
	}
	
	
	@Override
	protected void detach()
	{
		manageLocationListener(false);
	}

	@Override
	protected void resume()
	{
		TiContext context = weakContext.get();
		if (context == null) {
			Log.w(LCAT, "Could not properly resume, context has been GC'd");
			return;
		}
		locationManager = (LocationManager) context.getActivity().getSystemService(Context.LOCATION_SERVICE);

		if (hasListeners()) {
			manageLocationListener(true);
		}
	}

	@Override
	protected GeoFeature getFeature()
	{
		return GeoFeature.LOCATION;
	}

	@Override
	protected boolean supportsEvent(String eventName)
	{
		return eventName.equals(EVENT_LOCATION);
	}

}
