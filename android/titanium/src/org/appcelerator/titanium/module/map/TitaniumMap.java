/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.map;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumActivityHelper;
import org.appcelerator.titanium.util.TitaniumDispatchException;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.LocalActivityManager;
import android.content.Intent;
import android.location.Address;
import android.location.Geocoder;
import android.os.Message;
import android.view.Window;
import android.webkit.WebView;
import android.widget.FrameLayout;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapController;
import com.google.android.maps.MapView;

public class TitaniumMap extends TitaniumBaseModule
{
	private static final String LCAT = "TiMap";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CREATE_MAPVIEW = 300;

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
				double longitude = coordinate.getDouble("longitude");
				double latitude = coordinate.getDouble("latitude");

				Geocoder gc = new Geocoder(tmm.getAppContext());
				List<Address> addresses = gc.getFromLocation(latitude, longitude, 1);

				if (addresses.size() > 0) {
					Address a = addresses.get(0);

					JSONObject address = null;
					address = new JSONObject();
					String v = null;

					v = a.getAddressLine(0);
					address.put("street1", v == null ? "" : v);

					v = "";
					if(a.getMaxAddressLineIndex() > 0) {
						v = a.getAddressLine(1);
					}
					address.put("street2", v);

					v = a.getLocality();
					address.put("city", v == null ? "" : v);

					v = a.getAdminArea();
					address.put("region1", v == null ? "" : v);

					v = a.getSubAdminArea();
					address.put("region2", v == null ? "" : v);

					v = a.getPostalCode();
					address.put("postalCode",  v == null ? "" : v);

					v = a.getCountryName();
					address.put("country",  v == null ? "" : v);

					v = a.getCountryCode();
					address.put("countryCode",  v == null ? "" : v);

					// feature/phone are not in spec.
					v = a.getFeatureName();
					address.put("feature",  v == null ? "" : v);

					v = a.getPhone();
					address.put("phone",  v == null ? "" : v);

					address.put("longitude", a.getLongitude());
					address.put("latitude", a.getLatitude());

					tmm.getWebView().evalJS(callback, address);
					address = null;
				}
			} catch (IOException e) {
				String msg = "Error performing reverse geo lookup: " + e.getMessage();
				Log.e(LCAT, msg);
				throw new TitaniumDispatchException(msg, moduleName);
			} catch (JSONException e) {
				Log.e(LCAT, "Error processing JSON arguments", e);
			}
		} else {
			Log.e(LCAT, "Must send longitude and latitude when requesting reverse geolocation");
			throw new TitaniumDispatchException("Missing longitude and/or latitude", moduleName);
		}
	}

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
