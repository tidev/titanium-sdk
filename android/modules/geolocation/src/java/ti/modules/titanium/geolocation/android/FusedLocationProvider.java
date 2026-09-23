/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation.android;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import android.annotation.SuppressLint;
import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.core.location.LocationManagerCompat;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.location.CurrentLocationRequest;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationAvailability;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.CancellationTokenSource;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import ti.modules.titanium.geolocation.GeolocationModule;
import ti.modules.titanium.geolocation.android.LocationProviderProxy.LocationProviderListener;

/**
 * FusedLocationProvider exposes the Google Play Services fused location API.
 * It is only used when the Google Play Services APK is available on the device; otherwise
 * the geolocation module falls back to the platform LocationManager.
 */
public class FusedLocationProvider
{
	private static final String TAG = "FusedLocationProvider";

	public static final String PROVIDER = "fused";

	/** Extra time granted to a single-shot request before we give up on the Play Services task. */
	private static final long TIMEOUT_GRACE_MILLIS = 2000;

	/**
	 * Receives the result of a single-shot location request.
	 */
	public interface LocationConsumer {
		/**
		 * @param location the location fix, or <code>null</code> if none could be obtained in time
		 */
		void accept(Location location);
	}

	private static boolean useFusedLocation = true;

	private final GeolocationModule geolocationModule;
	private FusedLocationProviderClient fusedLocationClient;
	private final ArrayList<LocationProviderProxy> registeredProviders = new ArrayList<>();

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
			fusedLocationClient = LocationServices.getFusedLocationProviderClient(context);
			warmLastLocation();
		}
	}

	/**
	 * Seeds the module with the last fix known to Play Services so that getCurrentPosition()
	 * and the first 'location' event can be served without waiting for the radios.
	 */
	@SuppressLint("MissingPermission")
	private void warmLastLocation()
	{
		if (!geolocationModule.hasLocationPermissions()) {
			return;
		}
		fusedLocationClient.getLastLocation().addOnSuccessListener(location -> {
			if (location != null) {
				geolocationModule.onLocationChanged(location);
			}
		});
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
			GoogleApiAvailability availability = GoogleApiAvailability.getInstance();
			if (availability.isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS) {
				return true;
			}
			Log.w(TAG, "Google Play Services is not available");
		} catch (Throwable t) {
			// NoClassDefFoundError if the Play Services library has been stripped from the app.
			Log.w(TAG, "Google Play Services library is not available: " + t.getMessage());
		}
		useFusedLocation = false;
		return false;
	}

	/**
	 * registerLocationProvider
	 * Registers a location provider proxy for continuous updates with the fused client.
	 * @param locationProvider: location provider proxy used when registering
	 */
	@SuppressLint("MissingPermission")
	public void registerLocationProvider(final LocationProviderProxy locationProvider)
	{
		if (locationProvider == null || fusedLocationClient == null) {
			return;
		}

		final LocationCallback callback = (LocationCallback) locationProvider.getLocationCallback();
		if (callback == null) {
			return;
		}

		// Deliver on the calling thread when it has a Looper (the Kroll runtime thread does).
		Looper looper = (Looper.myLooper() != null) ? Looper.myLooper() : Looper.getMainLooper();

		registeredProviders.add(locationProvider);
		fusedLocationClient.requestLocationUpdates(buildLocationRequest(locationProvider), callback, looper)
			.addOnFailureListener(e -> {
				String message = (e instanceof ApiException) ? ((ApiException) e).getStatusMessage() : e.getMessage();
				Log.e(TAG, "Unable to request fused location updates: " + message);
				registeredProviders.remove(locationProvider);

				// Fall back to the platform LocationManager for this and all future requests.
				useFusedLocation = false;
				geolocationModule.registerLocationProvider(locationProvider);
			});
	}

	/**
	 * unregisterLocationProvider
	 * Stops continuous updates for the given location provider proxy.
	 * @param locationProvider: location provider proxy used when un-registering
	 */
	public void unregisterLocationProvider(LocationProviderProxy locationProvider)
	{
		if (locationProvider == null || fusedLocationClient == null) {
			return;
		}
		if (registeredProviders.remove(locationProvider)) {
			fusedLocationClient.removeLocationUpdates((LocationCallback) locationProvider.getLocationCallback());
		}
	}

	/**
	 * Requests a single fresh location fix. The consumer is always invoked exactly once,
	 * either with a location or with <code>null</code> once the timeout has elapsed.
	 *
	 * @param maxAgeMillis		a cached fix younger than this is acceptable and returned immediately
	 * @param timeoutMillis		how long to wait for a fix before giving up
	 * @param consumer			receives the result
	 */
	@SuppressLint("MissingPermission")
	public void getCurrentLocation(long maxAgeMillis, long timeoutMillis, @NonNull final LocationConsumer consumer)
	{
		if (fusedLocationClient == null) {
			consumer.accept(null);
			return;
		}

		final CurrentLocationRequest request = new CurrentLocationRequest.Builder()
												   .setPriority(priorityForAccuracy())
												   .setMaxUpdateAgeMillis(maxAgeMillis)
												   .setDurationMillis(timeoutMillis)
												   .build();

		final CancellationTokenSource cancellation = new CancellationTokenSource();
		final AtomicBoolean delivered = new AtomicBoolean(false);
		final Handler handler = new Handler(Looper.getMainLooper());
		final Runnable onTimeout = () -> {
			if (delivered.compareAndSet(false, true)) {
				Log.w(TAG, "Timed out waiting for a fused location fix");
				cancellation.cancel();
				consumer.accept(null);
			}
		};
		handler.postDelayed(onTimeout, timeoutMillis + TIMEOUT_GRACE_MILLIS);

		fusedLocationClient.getCurrentLocation(request, cancellation.getToken()).addOnCompleteListener(task -> {
			handler.removeCallbacks(onTimeout);
			if (!delivered.compareAndSet(false, true)) {
				return;
			}
			Location location = null;
			if (task.isSuccessful()) {
				location = task.getResult();
			} else if (task.getException() != null) {
				Log.w(TAG, "Unable to obtain current location: " + task.getException().getMessage());
			}
			consumer.accept(location);
		});
	}

	/**
	 * Builds a fused location request from the proxy's time/distance settings and the
	 * module's accuracy property.
	 */
	private LocationRequest buildLocationRequest(LocationProviderProxy locationProvider)
	{
		long interval = Math.max(0L, (long) locationProvider.getMinUpdateTime());
		float distance = Math.max(0f, (float) locationProvider.getMinUpdateDistance());

		int priority;
		if (AndroidModule.PROVIDER_PASSIVE.equals(locationProvider.getName())) {
			priority = Priority.PRIORITY_PASSIVE;
		} else {
			priority = priorityForAccuracy();
		}

		return new LocationRequest.Builder(priority, interval)
			.setMinUpdateIntervalMillis(interval)
			.setMinUpdateDistanceMeters(distance)
			.setWaitForAccurateLocation(priority == Priority.PRIORITY_HIGH_ACCURACY)
			.build();
	}

	private int priorityForAccuracy()
	{
		return geolocationModule.isHighAccuracy() ? Priority.PRIORITY_HIGH_ACCURACY
												  : Priority.PRIORITY_BALANCED_POWER_ACCURACY;
	}

	/**
	 * Creates the callback that forwards fused results to a provider listener.
	 * @param providerListener: the listener that will receive location and state events
	 * @param providerName: the name of the provider
	 * @return location callback
	 */
	public static Object createLocationCallback(final LocationProviderListener providerListener,
												final String providerName)
	{
		return new LocationCallback() {
			@Override
			public void onLocationResult(@NonNull LocationResult result)
			{
				Location location = result.getLastLocation();
				if (location != null) {
					providerListener.onLocationChanged(location);
				}
			}

			@Override
			public void onLocationAvailability(@NonNull LocationAvailability availability)
			{
				if (availability.isLocationAvailable()) {
					providerListener.onProviderStateChanged(providerName, LocationProviderProxy.STATE_AVAILABLE);
					return;
				}

				// The fused provider reports "unavailable" transiently, e.g. right after registering or
				// between fixes. Only surface it as an error when location services are actually off.
				if (isLocationEnabled()) {
					Log.d(TAG, "Fused location temporarily unavailable, waiting for the next fix", Log.DEBUG_MODE);
					return;
				}
				providerListener.onProviderStateChanged(providerName, LocationProviderProxy.STATE_UNAVAILABLE);
			}
		};
	}

	private static boolean isLocationEnabled()
	{
		LocationManager locationManager =
			(LocationManager) TiApplication.getInstance().getSystemService(Context.LOCATION_SERVICE);
		return (locationManager != null) && LocationManagerCompat.isLocationEnabled(locationManager);
	}
}
