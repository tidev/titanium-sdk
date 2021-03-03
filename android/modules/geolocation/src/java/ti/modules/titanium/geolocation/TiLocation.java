/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Handler;
import android.os.Message;

import com.appcelerator.aps.APSAnalytics;

public class TiLocation implements Handler.Callback
{
	public static final int ERR_POSITION_UNAVAILABLE = 6;
	public static final int MSG_FIRST_ID = 100;
	public static final int MSG_LOOKUP = MSG_FIRST_ID + 1;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 2;

	public LocationManager locationManager;

	private static final String TAG = "TiLocation";
	private static final String BASE_GEO_URL = "https://api.appcelerator.com/p/v1/geo?";

	private String mobileId;
	private String appGuid;
	private String sessionId;
	private String countryCode;
	private List<String> knownProviders;
	private Handler runtimeHandler;

	public interface GeocodeResponseHandler {
		void handleGeocodeResponse(KrollDict geocodeResponse);
	}

	public TiLocation()
	{
		locationManager = (LocationManager) TiApplication.getInstance().getSystemService(Context.LOCATION_SERVICE);
		knownProviders = locationManager.getAllProviders();
		mobileId = APSAnalytics.getInstance().getMachineId();
		appGuid = TiApplication.getInstance().getAppInfo().getGUID();
		sessionId = APSAnalytics.getInstance().getCurrentSessionId();
		countryCode = Locale.getDefault().getCountry();
		runtimeHandler = new Handler(TiMessenger.getRuntimeMessenger().getLooper(), this);
	}

	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_LOOKUP) {
			String urlValue = msg.getData().getString(TiC.PROPERTY_URL);
			String directionValue = msg.getData().getString(TiC.PROPERTY_DIRECTION);

			AsyncTask<Object, Void, Integer> task = getLookUpTask();
			task.execute(urlValue, directionValue, msg.obj);

			return true;
		}

		return false;
	}

	public boolean isProvider(String name)
	{
		return knownProviders.contains(name);
	}

	public boolean getLocationServicesEnabled()
	{
		// Fetch all enabled location providers.
		List<String> providerNames = locationManager.getProviders(true);
		if ((providerNames == null) || (providerNames.size() <= 0)) {
			return false;
		}

		// Log all providers currently enabled.
		if (Log.isDebugModeEnabled()) {
			Log.i(TAG, "Enabled location provider count: " + providerNames.size());
			for (String providerName : providerNames) {
				Log.i(TAG, providerName + " service available");
			}
		}

		// Only return true if location can be obtained via GPS or WiFi/Cellular.
		// Ignore "passive" provider and "test" providers.
		boolean isEnabled = providerNames.contains(LocationManager.GPS_PROVIDER);
		isEnabled |= providerNames.contains(LocationManager.NETWORK_PROVIDER);
		return isEnabled;
	}

	public Location getLastKnownLocation()
	{
		Location latestKnownLocation = null;

		for (String provider : knownProviders) {
			Location lastKnownLocation = null;
			try {
				lastKnownLocation = locationManager.getLastKnownLocation(provider);

			} catch (IllegalArgumentException e) {
				Log.e(TAG, "Unable to get last know location for [" + provider + "], provider is null");

			} catch (SecurityException e) {
				Log.e(TAG, "Unable to get last know location for [" + provider + "], permission denied");
			}

			if (lastKnownLocation == null) {
				continue;
			}

			if ((latestKnownLocation == null) || (lastKnownLocation.getTime() > latestKnownLocation.getTime())) {
				latestKnownLocation = lastKnownLocation;
			}
		}

		return latestKnownLocation;
	}

	public void forwardGeocode(String address, GeocodeResponseHandler responseHandler)
	{
		if (address != null) {
			String geocoderUrl =
				buildGeocoderURL(TiC.PROPERTY_FORWARD, mobileId, appGuid, sessionId, address, countryCode);
			if (geocoderUrl != null) {
				Message message = runtimeHandler.obtainMessage(MSG_LOOKUP);
				message.getData().putString(TiC.PROPERTY_DIRECTION, TiC.PROPERTY_FORWARD);
				message.getData().putString(TiC.PROPERTY_URL, geocoderUrl);

				message.obj = responseHandler;
				message.sendToTarget();
			}

		} else {
			Log.e(TAG, "Unable to forward geocode, address is null");
		}
	}

	public void reverseGeocode(double latitude, double longitude, GeocodeResponseHandler responseHandler)
	{
		String geocoderUrl = buildGeocoderURL(TiC.PROPERTY_REVERSE, mobileId, appGuid, sessionId,
											  latitude + "," + longitude, countryCode);
		if (geocoderUrl != null) {
			Message message = runtimeHandler.obtainMessage(MSG_LOOKUP);
			message.getData().putString(TiC.PROPERTY_DIRECTION, TiC.PROPERTY_REVERSE);
			message.getData().putString(TiC.PROPERTY_URL, geocoderUrl);

			message.obj = responseHandler;
			message.sendToTarget();

		} else {
			Log.e(TAG, "Unable to reverse geocode, geocoder url is null");
		}
	}

	private String buildGeocoderURL(String direction, String mid, String aguid, String sid, String query,
									String countryCode)
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
			Log.e(TAG, "Unable to encode query to utf-8: " + e.getMessage());
		}

		return url;
	}

	private AsyncTask<Object, Void, Integer> getLookUpTask()
	{
		AsyncTask<Object, Void, Integer> task = new AsyncTask<Object, Void, Integer>() {
			@Override
			protected Integer doInBackground(Object... args)
			{
				GeocodeResponseHandler geocodeResponseHandler = null;
				KrollDict event = null;
				try {
					String url = (String) args[0];
					String direction = (String) args[1];
					geocodeResponseHandler = (GeocodeResponseHandler) args[2];

					Log.d(TAG, "GEO URL [" + url + "]", Log.DEBUG_MODE);
					HttpURLConnection connection = null;
					String response;
					StringBuilder result = new StringBuilder();
					try {
						URL mURL = new URL(url);
						connection = (HttpURLConnection) mURL.openConnection();
						connection.setRequestProperty("Expect", "100-continue");
						connection.connect();
						int responseCode = connection.getResponseCode();
						if (responseCode == 200) {
							InputStream in = new BufferedInputStream(connection.getInputStream());
							BufferedReader reader = new BufferedReader(new InputStreamReader(in));
							String line;
							while ((line = reader.readLine()) != null) {
								result.append(line);
							}
							response = result.toString();
						} else
							response = null;
					} catch (Exception e) {
						response = null;
					} finally {
						if (connection != null) {
							connection.disconnect();
						}
					}
					Log.i(TAG, "received Geo [" + response + "]", Log.DEBUG_MODE);

					if (response != null) {
						try {
							JSONObject jsonObject = new JSONObject(response);
							if (jsonObject.getBoolean(TiC.PROPERTY_SUCCESS)) {
								if (direction.equals("forward")) {
									event = buildForwardGeocodeResponse(jsonObject);

								} else {
									event = buildReverseGeocodeResponse(jsonObject);
								}
								event.putCodeAndMessage(TiC.ERROR_CODE_NO_ERROR, null);

							} else {
								event = new KrollDict();
								String errorCode = "Unable to resolve message: Code ("
												   + jsonObject.getString(TiC.ERROR_PROPERTY_ERRORCODE) + ")";
								event.putCodeAndMessage(TiC.ERROR_CODE_UNKNOWN, errorCode);
							}

						} catch (JSONException e) {
							Log.e(TAG, "Error converting geo response to JSONObject [" + e.getMessage() + "]", e,
								  Log.DEBUG_MODE);
						}
					}

				} catch (Throwable t) {
					Log.e(TAG, "Error retrieving geocode information [" + t.getMessage() + "]", t, Log.DEBUG_MODE);
				}

				if (geocodeResponseHandler != null) {
					if (event == null) {
						event = new KrollDict();
						event.putCodeAndMessage(TiC.ERROR_CODE_UNKNOWN, "Error obtaining geolocation");
					}
					geocodeResponseHandler.handleGeocodeResponse(event);
				}

				return -1;
			}
		};

		return task;
	}

	private KrollDict buildForwardGeocodeResponse(JSONObject jsonResponse) throws JSONException
	{
		KrollDict address = new KrollDict();

		JSONArray places = jsonResponse.getJSONArray(TiC.PROPERTY_PLACES);
		if (places.length() > 0) {
			address = buildAddress(places.getJSONObject(0));
		}
		return address;
	}

	private KrollDict buildReverseGeocodeResponse(JSONObject jsonResponse) throws JSONException
	{
		JSONArray places = jsonResponse.getJSONArray(TiC.PROPERTY_PLACES);
		ArrayList<KrollDict> addresses = new ArrayList<KrollDict>();

		int count = places.length();
		for (int i = 0; i < count; i++) {
			addresses.add(buildAddress(places.getJSONObject(i)));
		}

		KrollDict response = new KrollDict();
		response.put(TiC.PROPERTY_SUCCESS, true);
		response.put(TiC.PROPERTY_PLACES, addresses.toArray());

		return response;
	}

	private KrollDict buildAddress(JSONObject place)
	{
		KrollDict address = new KrollDict();
		address.put(TiC.PROPERTY_STREET1, place.optString(TiC.PROPERTY_STREET, ""));
		address.put(TiC.PROPERTY_STREET, place.optString(TiC.PROPERTY_STREET, ""));
		address.put(TiC.PROPERTY_CITY, place.optString(TiC.PROPERTY_CITY, ""));
		address.put(TiC.PROPERTY_REGION1, ""); // AdminArea
		address.put(TiC.PROPERTY_REGION2, ""); // SubAdminArea
		address.put(TiC.PROPERTY_POSTAL_CODE, place.optString("zipcode", ""));
		address.put(TiC.PROPERTY_COUNTRY, place.optString(TiC.PROPERTY_COUNTRY, ""));
		address.put(TiC.PROPERTY_STATE, place.optString(TiC.PROPERTY_STATE, ""));
		address.put(TiC.PROPERTY_COUNTRY_CODE, place.optString("country_code", ""));
		address.put(TiC.PROPERTY_LONGITUDE, place.optDouble(TiC.PROPERTY_LONGITUDE, 0.0d));
		address.put(TiC.PROPERTY_LATITUDE, place.optDouble(TiC.PROPERTY_LATITUDE, 0.0d));
		address.put(TiC.PROPERTY_ADDRESS, place.optString(TiC.PROPERTY_ADDRESS));

		return address;
	}
}
