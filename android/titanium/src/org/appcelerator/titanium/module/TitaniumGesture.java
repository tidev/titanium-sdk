package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumGesture;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.appcelerator.titanium.util.TitaniumSensorHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Config;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumGesture extends TitaniumBaseModule implements ITitaniumGesture
{
	private static final String LCAT = "TiGesture";
	private static final boolean DBG = Config.LOGD;

	public static final String EVENT_SHAKE = "shake";
	public static final String EVENT_ORIENTATION = "orientationchange";

	protected static final float FILTER_FACTOR = 0.1f;
	protected static final float SHAKE_THRESHOLD = 800f;

	protected TitaniumJSEventManager eventManager;
	TitaniumSensorHelper sensorHelper;

	protected SensorEventListener shakeListener;
	protected TitaniumActivity.OnConfigChange orientationListener;

	protected boolean sensorAttached;
	protected boolean listeningForShake;
	protected boolean listeningForOrientation;

	protected long lastEventInShake;
	protected int lastOrientation;
	protected int lastConfigOrientation;

	protected boolean shakeInitialized = false;

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
	}

	private float lowPass(float cur, float prev) {
		return (cur * FILTER_FACTOR) + (prev * (1.0f - FILTER_FACTOR));
	}

	private float highPass(float cur, float prev) {
		return cur - lowPass(cur, prev);
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

			/*
        double netForce=Math.pow(values[SensorManager.DATA_X], 2.0);

        netForce+=Math.pow(values[SensorManager.DATA_Y], 2.0);
        netForce+=Math.pow(values[SensorManager.DATA_Z], 2.0);

        if (threshold<(Math.sqrt(netForce)/SensorManager.GRAVITY_EARTH)) {
          isShaking();

			 */
			public void onSensorChanged(SensorEvent event)
			{
				long currentEventInShake = System.currentTimeMillis();
				long difftime = currentEventInShake - lastEventInShake;

				if (difftime > 300) {
					lastEventInShake = currentEventInShake;

					//float x = highPass(event.values[SensorManager.DATA_X], last_x);
					//float y = highPass(event.values[SensorManager.DATA_Y], last_y);
					//float z = highPass(event.values[SensorManager.DATA_Z], last_z);

					float x = event.values[SensorManager.DATA_X];
					float y = event.values[SensorManager.DATA_Y];
					float z = event.values[SensorManager.DATA_Z];

					//float force = Math.abs(x * 0.70f + y * 0.20f + z * 0.10f) / difftime * 10000f;

					double force = Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2);

					//if (shakeInitialized && force > SHAKE_THRESHOLD)
					double test = Math.sqrt(force)/SensorManager.GRAVITY_EARTH;
					if (shakeInitialized && (1.3d < test))
					{
						Log.d(LCAT, "ACC-Shake : test: " + test + " delta : " + force + " x: " + x + " y: " + y + " z: " + z);

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

					last_x = x;
					last_y = y;
					last_z = z;

					if (!shakeInitialized) {
						shakeInitialized = true;
					}
				}
			}
		};
	}

	protected TitaniumActivity.OnConfigChange createOrientationListener() {
		return new TitaniumActivity.OnConfigChange() {

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
				}
			}
		}
	}

	protected void manageOrientationListener(boolean register) {
		if (register) {
			getActivity().addConfigChangeListener(orientationListener);
			listeningForOrientation = true;
		} else {
			getActivity().removeConfigChangeListener(orientationListener);
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
