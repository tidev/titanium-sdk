/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.io.UnsupportedEncodingException;
import java.lang.ref.WeakReference;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;

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
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiWeakMap;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import ti.modules.titanium.geolocation.TiGeoHelper.GeoFeature;
import android.app.Activity;
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

	private Map<WeakReference<TiContext>, ArrayList<TiGeoHelper>> contextGeoHelpers;

	public GeolocationModule(TiContext tiContext)
	{
		super(tiContext);
		contextGeoHelpers = Collections.synchronizedMap( new TiWeakMap<TiContext, ArrayList<TiGeoHelper>>() );
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getLocationServicesEnabled(KrollInvocation invocation) {
		TiLocation location = getTiLocationForContext(invocation, true);
		if (location == null) {
			return false;
		}
		return location.isLocationEnabled();
	}

	@Kroll.method @Kroll.getProperty
	public boolean getHasCompass(KrollInvocation invocation) {
		TiCompass compass = getTiCompassForContext(invocation, true);
		if (compass == null) {
			return false;
		}
		return compass.hasCompass();
	}

	@Kroll.method
	public void getCurrentHeading(KrollInvocation invocation, KrollCallback listener)
	{
		if(listener != null) {
			TiCompass compass = getTiCompassForContext(invocation, true);
			if (compass == null) {
				Log.w(LCAT, "Could not fetch/create TiCompass for activity requesting getCurrentHeading");
				return;
			}
			compass.getCurrentHeading(listener);
		}
	}

	@Kroll.method
	public void getCurrentPosition(KrollInvocation invocation, KrollCallback listener)
	{
		if (listener != null) {
			TiLocation tiLocation = getTiLocationForContext(invocation, true);
			if (tiLocation == null) {
				Log.w(LCAT, "Could not fetch/create TiLocation for activity requesting getCurrentPosition");
				return;
			}
			tiLocation.getCurrentPosition(listener);
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
							callback.callAsync(event);
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

	private TiGeoHelper getHelperForContext(KrollInvocation invocation, String eventName, boolean createIfMissing)
	{
		if (invocation != null && invocation.getTiContext() != null) {
			return getHelperForContext(invocation.getTiContext(), eventName, createIfMissing);
		} else {
			return null;
		}
	}
	
	private TiGeoHelper getHelperForContext(KrollInvocation invocation, String eventName)
	{
		return getHelperForContext(invocation, eventName, false);
	}
	
	private TiGeoHelper getHelperForContext(TiContext context, String eventName, boolean createIfMissing)
	{
		if (!TiGeoHelper.isGeoEvent(eventName)) {
			Log.w(LCAT, eventName + " is not a supported geo event (compass/location)");
			return null;
		}
		return getHelperForContext(context, TiGeoHelper.getFeatureForEvent(eventName), createIfMissing);
	}
	
	private TiGeoHelper getHelperForContext(TiContext context, GeoFeature feature, boolean createIfMissing)
	{
		ArrayList<TiGeoHelper> helpers = null;
		if (contextGeoHelpers.containsKey(context)) {
			helpers = contextGeoHelpers.get(context);
			if (helpers == null) {
				contextGeoHelpers.remove(context);
			}
		}
		if (helpers == null && !createIfMissing) {
			return null;
		}
		
		if (helpers == null) {
			helpers = new ArrayList<TiGeoHelper>(2);
			contextGeoHelpers.put(new WeakReference<TiContext>(context), helpers);
		}
		
		TiGeoHelper result = null;
		for (TiGeoHelper helper: helpers) {
			if (helper.getFeature() == feature) {
				result = helper;
				break;
			}
		}
		
		if (result == null && createIfMissing) {
			result = TiGeoHelper.getInstance(context, this, feature);
			helpers.add(result);
		}
		
		return result;
		
	}
	
	private TiLocation getTiLocationForContext(KrollInvocation invocation, boolean createIfMissing)
	{
		if (invocation != null && invocation.getTiContext() != null) {
			return getTiLocationForContext(invocation.getTiContext(), createIfMissing);
		}
		return null;
	}

	private TiLocation getTiLocationForContext(TiContext context, boolean createIfMissing)
	{
		return (TiLocation)getHelperForContext(context, GeoFeature.LOCATION, createIfMissing);
	}
	
	private TiCompass getTiCompassForContext(KrollInvocation invocation, boolean createIfMissing)
	{
		if (invocation != null && invocation.getTiContext() != null) {
			return getTiCompassForContext(invocation.getTiContext(), createIfMissing);
		} else {
			return null;
		}
	}

	private TiCompass getTiCompassForContext(TiContext context, boolean createIfMissing)
	{
		return (TiCompass)getHelperForContext(context, GeoFeature.DIRECTION, createIfMissing);
	}
	
	
	@Override
	public void removeEventListener(KrollInvocation invocation,	String eventName, Object listener)
	{
		if (!TiGeoHelper.isGeoEvent(eventName)) {
			super.removeEventListener(invocation, eventName, listener);
		} else {
			TiGeoHelper helper = getHelperForContext(invocation, eventName);
			if (helper != null) {
				helper.removeEventListener(listener);
			}
		}
	}
	
	@Override
	public int addEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		if (!TiGeoHelper.isGeoEvent(eventName)) {
			return super.addEventListener(invocation, eventName, listener);
		}
		
		TiGeoHelper helper = getHelperForContext(invocation, eventName, true);
		if (helper == null) {
			Log.w(LCAT, "Unable to get geo helper (location/compass) for event " + eventName);
			return 0;
		} else {
			return helper.addEventListener(listener);
		}
	}
	
	private ArrayList<TiGeoHelper> getGeoHelpersForActivity(Activity activity)
	{
		if (contextGeoHelpers != null && contextGeoHelpers.size() > 0)
		{
			for (WeakReference<TiContext> weakContext : contextGeoHelpers.keySet()) {
				TiContext context = weakContext.get();
				if (context != null && context.getActivity() != null && context.getActivity() == activity) {
					return contextGeoHelpers.get(weakContext);
				}
			}
				
		}
		return null;
	}

	@Override
	public void onResume(Activity activity)
	{
		super.onResume(activity);
		if (activity instanceof TiRootActivity) {
			ArrayList<TiGeoHelper> helpers = getGeoHelpersForActivity(activity);
			if (helpers != null) {
				for (TiGeoHelper helper : helpers) {
					helper.onResume(activity);
				}
			}
		}
	}

	@Override
	public void onPause(Activity activity)
	{
		super.onPause(activity);
		if (activity instanceof TiRootActivity) {
			ArrayList<TiGeoHelper> helpers = getGeoHelpersForActivity(activity);
			if (helpers != null) {
				for (TiGeoHelper helper : helpers) {
					helper.onPause(activity);
				}
			}
		}
	}

	@Override
	public void onDestroy(Activity activity)
	{
		super.onDestroy(activity);
		if (activity instanceof TiRootActivity) {
			ArrayList<TiGeoHelper> helpers = getGeoHelpersForActivity(activity);
			if (helpers != null) {
				for (TiGeoHelper helper : helpers) {
					helper.onDestroy(activity);
				}
			}
		}
		contextGeoHelpers.clear();
	}

	@Override
	public void onStop(Activity activity)
	{
		super.onStop(activity);
		if (activity instanceof TiRootActivity) {
			ArrayList<TiGeoHelper> helpers = getGeoHelpersForActivity(activity);
			if (helpers != null) {
				for (TiGeoHelper helper : helpers) {
					helper.onStop(activity);
				}
			}
		}
	}
	
}