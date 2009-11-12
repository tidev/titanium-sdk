/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.map;

import java.util.Locale;
import java.util.concurrent.Semaphore;

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
import org.appcelerator.titanium.util.TitaniumActivityHelper;
import org.appcelerator.titanium.util.TitaniumDispatchException;
import org.appcelerator.titanium.util.TitaniumPlatformHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.LocalActivityManager;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Message;
import android.view.Window;
import android.webkit.WebView;

public class TitaniumMap extends TitaniumBaseModule
{
	private static final String LCAT = "TiMap";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String BASE_GEO_URL = "http://api.appcelerator.net/p/v1/geo?";

	private static final int MSG_CREATE_MAPVIEW = 300;
	private static final int MSG_REVERSE_LOOKUP = 301;

	private static LocalActivityManager lam;
	private static Window mapWindow;

	class Holder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public Holder() {
			super(0);
		}
		public Object o;
	}

	public TitaniumMap(TitaniumModuleManager tmm, String moduleName) {
		super(tmm, moduleName);
	}

	@Override
	public void register(WebView webView) {
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumMap as " + moduleName + " using TitaniumMethod.");
		}

		tmm.registerInstance(moduleName, this);

		lam = new LocalActivityManager(TitaniumActivityHelper.getRootActivity(tmm.getActivity()), true);
		lam.dispatchCreate(null);
	}


	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = super.handleMessage(msg);
		if (!handled) {
			switch(msg.what) {
			case MSG_CREATE_MAPVIEW :
				if (DBG) {
					Log.d(LCAT, "Creating MapView");
				}
				Holder h = (Holder) msg.obj;

				mapWindow = lam.startActivity("TIMAP", new Intent(tmm.getAppContext(), TitaniumMapActivity.class));
				h.o = new TitaniumMapView(tmm, mapWindow);
				handled = true;

				h.release();
				break;
			case MSG_REVERSE_LOOKUP :

				AsyncTask<String,Void, Integer> task = new AsyncTask<String, Void, Integer>() {

					@Override
					protected Integer doInBackground(String... args) {
						try {
							String url = args[0];
							String callback = args[1];

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
				   			/*	{"success":true,
								"places":[
									{"country":"USA",
									"country_code":"US",
									"address":"201-299 Grand Ave, Grapevine, TX 76092, USA",
									"longitude":-97.1307201,
									"latitude":32.9412383,"city": "Grapevine",
									"zipcode":"76092",
									"street":"201-299 Grand Ave"},
							 	]
							}
				   			 */

				   			if (response != null) {
				   				try {
				   					JSONObject r = new JSONObject(response);
				   					if (r.getBoolean("success")) {
				   						JSONArray places = r.getJSONArray("places");
				   						if (places.length() > 0) {
				   							JSONObject place = places.getJSONObject(0);
				   							address = new JSONObject();

				   							address.put("street1", place.optString("street", ""));

//				   							v = "";
//				   							if(a.getMaxAddressLineIndex() > 0) {
//				   								v = a.getAddressLine(1);
//				   							}
//				   							address.put("street2", v);

				   							address.put("city", place.optString("city", ""));
				   							address.put("region1", ""); //AdminArea
				   							address.put("region2", ""); //SubAdminArea
				   							address.put("postalCode",  place.optString("zipcode",""));
				   							address.put("country",  place.optString("country", ""));
				   							address.put("countryCode",  place.optString("country_code",""));
				   							address.put("longitude", place.optString("longitude",""));
				   							address.put("latitude", place.optString("latitude",""));
				   							address.put("displayAddress", place.optString("address"));

				   							place = null;
				   							places = null;
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

				task.execute((String)msg.obj, msg.getData().getString("callback"));

				handled = true;
				break;
			}
		}

		return handled;
	}

	private Object create(int what)
	{
		Holder h = new Holder();
		handler.obtainMessage(what, h).sendToTarget();
		synchronized (h) {
			try {
				h.acquire();
			} catch (InterruptedException e) {
				Log.w(LCAT, "Interrupted while waiting for object construction: ", e);
			}
		}
		return h.o;
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

				String url = buildReverseGeoURL(mid, aguid, sid, latitude, longitude, countryCode);

				Message msg = handler.obtainMessage(MSG_REVERSE_LOOKUP, url);
				msg.getData().putString("callback", callback);
				msg.sendToTarget();
			} catch (JSONException e) {
				Log.e(LCAT, "Error processing JSON arguments", e);
				throw new TitaniumDispatchException("Error while accessing coordinates in reverseGeocoder", moduleName);
			}
		} else {
			Log.w(LCAT, "coordinate object must have both latitude and longitude");
		}
	}

	private String buildReverseGeoURL(String mid, String aguid, String sid, String latitude, String longitude, String countryCode)
	{
		StringBuilder sb = new StringBuilder();

		sb
			.append(BASE_GEO_URL)
			.append("d=r")
			.append("&mid=").append(mid)
			.append("&aguid=").append(aguid)
			.append("&sid=").append(sid)
			.append("&q=").append(latitude).append("%2C").append(longitude)
			//.append("&c=").append(countryCode)
			;
		//d=%@&mid=%@&aguid=%@&sid=%@&q=%@&c=%@",direction,mid,aguid,sid,[address stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding],countryCode];

		return sb.toString();
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

	public String createMapView()
	{
		if (mapWindow != null) {
			throw new TitaniumDispatchException("MapView already created. Android can only support one MapView per Application.", moduleName);
		}
		TitaniumMapView tmv = (TitaniumMapView) create(MSG_CREATE_MAPVIEW);
		String name = tmm.generateId("TitaniumMapView");
		tmm.registerInstance(name, tmv);

		return name;
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
		if (mapWindow != null) {
			mapWindow.closeAllPanels();
			mapWindow = null;
		}
		if (lam != null) {
			lam.dispatchDestroy(true);
			lam.removeAllActivities();
			lam = null;
		}
	}

	@Override
	public void onPause() {
		super.onPause();
		if (lam != null) {
			lam.dispatchPause(false);
		}
	}

	@Override
	public void onResume() {
		super.onResume();
		if (lam != null) {
			lam.dispatchResume();
		}
	}
}
