/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.geolocation;

import java.util.Calendar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.runtime.v8.V8Callback;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiLocationHelper;
import org.appcelerator.titanium.util.TiSensorHelper;

import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationManager;
import android.os.SystemClock;


public class TiCompass
	implements SensorEventListener
{
	private static final String LCAT = "TiCompass";
	private static final boolean DBG = TiConfig.LOGD;

	private GeolocationModule geolocationModule;
	private Calendar baseTime = Calendar.getInstance();
	private long sensorTimerStart = SystemClock.uptimeMillis();
	private long lastEventInUpdate;
	private float lastHeading = 0.0f;
	private GeomagneticField geomagneticField;


	public TiCompass(GeolocationModule geolocationModule)
	{
		this.geolocationModule = geolocationModule;
	}

	public void registerListener()
	{
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

				geolocationModule.fireEvent(TiC.EVENT_HEADING, eventToKrollDict(event, actualTimestamp));
			}
		}
	}

	private KrollDict eventToKrollDict(SensorEvent event, long timestamp)
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
		heading.put(TiC.PROPERTY_MAGNETIC_HEADING, x);
		heading.put(TiC.PROPERTY_ACCURACY, event.accuracy);

		if (DBG) {
			switch(event.accuracy) {
			case SensorManager.SENSOR_STATUS_UNRELIABLE :
				Log.i(LCAT, "Compass accuracy unreliable");
				break;
			case SensorManager.SENSOR_STATUS_ACCURACY_LOW :
				Log.i(LCAT, "Compass accuracy low");
				break;
			case SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM :
				Log.i(LCAT, "Compass accuracy medium");
				break;
			case SensorManager.SENSOR_STATUS_ACCURACY_HIGH :
				Log.i(LCAT, "Compass accuracy high");
				break;
			default :
				Log.w(LCAT, "Unknown compass accuracy value: " + event.accuracy);
			}
		}

		if (geomagneticField != null) {
			float trueHeading = x - geomagneticField.getDeclination();
			if (trueHeading < 0) {
				trueHeading = (360 - trueHeading) % 360;
			}

			heading.put(TiC.PROPERTY_TRUE_HEADING, trueHeading);
		}

		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_HEADING, heading);
		return data;
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

	public void getCurrentHeading(final V8Callback listener)
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

						listener.invoke(eventToKrollDict(event, actualTimestamp));
						//listener.callAsync(eventToKrollDict(event, actualTimestamp));
						TiSensorHelper.unregisterListener(Sensor.TYPE_ORIENTATION, this);
					}
				}
			};

			LocationManager locationManager = TiLocationHelper.getLocationManager();
			Criteria criteria = new Criteria();
			
			String provider = locationManager.getBestProvider(criteria, true);
			if (provider != null) {
				Location location = locationManager.getLastKnownLocation(provider);
				if (location != null) {
					geomagneticField = new GeomagneticField((float)location.getLatitude(), (float)location.getLongitude(), (float)(location.getAltitude()), System.currentTimeMillis());
				}
			}

			locationManager = null;

			TiSensorHelper.registerListener(Sensor.TYPE_ORIENTATION, oneShotHeadingListener, SensorManager.SENSOR_DELAY_UI);
		}
	}
}

