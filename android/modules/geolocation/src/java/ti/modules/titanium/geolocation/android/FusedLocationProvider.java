/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation.android;

import ti.modules.titanium.geolocation.GeolocationModule;
import ti.modules.titanium.geolocation.android.LocationProviderProxy.LocationProviderListener;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationAvailability;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;

import java.util.ArrayList;
import java.util.Iterator;

/**
 * FusedLoactionProvider is used to expose the Google Play Services location API.
 * However, this functionality is only exposed if the Google Play Services library is detected.
 */
public class FusedLocationProvider
{

	private static final String TAG = "FusedLocationProvider";

	public static final String PROVIDER = "fused";

	private final GeolocationModule geolocationModule;

	private static boolean useFusedLocation = true;

	/**
	 * Constructor
	 * @param context: context to be used when accessing Google APIs
	 * @param geolocationModule: reference of the geolocation module to obtain accuracy when
	 *					         registering the location provider.
	 */
	public FusedLocationProvider(Context context, GeolocationModule geolocationModule)
	{
		this.geolocationModule = geolocationModule;

		if (hasPlayServices(context)) {
			PlayServices.init(context, geolocationModule);
		}
	}

	/**
	 * hasPlayServices
	 * @return do we have access to Google Play Services APIs?
	 */
	public static boolean hasPlayServices(Context context)
	{
		if (!useFusedLocation) {
			return false;
		}
		try {
			Class.forName("com.google.android.gms.common.GoogleApiAvailability");
			return PlayServices.validVersion() && PlayServices.available(context);
		} catch (Exception e) {
			useFusedLocation = false;
		}
		return false;
	}

	/**
	 * registerLocationProvider
	 * Use our PlayServices abstraction class to register a location provider
	 * @param locationProvider: location provider proxy used when registering
	 */
	public void registerLocationProvider(final LocationProviderProxy locationProvider)
	{
		if (locationProvider != null && geolocationModule != null) {
			try {
				PlayServices.registerLocationProvider(locationProvider, geolocationModule);
			} catch (Exception e) {
				Log.e(TAG, e.getMessage());
			}
		}
	}

	/**
	 * unregisterLocationProvider
	 * Use our PlayServices abstraction class to unregister a location provider
	 * @param locationProvider: location provider proxy used when un-registering
	 */
	public void unregisterLocationProvider(LocationProviderProxy locationProvider)
	{
		if (locationProvider != null) {
			try {
				PlayServices.unregisterLocationProvider(locationProvider);
			} catch (Exception e) {
				Log.e(TAG, e.getMessage());
			}
		}
	}

	/**
	 * Use our PlayServices abstraction class to create a location callback
	 * @param providerListener: the listener that will receive location and state events
	 * @param providerName: the name of the provider
	 * @return location callback
	 */
	public static Object createLocationCallback(final LocationProviderListener providerListener,
												final String providerName)
	{
		return PlayServices.createLocationCallback(providerListener, providerName);
	}

	/**
	 * PlayServices is used to abstract the Google Play Services APIs in a static class, preventing
	 * NoClassDefFound errors during runtime.
	 */
	private static abstract class PlayServices
	{

		private static int googleApiCode;
		private static GoogleApiClient googleApiClient;
		private static FusedLocationProviderClient fusedLocationClient;

		private static ArrayList<LocationProviderProxy> fusedLocationQueue = new ArrayList<>();
		private static ArrayList<LocationProviderProxy> fusedLocationProviders = new ArrayList<>();

		public static void init(Context context, final GeolocationModule geolocationModule)
		{
			// requires Google Play Services 11.0.0+ or later
			if (googleApiClient == null) {
				googleApiClient = new GoogleApiClient.Builder(context)
									  .addApi(LocationServices.API)
									  .addConnectionCallbacks(new GoogleApiClient.ConnectionCallbacks() {
										  @Override
										  public void onConnected(@Nullable Bundle bundle)
										  {
											  processFusedLocationQueue(geolocationModule);
										  }

										  @Override
										  public void onConnectionSuspended(int i)
										  {
											  Log.e(TAG, "Google Play Services connection suspended!");
											  useFusedLocation = false;
											  processFusedLocationQueue(geolocationModule);
										  }
									  })
									  .addOnConnectionFailedListener(new GoogleApiClient.OnConnectionFailedListener() {
										  @Override
										  public void onConnectionFailed(@NonNull ConnectionResult connectionResult)
										  {
											  Log.e(TAG, "Google Play Services connection failed!");
											  useFusedLocation = false;
											  processFusedLocationQueue(geolocationModule);
										  }
									  })
									  .build();

				googleApiClient.connect();

				if (fusedLocationClient == null) {
					fusedLocationClient = LocationServices.getFusedLocationProviderClient(context);
				}
			}
		}

		public static boolean validVersion()
		{
			if (GoogleApiAvailability.GOOGLE_PLAY_SERVICES_VERSION_CODE >= 11000000) {
				return true;
			}

			useFusedLocation = false;
			return false;
		}

		public static boolean available(Context context)
		{
			GoogleApiAvailability availability = GoogleApiAvailability.getInstance();
			if (availability != null) {
				googleApiCode = availability.isGooglePlayServicesAvailable(context);
				if (googleApiCode == ConnectionResult.SUCCESS) {
					return true;
				}
			}

			Log.w(TAG, "Google Play Services is not available");
			useFusedLocation = false;
			return false;
		}

		@SuppressLint("MissingPermission")
		public static void registerLocationProvider(final LocationProviderProxy locationProvider,
													final GeolocationModule geolocationModule)
		{
			if (googleApiClient != null) {
				if (googleApiClient.isConnected()) {
					final LocationRequest request = LocationRequest.create();
					request.setSmallestDisplacement((float) locationProvider.getMinUpdateDistance());
					request.setInterval((long) locationProvider.getMinUpdateTime());

					final int accuracy =
						geolocationModule.getProperties().optInt(TiC.PROPERTY_ACCURACY, GeolocationModule.ACCURACY_LOW);
					if (locationProvider.getName().equals(AndroidModule.PROVIDER_PASSIVE)) {
						request.setPriority(LocationRequest.PRIORITY_NO_POWER);
					} else {
						switch (accuracy) {
							case GeolocationModule.ACCURACY_LOW:
								request.setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);
								break;
							case GeolocationModule.ACCURACY_HIGH:
							default:
								request.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
						}
					}

					fusedLocationClient
						.requestLocationUpdates(request, (LocationCallback) locationProvider.getLocationCallback(),
												null)
						.addOnCompleteListener(new OnCompleteListener<Void>() {
							@Override
							public void onComplete(@NonNull Task<Void> task)
							{
								if (task.isSuccessful()) {
									fusedLocationProviders.add(locationProvider);
								} else {
									Log.e(TAG, "requestLocationUpdates() task failed");
									useFusedLocation = false;
									fusedLocationQueue.add(locationProvider);
								}
							}
						})
						.addOnFailureListener(new OnFailureListener() {
							@Override
							public void onFailure(@NonNull Exception e)
							{
								if (e instanceof ApiException) {
									Log.e(TAG, ((ApiException) e).getStatusMessage());
								} else {
									Log.e(TAG, e.getMessage());
								}
								useFusedLocation = false;
								fusedLocationQueue.add(locationProvider);
							}
						});
				} else {
					fusedLocationQueue.add(locationProvider);
				}
			}
		}

		public static void unregisterLocationProvider(LocationProviderProxy locationProvider)
		{
			if (fusedLocationClient != null && fusedLocationProviders.contains(locationProvider)) {
				fusedLocationClient.removeLocationUpdates((LocationCallback) locationProvider.getLocationCallback());
				fusedLocationProviders.remove(locationProvider);
			}
		}

		public static LocationCallback createLocationCallback(final LocationProviderListener providerListener,
															  final String providerName)
		{
			return new LocationCallback() {
				@Override
				public void onLocationResult(LocationResult result)
				{
					providerListener.onLocationChanged(result.getLastLocation());
				}

				@Override
				public void onLocationAvailability(LocationAvailability availability)
				{
					providerListener.onProviderStateChanged(
						providerName, availability.isLocationAvailable() ? LocationProviderProxy.STATE_AVAILABLE
																		 : LocationProviderProxy.STATE_UNAVAILABLE);
				}
			};
		}

		private static void processFusedLocationQueue(final GeolocationModule geolocationModule)
		{
			Iterator<LocationProviderProxy> i = fusedLocationQueue.iterator();
			while (i.hasNext()) {
				LocationProviderProxy provider = i.next();
				geolocationModule.registerLocationProvider(provider);
			}
			fusedLocationQueue.clear();
		}
	}
}
