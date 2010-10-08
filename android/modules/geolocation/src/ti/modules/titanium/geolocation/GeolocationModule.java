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
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Message;

@Kroll.module @ContextSpecific
public class GeolocationModule
	extends KrollModule
{
	private static final String LCAT = "TiGeo";
	private static final boolean DBG = TiConfig.LOGD;
	private static final String BASE_GEO_URL = "http://api.appcelerator.net/p/v1/geo?";

	@Kroll.constant public static final int ACCURACY_BEST = TiLocation.ACCURACY_BEST;
	@Kroll.constant public static final int ACCURACY_NEAREST_TEN_METERS = TiLocation.ACCURACY_NEAREST_TEN_METERS;
	@Kroll.constant public static final int ACCURACY_HUNDRED_METERS = TiLocation.ACCURACY_HUNDRED_METERS;
	@Kroll.constant public static final int ACCURACY_THREE_KILOMETERS = TiLocation.ACCURACY_THREE_KILOMETERS;
	
	@Kroll.constant public static final String PROVIDER_GPS = LocationManager.GPS_PROVIDER;
	@Kroll.constant public static final String PROVIDER_NETWORK = LocationManager.NETWORK_PROVIDER;
	
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	private static final int MSG_LOOKUP = MSG_FIRST_ID + 100;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private TiLocation tiLocation;
	private TiCompass tiCompass;

	public GeolocationModule(TiContext tiContext)
	{
		super(tiContext);

		tiLocation = new TiLocation(this);
		tiCompass = new TiCompass(this);

		eventManager.addOnEventChangeListener(this);
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getLocationServicesEnabled() {
		return tiLocation.isLocationEnabled();
	}

	@Kroll.method
	public boolean hasCompass() {
		return tiCompass.hasCompass();
	}

	@Kroll.method
	public void getCurrentHeading(KrollCallback listener)
	{
		if(listener != null) {
			tiCompass.getCurrentHeading(listener);
		}
	}

	@Kroll.method
	public void getCurrentPosition(KrollCallback listener)
	{
		if (listener != null) {
			tiLocation.getCurrentPosition(listener);
		}
	}

	@Override
	public void listenerAdded(String eventName, int count, KrollProxy proxy) {
		super.listenerAdded(eventName, count, proxy);

		if (proxy != null && proxy.equals(this)) {
			if (eventName != null) {
				if (eventName.equals(TiLocation.EVENT_LOCATION)) {
					tiLocation.manageLocationListener(true);
				} else if (eventName.equals(TiCompass.EVENT_HEADING)) {
					tiCompass.manageUpdateListener(true);
				}
			}
		}
	}

	@Override
	public void listenerRemoved(String eventName, int count, KrollProxy proxy) {
		super.listenerRemoved(eventName, count, proxy);

		if (proxy != null && proxy.equals(this)) {
			if (eventName != null && count == 0) {
				if (eventName.equals(TiLocation.EVENT_LOCATION)) {
					tiLocation.manageLocationListener(false);
				} else if (eventName.equals(TiCompass.EVENT_HEADING)) {
					tiCompass.manageUpdateListener(false);
				}
			}
		}
	}

	private String buildGeoURL(String direction, String mid, String aguid,
			String sid, String query, String countryCode) {
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
			// .append("&c=").append(countryCode)
			;
			// d=%@&mid=%@&aguid=%@&sid=%@&q=%@&c=%@",direction,mid,aguid,sid,[address
			// stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding],countryCode];

			url = sb.toString();
		} catch (UnsupportedEncodingException e) {
			Log.w(LCAT, "Unable to encode query to utf-8: " + e.getMessage());
		}

		return url;
	}

	@Kroll.method
	public void forwardGeocoder(String address, KrollCallback listener) {
		if (address != null) {
			String mid = TiPlatformHelper.getMobileId();
			String aguid = getTiContext().getTiApp().getAppInfo().getGUID();
			String sid = TiPlatformHelper.getSessionId();
			String countryCode = Locale.getDefault().getCountry();

			String url = buildGeoURL("f", mid, aguid, sid, address, countryCode);

			if (url != null) {
				Message msg = getUIHandler().obtainMessage(MSG_LOOKUP);
				msg.getData().putString("direction", "f");
				msg.getData().putString("url", url);
				msg.obj = listener;
				msg.sendToTarget();
			}
		} else {
			Log.w(LCAT, "Address should not be null.");
		}
	}

	@Kroll.method
	public void reverseGeocoder(double latitude, double longitude, KrollCallback callback) {
		String mid = TiPlatformHelper.getMobileId();
		String aguid = getTiContext().getTiApp().getAppInfo().getGUID();
		String sid = TiPlatformHelper.getSessionId();
		String countryCode = Locale.getDefault().getCountry();

		String url = buildGeoURL("r", mid, aguid, sid, latitude + ","
				+ longitude, countryCode);

		if (url != null) {
			Message msg = getUIHandler().obtainMessage(MSG_LOOKUP);
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

	private KrollDict buildReverseResponse(JSONObject r)
		throws JSONException
	{
		KrollDict response = new KrollDict();
		JSONArray places = r.getJSONArray("places");

		int count = places.length();
		KrollDict[] newPlaces = new KrollDict[count];
		for (int i = 0; i < count; i++) {
			newPlaces[i] = placeToAddress(places.getJSONObject(i));
		}

		response.put("success", true);
		response.put("places", newPlaces);
		return response;
	}

	private KrollDict buildForwardResponse(JSONObject r)
		throws JSONException
	{
		KrollDict response = new KrollDict();
		JSONArray places = r.getJSONArray("places");
		if (places.length() > 0) {
			response = placeToAddress(places.getJSONObject(0));
		}
		return response;
	}

	@Override
	public boolean handleMessage(final Message msg) {
		if (msg.what == MSG_LOOKUP) {
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
						HttpConnectionParams.setConnectionTimeout(httpParams,
								5000); // TODO use property
						// HttpConnectionParams.setSoTimeout(httpParams, 15000);
						// //TODO use property
						HttpClient client = new DefaultHttpClient(httpParams);

						ResponseHandler<String> responseHandler = new BasicResponseHandler();
						client.getParams().setBooleanParameter(
								"http.protocol.expect-continue", false);

						String response = client.execute(httpGet,
								responseHandler);

						if (DBG) {
							Log.i(LCAT, "Received Geo: " + response);
						}
						KrollDict event = null;
						if (response != null) {
							try {
								JSONObject r = new JSONObject(response);
								if (r.getBoolean("success")) {
									if (direction.equals("r")) {
										event = buildReverseResponse(r);
									} else {
										event = buildForwardResponse(r);
									}
								} else {
									event = new KrollDict();
									KrollDict err = new KrollDict();
									String errorCode = r.getString("errorcode");
									err.put("message", "Unable to resolve message: Code (" + errorCode + ")");
									err.put("code", errorCode);
									event.put("error", err);
								}
							} catch (JSONException e) {
								Log.e(LCAT,
										"Error converting geo response to JSONObject: "
												+ e.getMessage(), e);
							}
						}

						if (event != null) {
							event.put("source", this);
							callback.call(event);
						}
					} catch (Throwable t) {
						Log.e(LCAT, "Error retrieving geocode information: "
								+ t.getMessage(), t);
					}

					return -1;
				}

			};

			task.execute(msg.getData().getString("url"),
				msg.getData().getString("direction"), msg.obj);

			return true;
		}

		return super.handleMessage(msg);
	}

	// Lifecycle

	@Override
	public void onResume() {
		Log.i(LCAT, "onResume");
		
		super.onResume();

		tiLocation.onResume();
		tiCompass.onResume();
	}

	@Override
	public void onPause() {
		Log.i(LCAT, "onPause");
		super.onPause();

		tiLocation.onPause();
		tiCompass.onPause();
	}
}