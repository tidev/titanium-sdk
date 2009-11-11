/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.map;

import java.io.IOException;
import java.util.List;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumDispatchException;
import org.json.JSONException;
import org.json.JSONObject;

import com.google.android.maps.MapActivity;
import com.google.android.maps.MapView;

import android.app.LocalActivityManager;
import android.location.Address;
import android.location.Geocoder;
import android.webkit.WebView;

public class TitaniumMap extends TitaniumBaseModule
{
	private static final String LCAT = "TiMap";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public TitaniumMap(TitaniumModuleManager manager, String moduleName) {
		super(manager, moduleName);
	}

	@Override
	public void register(WebView webView) {
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumMap as " + moduleName + " using TitaniumMethod.");
		}

		tmm.registerModule(moduleName, this);
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

}
