/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.geolocation;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
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

public class TiCompass
{
	private static final String LCAT = "TiCompass";
	private static final boolean DBG = TiConfig.LOGD;

	public static final String EVENT_HEADING = "heading";

	private static final int[] SENSORS = {Sensor.TYPE_ORIENTATION};
	private KrollModule proxy;
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

	public TiCompass(KrollModule proxy)
	{
		this.proxy = proxy;

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
					if (ts - lastEventInUpdate > 250) {
						lastEventInUpdate = ts;

						Object filter = proxy.getProperty("headingFilter");
						if (filter != null) {
							float headingFilter = TiConvert.toFloat(filter);

							if (Math.abs(event.values[0] - lastHeading) < headingFilter) {
								return;
							}

							lastHeading = event.values[0];
						}

						proxy.fireEvent(EVENT_HEADING, eventToKrollDict(event, ts));
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
					listener.call(eventToKrollDict(event, ts));

					sensorHelper.unregisterListener(SENSORS, this);
					manageUpdateListener(false, this);
				}
			}
		};

		manageUpdateListener(true, oneShotListener);
		sensorHelper.registerListener(SENSORS, oneShotListener, 5000);
	}

	protected void manageUpdateListener(boolean register) {
		manageUpdateListener(register, updateListener);
	}

	protected void manageUpdateListener(boolean register, SensorEventListener listener)
	{
		if (register) {
			if (!listeningForUpdate) {
				sensorAttached = sensorHelper.attach(proxy.getTiContext().getActivity());

				if(sensorAttached) {

					LocationManager locationManager = (LocationManager) proxy.getTiContext().getActivity().getSystemService(Context.LOCATION_SERVICE);

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
					listeningForUpdate = true;
				}
			}
		} else {
			if (listeningForUpdate) {
				sensorHelper.unregisterListener(SENSORS, listener);
				if (sensorHelper.isEmpty()) {
					listeningForUpdate = false;
					sensorHelper.detach();
				}
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
		}

		return compass;
	}
	public void onResume() {

		if (proxy.getTiContext().hasEventListener(EVENT_HEADING, proxy)) {
			manageUpdateListener(true, updateListener);
		}
	}

	public void onPause() {
		if (sensorAttached) {
			manageUpdateListener(false, updateListener);

			sensorHelper.detach();
			sensorAttached = false;
		}
	}
}
