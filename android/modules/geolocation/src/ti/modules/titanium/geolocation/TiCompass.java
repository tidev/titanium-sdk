/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import java.util.Calendar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiSensorHelper;

import android.content.Context;
import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationManager;
import android.os.SystemClock;

public class TiCompass extends TiGeoHelper
{
	private static final String LCAT = "TiCompass";
	private static final boolean DBG = TiConfig.LOGD;

	public static final String EVENT_HEADING = "heading";

	private static final int[] SENSORS = {Sensor.TYPE_ORIENTATION};
	private TiSensorHelper sensorHelper;

	protected SensorEventListener updateListener;

	protected boolean sensorAttached;
	protected boolean listeningForUpdate;

	protected long lastEventInUpdate;

	protected float last_x;
	protected float last_y;
	protected float last_z;

	protected float[] gravity;
	protected float[] geomagnetic;

	protected GeomagneticField geomagneticField;
	protected float lastHeading = 0.0f;
	private Calendar baseTime = Calendar.getInstance();
	private long sensorTimerStart = SystemClock.uptimeMillis();

	public TiCompass(TiContext context, KrollModule proxy)
	{
		super(context, proxy);

		sensorHelper = new TiSensorHelper();
		updateListener = createUpdateListener();

		sensorAttached = false;
		listeningForUpdate = false;
	}

	protected SensorEventListener createUpdateListener()
	{
		return new SensorEventListener()
		{

			public void onAccuracyChanged(Sensor sensor, int accuracy)
			{

			}

			public void onSensorChanged(SensorEvent event)
			{
				int type = event.sensor.getType();

				if (type == Sensor.TYPE_ORIENTATION) {
					long ts = event.timestamp / 1000000; // nanos to millis
					long tsActual = baseTime.getTimeInMillis() + (ts - sensorTimerStart);
					if (ts - lastEventInUpdate > 250) {
						lastEventInUpdate = ts;

						Object filter = null;
						KrollModule proxy = weakProxy.get();
						if (proxy != null) {
							filter = proxy.getProperty("headingFilter");
						}
						if (filter != null) {
							float headingFilter = TiConvert.toFloat(filter);

							if (Math.abs(event.values[0] - lastHeading) < headingFilter) {
								return;
							}

							lastHeading = event.values[0];
						}

						fireEvent(EVENT_HEADING, eventToKrollDict(event, tsActual));
					}
				}
			}
		};
	}

	public void getCurrentHeading(final KrollCallback listener)
	{
		final SensorEventListener oneShotListener = new SensorEventListener()
		{
			public void onAccuracyChanged(Sensor sensor, int accuracy)
			{

			}

			public void onSensorChanged(SensorEvent event)
			{
				int type = event.sensor.getType();

				if (type == Sensor.TYPE_ORIENTATION) {
					long ts = event.timestamp / 1000000; // nanos to millis
					long tsActual = baseTime.getTimeInMillis() + (ts - sensorTimerStart);
					listener.callAsync(eventToKrollDict(event, tsActual));

					manageUpdateListener(false, this, true);
				}
			}
		};

		manageUpdateListener(true, oneShotListener, true);
	}

	protected void manageUpdateListener(boolean register) {
		manageUpdateListener(register, updateListener, false);
	}

	protected void manageUpdateListener(boolean register, SensorEventListener listener, boolean oneShot)
	{
		if (register) {
			if (!listeningForUpdate || oneShot) {
				TiContext context = weakContext.get();
				if (context == null) {
					Log.w(LCAT, "Unable to register for compass events.  TiContext has been GC'd");
					return;
				}
				sensorAttached = sensorHelper.attach(context.getActivity());

				if(sensorAttached) {

					LocationManager locationManager = (LocationManager) context.getActivity().getSystemService(Context.LOCATION_SERVICE);

					Criteria criteria = new Criteria();
					String provider = locationManager.getBestProvider(criteria, true);
					if (provider != null) {
						Location location = locationManager.getLastKnownLocation(provider);
						if (location != null) {
							geomagneticField = new GeomagneticField((float)location.getLatitude(), (float)location.getLongitude(),
										(float) location.getAltitude(), System.currentTimeMillis());
						}
					}
					sensorHelper.registerListener(SENSORS , listener, SensorManager.SENSOR_DELAY_UI);
					listeningForUpdate = !oneShot;
				}
			}
		} else {
			if (listeningForUpdate || oneShot) {
				sensorHelper.unregisterListener(SENSORS, listener);
			}
			if (sensorHelper.isEmpty()) {
				listeningForUpdate = false;
				sensorHelper.detach();
			}
		}
	}

	protected KrollDict eventToKrollDict(SensorEvent event, long ts)
	{
		float x = event.values[0];
		float y = event.values[1];
		float z = event.values[2];

		KrollDict heading = new KrollDict();
		heading.put("type", EVENT_HEADING);
		heading.put("timestamp", ts);
		heading.put("x", x);
		heading.put("y", y);
		heading.put("z", z);
		heading.put("magneticHeading", x);
		heading.put("accuracy", event.accuracy);
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
				trueHeading = 360 - trueHeading;
			}

			heading.put("trueHeading", trueHeading);
		}
		KrollDict data = new KrollDict();
		data.put("heading", heading);

		return data;
	}

	public boolean hasCompass() {
		boolean compass = false;

		SensorManager sm = sensorHelper.getSensorManager();
		if (sm != null) {
			compass = sm.getDefaultSensor(Sensor.TYPE_ORIENTATION) != null;
		} else {
			// turn on sensor manager service just to get this info, then turn it off.
			TiContext context = weakContext.get();
			if (context != null) {
				compass = sensorHelper.hasDefaultSensor(context.getActivity(), Sensor.TYPE_ORIENTATION);
			}
		}

		return compass;
	}
	
	@Override
	protected void attach()
	{
		manageUpdateListener(true);
	}

	@Override
	protected void detach()
	{
		manageUpdateListener(false);
	}

	@Override
	protected void resume()
	{
		if (hasListeners()) {
			manageUpdateListener(true);
		}
		
	}

	@Override
	protected GeoFeature getFeature()
	{
		return GeoFeature.DIRECTION;
	}

	@Override
	protected boolean supportsEvent(String eventName)
	{
		return eventName.equals(EVENT_HEADING);
	}

}
