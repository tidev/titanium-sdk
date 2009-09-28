/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumGesture;
import org.appcelerator.titanium.api.ITitaniumProperties;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.appcelerator.titanium.util.TitaniumSensorHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.webkit.WebView;

public class TitaniumGesture extends TitaniumBaseModule implements ITitaniumGesture
{
	private static final String LCAT = "TiGesture";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EVENT_SHAKE = "shake";
	public static final String EVENT_ORIENTATION = "orientationchange";

	protected TitaniumJSEventManager eventManager;
	TitaniumSensorHelper sensorHelper;

	protected SensorEventListener shakeListener;
	protected TitaniumWebView.OnConfigChange orientationListener;

	protected boolean sensorAttached;
	protected boolean listeningForShake;
	protected boolean listeningForOrientation;

	protected long firstEventInShake;
	protected long lastEventInShake;
	protected int lastOrientation;
	protected int lastConfigOrientation;

	protected boolean shakeInitialized = false;
	protected boolean inShake = false;
	protected double threshold;
	protected double shakeFactor;
	protected int postShakePeriod;
	protected int inShakePeriod;

	protected float last_x;
	protected float last_y;
	protected float last_z;

	public TitaniumGesture(TitaniumModuleManager manager, String moduleName)
	{
		super(manager, moduleName);
		eventManager = new TitaniumJSEventManager(manager);
		eventManager.supportEvent(EVENT_SHAKE);
		eventManager.supportEvent(EVENT_ORIENTATION);

		sensorHelper = new TitaniumSensorHelper();

		shakeListener = createShakeListener();
		orientationListener = createOrientationListener();

		sensorAttached = false;
		listeningForShake = false;
		listeningForOrientation = false;

		lastOrientation = 0;
		lastConfigOrientation = 0;

		ITitaniumProperties props = tmm.getApplication().getAppInfo().getSystemProperties();
		shakeFactor = props.getDouble("ti.android.shake.factor", 1.3d);
		postShakePeriod = props.getInt("ti.android.shake.quiet.milliseconds", 500);
		inShakePeriod = props.getInt("ti.android.shake.active.milliseconds", 1000);
		if (DBG) {
			Log.i(LCAT, "Shake Factor: " + shakeFactor);
			Log.i(LCAT, "Post Shake Period (ms): " + postShakePeriod);
			Log.i(LCAT, "In Shake Period(ms): " + inShakePeriod);
		}

		threshold = shakeFactor * shakeFactor * SensorManager.GRAVITY_EARTH * SensorManager.GRAVITY_EARTH;
	}

	private int convertToTiOrientation(int orientation) {
		int result = 0;
		switch(orientation) {
		case Configuration.ORIENTATION_LANDSCAPE :
			result = 0x10; // see tigesture.js
			break;
		case Configuration.ORIENTATION_PORTRAIT :
			result = 0x02;
			break;
		case Configuration.ORIENTATION_SQUARE :
		case Configuration.ORIENTATION_UNDEFINED :
			result = 0;
		}

		return result;
	}
	protected SensorEventListener createShakeListener() {
		return new SensorEventListener()
		{

			public void onAccuracyChanged(Sensor sensor, int accuracy)
			{

			}

			public void onSensorChanged(SensorEvent event)
			{
				long currentEventInShake = System.currentTimeMillis();
				long difftime = currentEventInShake - lastEventInShake;

				float x = event.values[SensorManager.DATA_X];
				float y = event.values[SensorManager.DATA_Y];
				float z = event.values[SensorManager.DATA_Z];

				double force = Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2);
				if (shakeInitialized && (threshold < force))
				{
					if (! inShake) {
						firstEventInShake = currentEventInShake;
						inShake = true;
					}
					lastEventInShake = currentEventInShake;

					Log.d(LCAT, "ACC-Shake : threshold: " + threshold + " force: " + force + " delta : " + force + " x: " + x + " y: " + y + " z: " + z);

				} else {
					if (shakeInitialized && inShake) {
						if (difftime > postShakePeriod) {
							inShake = false;
							if (lastEventInShake - firstEventInShake > inShakePeriod) {
								String data = null;

								JSONObject json = new JSONObject();
								try {
									json.put("type", EVENT_SHAKE);
									json.put("timestamp", lastEventInShake);
									json.put("x", x);
									json.put("y", y);
									json.put("z", z);
									data = json.toString();
								} catch(JSONException e) {
									Log.e(LCAT, "Error adding value to return object ", e);
								}

								eventManager.invokeSuccessListeners(EVENT_SHAKE, data);
							}
						}
					}
				}

				last_x = x;
				last_y = y;
				last_z = z;

				if (!shakeInitialized) {
					shakeInitialized = true;
				}
			}
		};
	}

	protected TitaniumWebView.OnConfigChange createOrientationListener() {
		return new TitaniumWebView.OnConfigChange() {

			public void configurationChanged(Configuration config) {
				if (config.orientation != lastConfigOrientation) {
					int currentOrientation = convertToTiOrientation(config.orientation);

					StringBuilder sb = new StringBuilder();
					sb.append("{ from : ").append(lastOrientation)
						.append(", to : ").append( currentOrientation)
						.append(", type : '").append(EVENT_ORIENTATION)
						.append("' }");
						;

					eventManager.invokeSuccessListeners(EVENT_ORIENTATION, sb.toString());
					lastOrientation = currentOrientation;
					lastConfigOrientation = config.orientation;
				}
			}
		};
	}

	@Override
	public void register(WebView webView) {
		String name = super.getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumGesture as " + name);
		}
		webView.addJavascriptInterface((ITitaniumGesture) this, name);
	}

	public int addEventListener(String eventName, String listener)
	{
		int listenerId = eventManager.addListener(eventName, listener);
		if (eventName.equals(EVENT_SHAKE)) {
			if (!listeningForShake) {
				manageShakeListener(true);
			}
		} else if (eventName.equals(EVENT_ORIENTATION)) {
			if (!listeningForOrientation) {
				manageOrientationListener(true);
			}
		}

		return listenerId;
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
		if (listeningForShake && eventName.equals(EVENT_SHAKE)) {
			if (! eventManager.hasListeners(EVENT_SHAKE)) {
				manageShakeListener(false);
			}
		} else if (listeningForOrientation && eventName.equals(EVENT_ORIENTATION)) {
			if (! eventManager.hasListeners(EVENT_ORIENTATION)) {
				manageOrientationListener(false);
			}
		}
	}

	protected void manageShakeListener(boolean register) {
		if (sensorAttached) {
			if (register) {
				sensorHelper.registerListener(Sensor.TYPE_ACCELEROMETER,
						shakeListener, SensorManager.SENSOR_DELAY_GAME);
				listeningForShake = true;
			} else {
				if (listeningForShake) {
					sensorHelper.unregisterListener(Sensor.TYPE_ACCELEROMETER, shakeListener);
					listeningForShake = false;
					shakeInitialized = false;
					inShake = false;
				}
			}
		}
	}

	protected void manageOrientationListener(boolean register) {
		if (register) {
			tmm.getCurrentUIWebView().addConfigChangeListener(orientationListener);
			listeningForOrientation = true;
		} else {
			tmm.getCurrentUIWebView().removeConfigChangeListener(orientationListener);
			listeningForOrientation = false;
		}
	}

	@Override
	public void onResume() {
		super.onResume();

		sensorAttached = sensorHelper.attach(getActivity());

		if (sensorAttached) {
			if (eventManager.hasListeners(EVENT_SHAKE)) {
				manageShakeListener(true);
			}
		}

		if (eventManager.hasListeners(EVENT_ORIENTATION)) {
			manageOrientationListener(true);
		}
	}

	@Override
	public void onPause() {
		super.onPause();

		if (sensorAttached) {
			manageShakeListener(false);

			sensorHelper.detach();
			sensorAttached = false;
		}

		if (listeningForOrientation) {
			manageOrientationListener(false);
		}
	}
}
