/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Locale;

import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.runtime.v8.V8Callback;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.analytics.TiAnalyticsEvent;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiLocationHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Message;


public class TiLocation
	implements LocationListener
{
	private static final String LCAT = "TiLocation";
	private static final boolean DBG = TiConfig.LOGD;
	private static final String BASE_GEO_URL = "http://api.appcelerator.net/p/v1/geo?";
	private static final String DIRECTION_R = "r";
	private static final String DIRECTION_F = "f";

	private long lastEventTimestamp = 0;
	private GeolocationModule geolocationModule;
	private Integer accuracy = null;
	private Integer frequency = null;
	private String preferredProvider;

	public TiLocation(GeolocationModule geolocationModule)
	{
		this.geolocationModule = geolocationModule;
	}

	private void refreshProperties()
	{
		Object frequencyProp = geolocationModule.getProperty(TiC.PROPERTY_FREQUENCY);
		Object accuracyProp = geolocationModule.getProperty(TiC.PROPERTY_ACCURACY);

		preferredProvider = TiConvert.toString(geolocationModule.getProperty(TiC.PROPERTY_PREFERRED_PROVIDER));
		Log.d(LCAT, "preferredProvider property found [" + preferredProvider + "]");

		if (frequencyProp != null)
		{
			frequency = new Integer(TiConvert.toInt(frequencyProp));
			Log.d(LCAT, "frequency property found [" + frequency.intValue() + "]");
		}
		if (accuracyProp != null)
		{
			accuracy = new Integer(TiConvert.toInt(accuracyProp));
			Log.d(LCAT, "accuracy property found [" + accuracy.intValue() + "]");
		}
	}

	public void registerListener()
	{
		refreshProperties();
		TiLocationHelper.registerListener(preferredProvider, accuracy, frequency, this);
	}

	public void unregisterListener()
	{
		TiLocationHelper.unregisterListener(this);
	}

	private void updateProvider(String provider)
	{
		refreshProperties();
		TiLocationHelper.updateProvider(preferredProvider, accuracy, provider, frequency, this);
	}

	public void onLocationChanged(Location location)
	{
		LocationProvider provider = TiLocationHelper.getLocationManager().getProvider(location.getProvider());
		geolocationModule.fireEvent(TiC.EVENT_LOCATION, locationToKrollDict(location, provider));
		doAnalytics(location);
		updateProvider(provider.getName());
	}

	public void onProviderDisabled(String provider)
	{
		Log.i(LCAT, "Provider disabled:" + provider);
		geolocationModule.fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, provider + " disabled."));
		updateProvider(provider);
	}

	public void onProviderEnabled(String provider)
	{
		Log.d(LCAT, "Provider enabled:" + provider);
	}

	public void onStatusChanged(String provider, int status, Bundle extras)
	{
		Log.d(LCAT, "Status changed, provider:" + provider + " status:" + status);
		switch (status) {
			case LocationProvider.OUT_OF_SERVICE :
				geolocationModule.fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, provider + " is out of service."));
				updateProvider(provider);
				break;
			case LocationProvider.TEMPORARILY_UNAVAILABLE:
				geolocationModule.fireEvent(TiC.EVENT_LOCATION, TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, provider + " is currently unavailable."));
				updateProvider(provider);
				break;
			case LocationProvider.AVAILABLE :
				if (DBG) {
					Log.i(LCAT, "[" + provider + "] is available");
				}
				break;
			default:
				Log.w(LCAT, "Unknown status update from [" + provider + "], passed code [" + status + "]");
				break;
		}
	}

	private KrollDict locationToKrollDict(Location location, LocationProvider locationProvider)
	{
		KrollDict coordinates = new KrollDict();
		coordinates.put(TiC.PROPERTY_LATITUDE, location.getLatitude());
		coordinates.put(TiC.PROPERTY_LONGITUDE, location.getLongitude());
		coordinates.put(TiC.PROPERTY_ALTITUDE, location.getAltitude());
		coordinates.put(TiC.PROPERTY_ACCURACY, location.getAccuracy());
		coordinates.put(TiC.PROPERTY_ALTITUDE_ACCURACY, null); // Not provided
		coordinates.put(TiC.PROPERTY_HEADING, location.getBearing());
		coordinates.put(TiC.PROPERTY_SPEED, location.getSpeed());
		coordinates.put(TiC.PROPERTY_TIMESTAMP, location.getTime());

		KrollDict position = new KrollDict();
		position.put(TiC.PROPERTY_SUCCESS, true);
		position.put(TiC.PROPERTY_COORDS, coordinates);

		if (locationProvider != null) {
			KrollDict provider = new KrollDict();

			provider.put(TiC.PROPERTY_NAME, locationProvider.getName());
			provider.put(TiC.PROPERTY_ACCURACY, locationProvider.getAccuracy());
			provider.put(TiC.PROPERTY_POWER, locationProvider.getPowerRequirement());

			position.put(TiC.PROPERTY_PROVIDER, provider);
		}

		return position;
	}

	private void doAnalytics(Location location)
	{
		if (location.getTime() - lastEventTimestamp > GeolocationModule.MAX_GEO_ANALYTICS_FREQUENCY) {
			TiAnalyticsEvent event = TiAnalyticsEventFactory.createAppGeoEvent(location);
			if (event != null) {
				TiApplication.getInstance().postAnalyticsEvent(event);
				lastEventTimestamp = location.getTime();
			}
		}
	}

	public boolean getLocationServicesEnabled()
	{
		return TiLocationHelper.isLocationEnabled();
	}

	public void getCurrentPosition(final V8Callback listener)
	{
		if (listener != null) {
			String provider = TiLocationHelper.fetchProvider(preferredProvider, accuracy);
			
			if (provider != null) {
				LocationManager locationManager = TiLocationHelper.getLocationManager();
				Location location = locationManager.getLastKnownLocation(provider);

				if (location != null) {
					listener.invoke(locationToKrollDict(location, locationManager.getProvider(provider)));
					doAnalytics(location);
				} else {
					Log.i(LCAT, "unable to get current position, location is null");
					listener.invoke(TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, "location is currently unavailable."));
				}
			} else {
				Log.i(LCAT, "unable to get current position, no providers are available");
				listener.invoke(TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, "no providers are available."));
			}
		}
	}

	private String buildGeoURL(String direction, String mid, String aguid, String sid, String query, String countryCode)
	{
		String url = null;
		try {
			StringBuilder sb = new StringBuilder();
			sb.append(BASE_GEO_URL)
				.append("d=r")
				.append("&mid=")
				.append(mid)
				.append("&aguid=")
				.append(aguid)
				.append("&sid=")
				.append(sid)
				.append("&q=")
				.append(URLEncoder.encode(query, "utf-8"));

			url = sb.toString();
		} catch (UnsupportedEncodingException e) {
			Log.w(LCAT, "unable to encode query to utf-8 [" + e.getMessage() + "]");
		}

		return url;
	}

	public AsyncTask<Object, Void, Integer> getLookUpTask()
	{
		AsyncTask<Object, Void, Integer> task = new AsyncTask<Object, Void, Integer>() {
			@Override
			protected Integer doInBackground(Object... args) {
				try {
					String url = (String) args[0];
					String direction = (String) args[1];
					V8Callback callback = (V8Callback) args[2];

					if (DBG) {
						Log.d(LCAT, "GEO URL [" + url + "]");
					}
					HttpGet httpGet = new HttpGet(url);

					HttpParams httpParams = new BasicHttpParams();
					HttpConnectionParams.setConnectionTimeout(httpParams, 5000);

					HttpClient client = new DefaultHttpClient(httpParams);
					client.getParams().setBooleanParameter("http.protocol.expect-continue", false);
					ResponseHandler<String> responseHandler = new BasicResponseHandler();
					String response = client.execute(httpGet, responseHandler);

					if (DBG) {
						Log.i(LCAT, "received Geo [" + response + "]");
					}
					KrollDict event = null;
					if (response != null) {
						try {
							JSONObject jsonObject = new JSONObject(response);
							if (jsonObject.getBoolean(TiC.PROPERTY_SUCCESS)) {
								if (direction.equals(DIRECTION_R)) {
									event = buildReverseResponse(jsonObject);
								} else {
									event = buildForwardResponse(jsonObject);
								}
							} else {
								event = new KrollDict();
								KrollDict errorDict = new KrollDict();
								String errorCode = jsonObject.getString(TiC.ERROR_PROPERTY_ERRORCODE);
								errorDict.put(TiC.PROPERTY_MESSAGE, "Unable to resolve message: Code (" + errorCode + ")");
								errorDict.put(TiC.PROPERTY_CODE, errorCode);
								event.put(TiC.EVENT_PROPERTY_ERROR, errorDict);
							}
						} catch (JSONException e) {
							Log.e(LCAT, "error converting geo response to JSONObject [" + e.getMessage() + "]", e);
						}
					}

					if (event != null) {
						event.put(TiC.EVENT_PROPERTY_SOURCE, this);
						callback.invoke(event);
					}
				} catch (Throwable t) {
					Log.e(LCAT, "error retrieving geocode information [" + t.getMessage() + "]", t);
				}

				return -1;
			}

		};

		return task;
	}

	public void forwardGeocoder(String address, V8Callback listener)
	{
		if (address != null) {
			String mid = TiPlatformHelper.getMobileId();
			String aguid = TiApplication.getInstance().getAppInfo().getGUID();
			String sid = TiPlatformHelper.getSessionId();
			String countryCode = Locale.getDefault().getCountry();
			String url = buildGeoURL(DIRECTION_F, mid, aguid, sid, address, countryCode);

			if (url != null) {
				Message msg = geolocationModule.getUIHandler().obtainMessage(GeolocationModule.MSG_LOOKUP);
				msg.getData().putString(TiC.PROPERTY_DIRECTION, DIRECTION_F);
				msg.getData().putString(TiC.PROPERTY_URL, url);
				msg.obj = listener;
				msg.sendToTarget();
			}
		} else {
			Log.w(LCAT, "address should not be null");
		}
	}

	public void reverseGeocoder(double latitude, double longitude, V8Callback callback)
	{
		String mid = TiPlatformHelper.getMobileId();
		String aguid = TiApplication.getInstance().getAppInfo().getGUID();
		String sid = TiPlatformHelper.getSessionId();
		String countryCode = Locale.getDefault().getCountry();
		String url = buildGeoURL(DIRECTION_R, mid, aguid, sid, latitude + "," + longitude, countryCode);

		if (url != null) {
			Message msg = geolocationModule.getUIHandler().obtainMessage(GeolocationModule.MSG_LOOKUP);
			msg.getData().putString(TiC.PROPERTY_DIRECTION, DIRECTION_R);
			msg.getData().putString(TiC.PROPERTY_URL, url);
			msg.obj = callback;
			msg.sendToTarget();
		}
	}

	private KrollDict placeToAddress(JSONObject place)
	{
		KrollDict address = new KrollDict();
		address.put(TiC.PROPERTY_STREET1, place.optString(TiC.PROPERTY_STREET, ""));
		address.put(TiC.PROPERTY_STREET, place.optString(TiC.PROPERTY_STREET, ""));
		address.put(TiC.PROPERTY_CITY, place.optString(TiC.PROPERTY_CITY, ""));
		address.put(TiC.PROPERTY_REGION1, ""); // AdminArea
		address.put(TiC.PROPERTY_REGION2, ""); // SubAdminArea
		address.put(TiC.PROPERTY_POSTAL_CODE, place.optString("zipcode", ""));
		address.put(TiC.PROPERTY_COUNTRY, place.optString(TiC.PROPERTY_COUNTRY, ""));
		address.put("countryCode", place.optString(TiC.PROPERTY_COUNTRY_CODE, "")); // TIMOB-4478, remove this later, was old android name
		address.put(TiC.PROPERTY_COUNTRY_CODE, place.optString(TiC.PROPERTY_COUNTRY_CODE, ""));		
		address.put(TiC.PROPERTY_LONGITUDE, place.optString(TiC.PROPERTY_LONGITUDE, ""));
		address.put(TiC.PROPERTY_LATITUDE, place.optString(TiC.PROPERTY_LATITUDE, ""));
		address.put(TiC.PROPERTY_DISPLAY_ADDRESS, place.optString(TiC.PROPERTY_ADDRESS));
		address.put(TiC.PROPERTY_ADDRESS, place.optString(TiC.PROPERTY_ADDRESS));

		return address;
	}

	public KrollDict buildReverseResponse(JSONObject jsonObject)
		throws JSONException
	{
		KrollDict response = new KrollDict();
		response.put(TiC.PROPERTY_SUCCESS, true);

		JSONArray places = jsonObject.getJSONArray(TiC.PROPERTY_PLACES);
		int count = places.length();
		KrollDict[] newPlaces = new KrollDict[count];
		for (int i = 0; i < count; i++) {
			newPlaces[i] = placeToAddress(places.getJSONObject(i));
		}
		response.put(TiC.PROPERTY_PLACES, newPlaces);

		return response;
	}

	public KrollDict buildForwardResponse(JSONObject jsonObject)
		throws JSONException
	{
		KrollDict response = new KrollDict();
		JSONArray places = jsonObject.getJSONArray(TiC.PROPERTY_PLACES);
		if (places.length() > 0) {
			response = placeToAddress(places.getJSONObject(0));
		}

		return response;
	}
}

