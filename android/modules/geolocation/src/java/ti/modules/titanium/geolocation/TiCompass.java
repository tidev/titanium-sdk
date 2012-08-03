/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.util.Calendar;
import java.util.HashMap;

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

public class TiCompass
	implements SensorEventListener
{
	private static final String TAG = "TiCompass";
	private static final int DECLINATION_CHECK_INTERVAL = 60 * 1000;
	private static final int STALE_LOCATION_THRESHOLD = 10 * 60 * 1000;

	private GeolocationModule geolocationModule;
	private TiLocation tiLocation;
	private Calendar baseTime = Calendar.getInstance();
	private long sensorTimerStart = SystemClock.uptimeMillis();
	private long lastEventInUpdate;
	private float lastHeading = 0.0f;
	private GeomagneticField geomagneticField;
	private Criteria locationCriteria = new Criteria();
	private Location geomagneticFieldLocation;
	private long lastDeclinationCheck;


	public TiCompass(GeolocationModule geolocationModule, TiLocation tiLocation)
	{
		this.geolocationModule = geolocationModule;
		this.tiLocation = tiLocation;
	}

	public void registerListener()
	{
		updateDeclination();
		TiSensorHelper.registerListener(Sensor.TYPE_ORIENTATION, this, SensorManager.SENSOR_DELAY_UI);
	}

	public void unregisterListener()
	{
		TiSensorHelper.unregisterListener(Sensor.TYPE_ORIENTATION, this);
	}

	public void onAccuracyChanged(Sensor sensor, int accuracy)
	{
	}

	public void onSensorChanged(SensorEvent event)
	{
		if (event.sensor.getType() == Sensor.TYPE_ORIENTATION) {
			long eventTimestamp = event.timestamp / 1000000;
			
			if (eventTimestamp - lastEventInUpdate > 250) {
				long actualTimestamp = baseTime.getTimeInMillis() + (eventTimestamp - sensorTimerStart);
				
				lastEventInUpdate = eventTimestamp;

				Object filter = geolocationModule.getProperty(TiC.PROPERTY_HEADING_FILTER);
				if (filter != null) {
					float headingFilter = TiConvert.toFloat(filter);

					if (Math.abs(event.values[0] - lastHeading) < headingFilter) {
						return;
					}

					lastHeading = event.values[0];
				}

				geolocationModule.fireEvent(TiC.EVENT_HEADING, eventToHashMap(event, actualTimestamp));
			}
		}
	}

	private Object eventToHashMap(SensorEvent event, long timestamp)
	{
		float x = event.values[0];
		float y = event.values[1];
		float z = event.values[2];

		HashMap<String, Object> heading = new HashMap<String, Object>();
		heading.put(TiC.EVENT_PROPERTY_TYPE, TiC.EVENT_HEADING);
		heading.put(TiC.PROPERTY_TIMESTAMP, timestamp);
		heading.put(TiC.PROPERTY_X, x);
		heading.put(TiC.PROPERTY_Y, y);
		heading.put(TiC.PROPERTY_Z, z);
		heading.put(TiC.PROPERTY_MAGNETIC_HEADING, x);
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
			float trueHeading = (x + geomagneticField.getDeclination() + 360) % 360;

			heading.put(TiC.PROPERTY_TRUE_HEADING, trueHeading);
		}

		HashMap<String, Object> data = new HashMap<String, Object>();
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

	public boolean getHasCompass()
	{
		boolean compass = false;

		SensorManager sensorManager = TiSensorHelper.getSensorManager();
		if (sensorManager != null) {
			compass = sensorManager.getDefaultSensor(Sensor.TYPE_ORIENTATION) != null;
		} else {
			compass = TiSensorHelper.hasDefaultSensor(geolocationModule.getActivity(), Sensor.TYPE_ORIENTATION);
		}

		return compass;
	}

	public void getCurrentHeading(final KrollFunction listener)
	{
		if(listener != null) {
			final SensorEventListener oneShotHeadingListener = new SensorEventListener()
			{
				public void onAccuracyChanged(Sensor sensor, int accuracy) {

				}

				public void onSensorChanged(SensorEvent event) {
					if (event.sensor.getType() == Sensor.TYPE_ORIENTATION) {
						long eventTimestamp = event.timestamp / 1000000;
						long actualTimestamp = baseTime.getTimeInMillis() + (eventTimestamp - sensorTimerStart);

						listener.callAsync(geolocationModule.getKrollObject(), new Object[] { eventToHashMap(event, actualTimestamp) });
						TiSensorHelper.unregisterListener(Sensor.TYPE_ORIENTATION, this);
					}
				}
			};

			updateDeclination();
			TiSensorHelper.registerListener(Sensor.TYPE_ORIENTATION, oneShotHeadingListener, SensorManager.SENSOR_DELAY_UI);
		}
	}
}

