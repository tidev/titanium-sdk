/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.util.Calendar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiSensorHelper;

import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Criteria;
import android.location.Location;
import android.os.SystemClock;

@SuppressWarnings("deprecation")
public class TiCompass implements SensorEventListener
{
	private SensorManager sensorManager;
	private Sensor accelerometer;
	private Sensor magnetometer;
	private boolean hasCompass = true;
	private float[] lastAccelerometer = new float[3];
	private float[] lastMagnetometer = new float[3];
	private boolean lastAccelerometerSet = false;
	private boolean lastMagnetometerSet = false;
	private float[] rotationMatrix = new float[9];
	private float[] orientationMatrix = new float[3];
	private float currentHeading = 0f;
	private float previousHeading = 0f;

	private static final String TAG = "TiCompass";
	private static final int DECLINATION_CHECK_INTERVAL = 60 * 1000;
	private static final int STALE_LOCATION_THRESHOLD = 10 * 60 * 1000;

	private GeolocationModule geolocationModule;
	private TiLocation tiLocation;
	private Calendar baseTime = Calendar.getInstance();
	private long sensorTimerStart = SystemClock.uptimeMillis();
	private GeomagneticField geomagneticField;
	private Criteria locationCriteria = new Criteria();
	private Location geomagneticFieldLocation;
	private long lastDeclinationCheck = 0;
	private long lastEventInUpdate = 0;

	// Initialize the module.
	public TiCompass(GeolocationModule geolocationModule, TiLocation tiLocation)
	{
		this.geolocationModule = geolocationModule;
		this.tiLocation = tiLocation;

		// Get our sensors.
		this.sensorManager = TiSensorHelper.getSensorManager();
		this.accelerometer = this.sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
		this.magnetometer = this.sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);

		// Set our hasCompass flag.
		if (this.accelerometer == null || this.magnetometer == null) {
			this.hasCompass = false;
		} else {
			this.hasCompass = true;
		}
	}

	// Add a new event listener.
	public void registerListener()
	{
		TiSensorHelper.registerListener(accelerometer, this, SensorManager.SENSOR_DELAY_UI);
		TiSensorHelper.registerListener(magnetometer, this, SensorManager.SENSOR_DELAY_UI);
	}

	// Remove an event listener.
	public void unregisterListener()
	{
		TiSensorHelper.unregisterListener(accelerometer, this);
		TiSensorHelper.unregisterListener(magnetometer, this);
	}

	// Accuracy changed, we don't really care tho.
	public void onAccuracyChanged(Sensor sensor, int accuracy)
	{
	}

	// Fire the event once we have both accelerometer and magnetometer values.
	public void fireHeadingEvent(SensorEvent event, final KrollFunction listener)
	{
		long eventTimestamp = event.timestamp / 1000000;
		if (listener == null && eventTimestamp - lastEventInUpdate > 250) {
			// Get the new heading.
			SensorManager.getRotationMatrix(rotationMatrix, null, lastAccelerometer, lastMagnetometer);
			SensorManager.getOrientation(rotationMatrix, orientationMatrix);
			float azimuthRadians = orientationMatrix[0];
			float azimuthDegrees = (float)((Math.toDegrees(orientationMatrix[0]) + 360) % 360);
			currentHeading = azimuthDegrees;

			// And the event timestamp.
			long actualTimestamp = baseTime.getTimeInMillis() + (eventTimestamp - sensorTimerStart);
			lastEventInUpdate = eventTimestamp;

			// Make sure enough of an orientation change has occurred.
			Object filter = geolocationModule.getProperty(TiC.PROPERTY_HEADING_FILTER);
			if (filter != null) {
				float headingFilter = TiConvert.toFloat(filter);
				if (listener != null && Math.abs(currentHeading - previousHeading) < headingFilter) {
					return;
				}
				previousHeading = currentHeading;
			}

			// Fire the event.
			if (listener != null) {
				listener.callAsync(geolocationModule.getKrollObject(), new Object[] { eventToHashMap(event, actualTimestamp) });
			} else {
				geolocationModule.fireEvent(TiC.EVENT_HEADING, eventToHashMap(event, actualTimestamp));
			}

			// Reset flags.
			lastAccelerometerSet = false;
			lastMagnetometerSet = false;
		}
	}

	// Sensor events!
	public void onSensorChanged(SensorEvent event)
	{
		// We need to get accelerometer AND magnetometer values before we can correctly set heading.
		if (event.sensor == accelerometer) {
			System.arraycopy(event.values, 0, lastAccelerometer, 0, event.values.length);
			lastAccelerometerSet = true;
		} else if (event.sensor == magnetometer) {
			System.arraycopy(event.values, 0, lastMagnetometer, 0, event.values.length);
			lastMagnetometerSet = true;
		} else {
			return;
		}

		if (lastAccelerometerSet && lastMagnetometerSet) {
			fireHeadingEvent(event, null);
		}
	}

	// Convert the event data into our object.
	private Object eventToHashMap(SensorEvent event, long timestamp)
	{
		float x = event.values[0];
		float y = event.values[1];
		float z = event.values[2];

		KrollDict heading = new KrollDict();
		heading.put(TiC.EVENT_PROPERTY_TYPE, TiC.EVENT_HEADING);
		heading.put(TiC.PROPERTY_TIMESTAMP, timestamp);
		heading.put(TiC.PROPERTY_X, x);
		heading.put(TiC.PROPERTY_Y, y);
		heading.put(TiC.PROPERTY_Z, z);
		heading.put(TiC.PROPERTY_MAGNETIC_HEADING, currentHeading);
		heading.put(TiC.PROPERTY_ACCURACY, event.accuracy);

		if (Log.isDebugModeEnabled()) {
			switch(event.accuracy) {
			case SensorManager.SENSOR_STATUS_UNRELIABLE :
				Log.i(TAG, "Compass accuracy unreliable");
				break;
			case SensorManager.SENSOR_STATUS_ACCURACY_LOW :
				Log.i(TAG, "Compass accuracy low");
				break;
			case SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM :
				Log.i(TAG, "Compass accuracy medium");
				break;
			case SensorManager.SENSOR_STATUS_ACCURACY_HIGH :
				Log.i(TAG, "Compass accuracy high");
				break;
			default :
				Log.w(TAG, "Unknown compass accuracy value: " + event.accuracy);
			}
		}

		updateDeclination();
		if (geomagneticField != null) {
			float trueHeading = (float)((currentHeading + geomagneticField.getDeclination() + 360) % 360);
			heading.put(TiC.PROPERTY_TRUE_HEADING, trueHeading);
		}

		KrollDict data = new KrollDict();
		data.putCodeAndMessage(TiC.ERROR_CODE_NO_ERROR, null);
		data.put(TiC.PROPERTY_HEADING, heading);
		return data;
	}

    
	/*
	 * Check whether a fresher location is available and update the GeomagneticField 
	 * that we use for correcting the magnetic heading. If the location is stale,
	 * use it anyway but log a warning.
	 */
	private void updateDeclination()
	{
		long currentTime = System.currentTimeMillis();

		if (currentTime - lastDeclinationCheck > DECLINATION_CHECK_INTERVAL) {
			String provider = tiLocation.locationManager.getBestProvider(locationCriteria, true);
			if (provider != null) {
				Location location = tiLocation.locationManager.getLastKnownLocation(provider);
				if (location != null) {
					if (geomagneticFieldLocation == null || (location.getTime() > geomagneticFieldLocation.getTime())) {
						geomagneticField = new GeomagneticField((float)location.getLatitude(), (float)location.getLongitude(), (float)(location.getAltitude()), currentTime);
						geomagneticFieldLocation = location;
					}
				}
			}
			if (geomagneticFieldLocation == null) {
				Log.w(TAG, "No location fix available, can't determine compass trueHeading.");
			} else if (currentTime - geomagneticFieldLocation.getTime() > STALE_LOCATION_THRESHOLD) {
				Log.w(TAG, "Location fix is stale, compass trueHeading may be incorrect.");
			}
			lastDeclinationCheck = currentTime;
		}
	}

	// Has a compass?
	public boolean getHasCompass()
	{
		return this.hasCompass;
	}

	// Get the heading once.
	public void getCurrentHeading(final KrollFunction listener)
	{
		if (listener == null) {
			Log.w(TAG, "No heading listener specified.");
			return;
		}

		final TiCompass oneShotHeadingListener = new TiCompass(this.geolocationModule, this.tiLocation)
		{
			public void onAccuracyChanged(Sensor sensor, int accuracy)
			{
				// No-op.
			}

			public void onSensorChanged(SensorEvent event) {
				// We need to get accelerometer AND magnetometer values before we can correctly set heading.
				if (event.sensor == accelerometer) {
					System.arraycopy(event.values, 0, lastAccelerometer, 0, event.values.length);
					lastAccelerometerSet = true;
				} else if (event.sensor == magnetometer) {
					System.arraycopy(event.values, 0, lastMagnetometer, 0, event.values.length);
					lastMagnetometerSet = true;
				} else {
					return;
				}
				if (lastAccelerometerSet && lastMagnetometerSet) {
					fireHeadingEvent(event, listener);
					TiSensorHelper.unregisterListener(accelerometer, this);
					TiSensorHelper.unregisterListener(magnetometer, this);
				}
			}
		};

		updateDeclination();
		TiSensorHelper.registerListener(accelerometer, oneShotHeadingListener, SensorManager.SENSOR_DELAY_UI);
                TiSensorHelper.registerListener(magnetometer, oneShotHeadingListener, SensorManager.SENSOR_DELAY_UI);
	}
}
