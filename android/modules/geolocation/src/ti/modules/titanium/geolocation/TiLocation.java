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
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.analytics.TiAnalyticsEvent;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.kroll.KrollCallback;
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

	private long lastEventTimestamp = 0;
	private GeolocationModule geolocationModule;


	public TiLocation(GeolocationModule geolocationModule)
	{
		this.geolocationModule = geolocationModule;
	}

	public void onLocationChanged(Location location)
	{
		LocationProvider provider = TiLocationHelper.getLocationManager().getProvider(location.getProvider());
		geolocationModule.fireEvent(GeolocationModule.EVENT_LOCATION, locationToKrollDict(location, provider));
		doAnalytics(location);
	}

	public void onProviderDisabled(String provider)
	{
		Log.d(LCAT, "Provider disabled: " + provider);
		geolocationModule.fireEvent(GeolocationModule.EVENT_LOCATION, TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, provider + " disabled."));
	}

	public void onProviderEnabled(String provider)
	{
		Log.d(LCAT, "Provider enabled: " + provider);
	}

	public void onStatusChanged(String provider, int status, Bundle extras)
	{
		Log.d(LCAT, "Status changed, provider = " + provider + " status=" + status);
		switch (status) {
			case LocationProvider.OUT_OF_SERVICE :
				geolocationModule.fireEvent(GeolocationModule.EVENT_LOCATION, TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, provider + " is out of service."));
			break;
			case LocationProvider.TEMPORARILY_UNAVAILABLE:
				geolocationModule.fireEvent(GeolocationModule.EVENT_LOCATION, TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, provider + " is currently unavailable."));
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

	private KrollDict locationToKrollDict(Location location, LocationProvider locationProvider)
	{
		KrollDict coordinates = new KrollDict();
		coordinates.put("latitude", location.getLatitude());
		coordinates.put("longitude", location.getLongitude());
		coordinates.put("altitude", location.getAltitude());
		coordinates.put("accuracy", location.getAccuracy());
		coordinates.put("altitudeAccuracy", null); // Not provided
		coordinates.put("heading", location.getBearing());
		coordinates.put("speed", location.getSpeed());
		coordinates.put("timestamp", location.getTime());

		KrollDict position = new KrollDict();
		position.put("success", true);
		position.put("coords", coordinates);

		if (locationProvider != null) {
			KrollDict provider = new KrollDict();

			provider.put("name", locationProvider.getName());
			provider.put("accuracy", locationProvider.getAccuracy());
			provider.put("power", locationProvider.getPowerRequirement());

			position.put("provider", provider);
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

	public boolean getLocationServicesEnabled(KrollInvocation invocation)
	{
		return TiLocationHelper.isLocationEnabled();
	}

	public void getCurrentPosition(KrollInvocation invocation, final KrollCallback listener)
	{
		if (listener != null) {
			String provider = TiLocationHelper.fetchProvider();
			
			if (provider != null) {
				LocationManager locationManager = TiLocationHelper.getLocationManager();
				Location location = locationManager.getLastKnownLocation(provider);

				if (location != null) {
					listener.callAsync(locationToKrollDict(location, locationManager.getProvider(provider)));
					doAnalytics(location);
				} else {
					Log.i(LCAT, "getCurrentPosition - location is null");
					listener.callAsync(TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, "location is currently unavailable."));
				}
			} else {
				Log.i(LCAT, "getCurrentPosition - no providers are available");
				listener.callAsync(TiConvert.toErrorObject(TiLocationHelper.ERR_POSITION_UNAVAILABLE, "no providers are available."));
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
				.append(URLEncoder.encode(query, "utf-8"))
				;

			url = sb.toString();
		} catch (UnsupportedEncodingException e) {
			Log.w(LCAT, "Unable to encode query to utf-8: " + e.getMessage());
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
					KrollCallback callback = (KrollCallback) args[2];

					if (DBG) {
						Log.d(LCAT, "GEO URL: " + url);
					}
					HttpGet httpGet = new HttpGet(url);

					HttpParams httpParams = new BasicHttpParams();
					HttpConnectionParams.setConnectionTimeout(httpParams, 5000); // TODO use property

					HttpClient client = new DefaultHttpClient(httpParams);
					client.getParams().setBooleanParameter("http.protocol.expect-continue", false);
					ResponseHandler<String> responseHandler = new BasicResponseHandler();
					String response = client.execute(httpGet, responseHandler);

					if (DBG) {
						Log.i(LCAT, "Received Geo: " + response);
					}
					KrollDict event = null;
					if (response != null) {
						try {
							JSONObject jsonObject = new JSONObject(response);
							if (jsonObject.getBoolean("success")) {
								if (direction.equals("r")) {
									event = buildReverseResponse(jsonObject);
								} else {
									event = buildForwardResponse(jsonObject);
								}
							} else {
								event = new KrollDict();
								KrollDict errorDict = new KrollDict();
								String errorCode = jsonObject.getString("errorcode");
								errorDict.put("message", "Unable to resolve message: Code (" + errorCode + ")");
								errorDict.put("code", errorCode);
								event.put("error", errorDict);
							}
						} catch (JSONException e) {
							Log.e(LCAT, "Error converting geo response to JSONObject: " + e.getMessage(), e);
						}
					}

					if (event != null) {
						event.put("source", this);
						callback.callAsync(event);
					}
				} catch (Throwable t) {
					Log.e(LCAT, "Error retrieving geocode information: " + t.getMessage(), t);
				}

				return -1;
			}

		};

		return task;
	}

	public void forwardGeocoder(String address, KrollCallback listener)
	{
		if (address != null) {
			String mid = TiPlatformHelper.getMobileId();
			String aguid = geolocationModule.getTiContext().getTiApp().getAppInfo().getGUID();
			String sid = TiPlatformHelper.getSessionId();
			String countryCode = Locale.getDefault().getCountry();
			String url = buildGeoURL("f", mid, aguid, sid, address, countryCode);

			if (url != null) {
				Message msg = geolocationModule.getUIHandler().obtainMessage(GeolocationModule.MSG_LOOKUP);
				msg.getData().putString("direction", "f");
				msg.getData().putString("url", url);
				msg.obj = listener;
				msg.sendToTarget();
			}
		} else {
			Log.w(LCAT, "Address should not be null.");
		}
	}

	public void reverseGeocoder(double latitude, double longitude, KrollCallback callback)
	{
		String mid = TiPlatformHelper.getMobileId();
		String aguid = geolocationModule.getTiContext().getTiApp().getAppInfo().getGUID();
		String sid = TiPlatformHelper.getSessionId();
		String countryCode = Locale.getDefault().getCountry();
		String url = buildGeoURL("r", mid, aguid, sid, latitude + "," + longitude, countryCode);

		if (url != null) {
			Message msg = geolocationModule.getUIHandler().obtainMessage(GeolocationModule.MSG_LOOKUP);
			msg.getData().putString("direction", "r");
			msg.getData().putString("url", url);
			msg.obj = callback;
			msg.sendToTarget();
		}
	}

	private KrollDict placeToAddress(JSONObject place)
	{
		KrollDict address = new KrollDict();
		address.put("street1", place.optString("street", ""));
		address.put("street", place.optString("street", ""));
		address.put("city", place.optString("city", ""));
		address.put("region1", ""); // AdminArea
		address.put("region2", ""); // SubAdminArea
		address.put("postalCode", place.optString("zipcode", ""));
		address.put("country", place.optString("country", ""));
		address.put("countryCode", place.optString("country_code", ""));
		address.put("country_code", place.optString("country_code", ""));
		address.put("longitude", place.optString("longitude", ""));
		address.put("latitude", place.optString("latitude", ""));
		address.put("displayAddress", place.optString("address"));
		address.put("address", place.optString("address"));

		return address;
	}

	public KrollDict buildReverseResponse(JSONObject jsonObject)
		throws JSONException
	{
		KrollDict response = new KrollDict();
		response.put("success", true);

		JSONArray places = jsonObject.getJSONArray("places");
		int count = places.length();
		KrollDict[] newPlaces = new KrollDict[count];
		for (int i = 0; i < count; i++) {
			newPlaces[i] = placeToAddress(places.getJSONObject(i));
		}
		response.put("places", newPlaces);

		return response;
	}

	public KrollDict buildForwardResponse(JSONObject jsonObject)
		throws JSONException
	{
		KrollDict response = new KrollDict();
		JSONArray places = jsonObject.getJSONArray("places");
		if (places.length() > 0) {
			response = placeToAddress(places.getJSONObject(0));
		}

		return response;
	}
}

