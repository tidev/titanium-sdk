package org.appcelerator.titanium.module.geo;

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
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumDispatchException;
import org.appcelerator.titanium.util.TitaniumPlatformHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;
import android.webkit.WebView;

public class TitaniumGeolocation2 extends TitaniumBaseModule
{
	private static final String LCAT = "TiGeo2";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String BASE_GEO_URL = "http://api.appcelerator.net/p/v1/geo?";

	private static final int MSG_LOOKUP = 300;

	public TitaniumGeolocation2(TitaniumModuleManager manager, String moduleName) {
		super(manager, moduleName);
	}

	@Override
	public void register(WebView webView) {
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumGeo2 as " + moduleName + " using TitaniumMethod.");
		}

		tmm.registerInstance(moduleName, this);
	}

	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = super.handleMessage(msg);
		if (!handled) {
			switch(msg.what) {
				case MSG_LOOKUP : {
					AsyncTask<String,Void, Integer> task = new AsyncTask<String, Void, Integer>() {

						@Override
						protected Integer doInBackground(String... args) {
							try {
								String url = args[0];
								String direction = args[1];
								String callback = args[2];

								if (DBG) {
									Log.d(LCAT, "GEO URL: " + url);
								}
						   		HttpGet httpGet = new HttpGet(url);

						   		HttpParams httpParams = new BasicHttpParams();
						   		HttpConnectionParams.setConnectionTimeout(httpParams, 5000); //TODO use property
						   		//HttpConnectionParams.setSoTimeout(httpParams, 15000); //TODO use property
						   		HttpClient client = new DefaultHttpClient(httpParams);

						   		ResponseHandler<String> responseHandler = new BasicResponseHandler();
						   		client.getParams().setBooleanParameter("http.protocol.expect-continue", false);

								String response = client.execute(httpGet, responseHandler);

					   			if (DBG) {
					   				Log.i(LCAT, "Received Geo: " + response);
					   			}

					   			JSONObject address = null;

					   			if (response != null) {
					   				try {
					   					JSONObject r = new JSONObject(response);
					   					if (r.getBoolean("success")) {
						   					if (direction.equals("r")) {
						   						address = buildReverseResponse(r);
						   					} else {
						   						address = buildForwardResponse(r);
						   					}
					   					}
					   				} catch (JSONException e) {
					   					Log.e(LCAT, "Error converting reverse geo response to JSONObject: " + e.getMessage(), e);
					   				}
					   			}

					   			TitaniumWebView wv = tmm.getWebView();
					   			wv.evalJS(callback, address);

							} catch (Throwable t) {
								Log.e(LCAT, "Error retrieving geocode information: " + t.getMessage(), t);
							}

							return -1;
						}

					};

					task.execute((String)msg.obj, msg.getData().getString("direction"), msg.getData().getString("callback"));

					handled = true;
					break;
				}
			}
		}
		return handled;
	}

	JSONObject placeToAddress(JSONObject place)
		throws JSONException
	{
		JSONObject address = new JSONObject();

		address.put("street1", place.optString("street", ""));

//   							v = "";
//   							if(a.getMaxAddressLineIndex() > 0) {
//   								v = a.getAddressLine(1);
//   							}
//   							address.put("street2", v);

		address.put("city", place.optString("city", ""));
		address.put("region1", ""); //AdminArea
		address.put("region2", ""); //SubAdminArea
		address.put("postalCode",  place.optString("zipcode",""));
		address.put("country",  place.optString("country", ""));
		address.put("countryCode",  place.optString("country_code",""));
		address.put("longitude", place.optString("longitude",""));
		address.put("latitude", place.optString("latitude",""));
		address.put("displayAddress", place.optString("address"));

		return address;
	}

	JSONObject buildReverseResponse(JSONObject r)
		throws JSONException
	{
		JSONObject response = new JSONObject();
		JSONArray newPlaces = new JSONArray();
		JSONArray places = r.getJSONArray("places");

		int count = places.length();
		for(int i = 0; i < count; i++) {
			newPlaces.put(placeToAddress(places.getJSONObject(i)));
		}

		response.put("success", true);
		response.put("places", newPlaces);
		return response;
	}

	JSONObject buildForwardResponse(JSONObject r)
		throws JSONException
	{
		JSONObject response = null;
		JSONArray places = r.getJSONArray("places");
		if (places.length() > 0) {
			response = placeToAddress(places.getJSONObject(0));
		}
		return response;
	}

	public void reverseGeocoder(JSONObject coordinate, String callback) {
		if (coordinate.has("longitude") && coordinate.has("latitude")) {
			try {
				String latitude = coordinate.getString("latitude");
				String longitude = coordinate.getString("longitude");
				String mid = TitaniumPlatformHelper.getMobileId();
				String aguid = tmm.getApplication().getAppInfo().getAppGUID();
				String sid = TitaniumPlatformHelper.getSessionId();
				String countryCode = Locale.getDefault().getCountry();

				String url = buildGeoURL("r", mid, aguid, sid, latitude + "," + longitude, countryCode);

				if (url != null) {
					Message msg = handler.obtainMessage(MSG_LOOKUP, url);
					msg.getData().putString("direction", "r");
					msg.getData().putString("callback", callback);
					msg.sendToTarget();
				}
			} catch (JSONException e) {
				Log.e(LCAT, "Error processing JSON arguments", e);
				throw new TitaniumDispatchException("Error while accessing coordinates in reverseGeocoder", moduleName);
			}
		} else {
			Log.w(LCAT, "coordinate object must have both latitude and longitude");
		}
	}

	public void forwardGeocoder(String address, String callback) {
		if (address != null) {
			String mid = TitaniumPlatformHelper.getMobileId();
			String aguid = tmm.getApplication().getAppInfo().getAppGUID();
			String sid = TitaniumPlatformHelper.getSessionId();
			String countryCode = Locale.getDefault().getCountry();

			String url = buildGeoURL("f", mid, aguid, sid, address, countryCode);

			if (url != null) {
				Message msg = handler.obtainMessage(MSG_LOOKUP, url);
				msg.getData().putString("direction", "f");
				msg.getData().putString("callback", callback);
				msg.sendToTarget();
			}
		} else {
			Log.w(LCAT, "Address should not be null.");
		}
	}

	private String buildGeoURL(String direction, String mid, String aguid, String sid, String query, String countryCode)
	{
		String url = null;
		try {
			StringBuilder sb = new StringBuilder();

			sb
				.append(BASE_GEO_URL)
				.append("d=r")
				.append("&mid=").append(mid)
				.append("&aguid=").append(aguid)
				.append("&sid=").append(sid)
				.append("&q=").append(URLEncoder.encode(query, "utf-8"))
				//.append("&c=").append(countryCode)
				;
			//d=%@&mid=%@&aguid=%@&sid=%@&q=%@&c=%@",direction,mid,aguid,sid,[address stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding],countryCode];

			url = sb.toString();
		} catch (UnsupportedEncodingException e) {
			Log.w(LCAT, "Unable to encode query to utf-8: " + e.getMessage());
		}

		return url;
	}

//	public void reverseGeocoder2(JSONObject coordinate, String callback) {
//		if (coordinate.has("longitude") && coordinate.has("latitude")) {
//			try {
//				double longitude = coordinate.getDouble("longitude");
//				double latitude = coordinate.getDouble("latitude");
//
//				Geocoder gc = new Geocoder(tmm.getAppContext());
//				List<Address> addresses = gc.getFromLocation(latitude, longitude, 1);
//
//				if (addresses.size() > 0) {
//					Address a = addresses.get(0);
//
//					JSONObject address = null;
//					address = new JSONObject();
//					String v = null;
//
//					v = a.getAddressLine(0);
//					address.put("street1", v == null ? "" : v);
//
//					v = "";
//					if(a.getMaxAddressLineIndex() > 0) {
//						v = a.getAddressLine(1);
//					}
//					address.put("street2", v);
//
//					v = a.getLocality();
//					address.put("city", v == null ? "" : v);
//
//					v = a.getAdminArea();
//					address.put("region1", v == null ? "" : v);
//
//					v = a.getSubAdminArea();
//					address.put("region2", v == null ? "" : v);
//
//					v = a.getPostalCode();
//					address.put("postalCode",  v == null ? "" : v);
//
//					v = a.getCountryName();
//					address.put("country",  v == null ? "" : v);
//
//					v = a.getCountryCode();
//					address.put("countryCode",  v == null ? "" : v);
//
//					// feature/phone are not in spec.
//					v = a.getFeatureName();
//					address.put("feature",  v == null ? "" : v);
//
//					v = a.getPhone();
//					address.put("phone",  v == null ? "" : v);
//
//					address.put("longitude", a.getLongitude());
//					address.put("latitude", a.getLatitude());
//
//					tmm.getWebView().evalJS(callback, address);
//					address = null;
//				}
//			} catch (IOException e) {
//				String msg = "Error performing reverse geo lookup: " + e.getMessage();
//				Log.e(LCAT, msg);
//				throw new TitaniumDispatchException(msg, moduleName);
//			} catch (JSONException e) {
//				Log.e(LCAT, "Error processing JSON arguments", e);
//			}
//		} else {
//			Log.e(LCAT, "Must send longitude and latitude when requesting reverse geolocation");
//			throw new TitaniumDispatchException("Missing longitude and/or latitude", moduleName);
//		}
//	}


}
