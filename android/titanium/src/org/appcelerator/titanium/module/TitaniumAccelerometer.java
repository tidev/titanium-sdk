/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumAccelerometer;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.appcelerator.titanium.util.TitaniumSensorHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumAccelerometer extends TitaniumBaseModule implements ITitaniumAccelerometer
{
	private static final String LCAT = "TiAccelerometer";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EVENT_UPDATE = "update";

	protected TitaniumJSEventManager eventManager;
	TitaniumSensorHelper sensorHelper;

	protected SensorEventListener updateListener;

	protected boolean sensorAttached;
	protected boolean listeningForUpdate;

	protected long lastEventInUpdate;

	protected float last_x;
	protected float last_y;
	protected float last_z;

	public TitaniumAccelerometer(TitaniumModuleManager manager, String moduleName)
	{
		super(manager, moduleName);
		eventManager = new TitaniumJSEventManager(manager);
		eventManager.supportEvent(EVENT_UPDATE);

		sensorHelper = new TitaniumSensorHelper();

		updateListener = createUpdateListener();

		sensorAttached = false;
		listeningForUpdate = false;
	}

	protected SensorEventListener createUpdateListener() {
		return new SensorEventListener()
		{

			public void onAccuracyChanged(Sensor sensor, int accuracy)
			{

			}

			public void onSensorChanged(SensorEvent event)
			{
				if (event.timestamp - lastEventInUpdate > 100) {
					lastEventInUpdate = event.timestamp;

					float x = event.values[SensorManager.DATA_X];
					float y = event.values[SensorManager.DATA_Y];
					float z = event.values[SensorManager.DATA_Z];

					String data = null;

					JSONObject json = new JSONObject();
					try {
						json.put("type", EVENT_UPDATE);
						json.put("timestamp", lastEventInUpdate);
						json.put("x", x);
						json.put("y", y);
						json.put("z", z);
						data = json.toString();
					} catch(JSONException e) {
						Log.e(LCAT, "Error adding value to return object ", e);
					}

					eventManager.invokeSuccessListeners(EVENT_UPDATE, data);
				}
			}
		};
	}

	@Override
	public void register(WebView webView) {
		String name = super.getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumAccelerometer as " + name);
		}
		webView.addJavascriptInterface((ITitaniumAccelerometer) this, name);
	}

	public int addEventListener(String eventName, String listener)
	{
		int listenerId = eventManager.addListener(eventName, listener);
		if (eventName.equals(EVENT_UPDATE)) {
			if (!listeningForUpdate) {
				manageUpdateListener(true);
			}
		}

		return listenerId;
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
		if (listeningForUpdate && eventName.equals(EVENT_UPDATE)) {
			if (! eventManager.hasListeners(EVENT_UPDATE)) {
				manageUpdateListener(false);
			}
		}
	}

	protected void manageUpdateListener(boolean register)
	{
		if (sensorAttached) {
			if (register) {
				sensorHelper.registerListener(Sensor.TYPE_ACCELEROMETER,
						updateListener, SensorManager.SENSOR_DELAY_UI);
				listeningForUpdate = true;
			} else {
				if (listeningForUpdate) {
					sensorHelper.unregisterListener(Sensor.TYPE_ACCELEROMETER, updateListener);
					listeningForUpdate = false;
				}
			}
		}
	}

	@Override
	public void onResume() {
		super.onResume();

		sensorAttached = sensorHelper.attach(getActivity());

		if (sensorAttached) {
			if (eventManager.hasListeners(EVENT_UPDATE)) {
				manageUpdateListener(true);
			}
		}
	}

	@Override
	public void onPause() {
		super.onPause();

		if (sensorAttached) {
			manageUpdateListener(false);

			sensorHelper.detach();
			sensorAttached = false;
		}
	}
}
