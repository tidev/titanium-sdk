/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.util.List;
import java.util.Locale;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;

import android.annotation.SuppressLint;
import android.content.Context;
import android.location.Address;
import android.location.Location;
import android.location.LocationManager;

import com.appcelerator.aps.APSAnalytics;

public class TiLocation
{
	public static final int ERR_POSITION_UNAVAILABLE = 6;
	public static final int MSG_FIRST_ID = 100;
	public static final int MSG_LOOKUP = MSG_FIRST_ID + 1;
	public static final int MSG_LAST_ID = MSG_FIRST_ID + 2;

	public LocationManager locationManager;

	private static final String TAG = "TiLocation";

	private String mobileId;
	private String appGuid;
	private String sessionId;
	private String countryCode;
	private List<String> knownProviders;

	public TiLocation()
	{
		locationManager = (LocationManager) TiApplication.getInstance().getSystemService(Context.LOCATION_SERVICE);
		knownProviders = locationManager.getAllProviders();
		mobileId = APSAnalytics.getInstance().getMachineId();
		appGuid = TiApplication.getInstance().getAppInfo().getGUID();
		sessionId = APSAnalytics.getInstance().getCurrentSessionId();
		countryCode = Locale.getDefault().getCountry();
	}

	public boolean isProvider(String name)
	{
		return knownProviders.contains(name);
	}

	@SuppressLint("MissingPermission")
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

	static public KrollDict placeFromAddress(Address address)
	{
		final KrollDict place = new KrollDict();

		// Create place entry data.
		place.put(TiC.PROPERTY_STREET1, address.getThoroughfare());
		place.put(TiC.PROPERTY_STREET, address.getThoroughfare());
		place.put(TiC.PROPERTY_CITY, address.getLocality());
		place.put(TiC.PROPERTY_REGION1, address.getAdminArea());
		place.put(TiC.PROPERTY_REGION2, address.getSubAdminArea());
		place.put(TiC.PROPERTY_POSTAL_CODE, address.getPostalCode());
		place.put(TiC.PROPERTY_COUNTRY, address.getCountryName());
		place.put(TiC.PROPERTY_STATE, address.getAdminArea());
		place.put(TiC.PROPERTY_COUNTRY_CODE, address.getCountryCode());
		place.put(TiC.PROPERTY_LONGITUDE, address.getLongitude());
		place.put(TiC.PROPERTY_LATITUDE, address.getLatitude());

		// Construct full address.
		final StringBuilder addressBuilder = new StringBuilder();
		for (int i = 0; i <= address.getMaxAddressLineIndex(); i++) {
			if (i > 0) {
				addressBuilder.append(System.lineSeparator());
			}
			addressBuilder.append(address.getAddressLine(i));
		}
		place.put(TiC.PROPERTY_ADDRESS, addressBuilder.toString());

		// Replace `null` with empty string like previous behaviour.
		// Only non-strings are PROPERTY_LATITUDE and PROPERTY_LONGITUDE.
		// Which would have thrown an exception if unavailable (cant be null).
		for (final String key : place.keySet()) {
			if (place.get(key) == null) {
				place.put(key, "");
			}
		}

		return place;
	}
}
