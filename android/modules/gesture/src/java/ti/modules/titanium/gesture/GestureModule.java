/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.gesture;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.TiOrientationHelper;
import org.appcelerator.titanium.util.TiSensorHelper;

import android.content.res.Configuration;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

@Kroll.module @ContextSpecific
public class GestureModule extends KrollModule
	implements SensorEventListener
{
	private static final String TAG = "GestureModule";
	private static final String EVENT_ORIENTATION_CHANGE = "orientationchange";
	private static final String EVENT_SHAKE = "shake";

	private boolean shakeRegistered = false;
	private long firstEventInShake;
	private long lastEventInShake;
	private boolean shakeInitialized = false;
	private boolean inShake = false;
	private double threshold;
	private double shakeFactor;
	private int postShakePeriod;
	private int inShakePeriod;
	private List<Object> orientationConfigListeners = new ArrayList<Object>();


	public GestureModule()
	{
		super();

		TiProperties props = TiApplication.getInstance().getAppProperties();
		shakeFactor = props.getDouble("ti.android.shake.factor", 1.3d);
		postShakePeriod = props.getInt("ti.android.shake.quiet.milliseconds", 500);
		inShakePeriod = props.getInt("ti.android.shake.active.milliseconds", 1000);
		threshold = shakeFactor * shakeFactor * SensorManager.GRAVITY_EARTH * SensorManager.GRAVITY_EARTH;
		if (Log.isDebugModeEnabled()) {
			Log.i(TAG, "Shake Factor: " + shakeFactor);
			Log.i(TAG, "Post Shake Period (ms): " + postShakePeriod);
			Log.i(TAG, "In Shake Period(ms): " + inShakePeriod);
			Log.i(TAG, "Threshold: " + threshold);
		}
	}

	protected void eventListenerAdded(String event, int count, KrollProxy proxy)
	{
		if (EVENT_ORIENTATION_CHANGE.equals (event))
		{
			if (orientationConfigListeners.size() == 0)
			{
				TiBaseActivity.registerOrientationListener (new TiBaseActivity.OrientationChangedListener()
				{
					@Override
					public void onOrientationChanged (int configOrientationMode)
					{
						KrollDict data = new KrollDict();
						data.put("orientation", TiOrientationHelper.convertConfigToTiOrientationMode (configOrientationMode));
						fireEvent(EVENT_ORIENTATION_CHANGE, data);
					}
				});
			}

			orientationConfigListeners.add (proxy);
		}
		else if (EVENT_SHAKE.equals(event))
		{
			if (!shakeRegistered) {
				TiSensorHelper.registerListener(Sensor.TYPE_ACCELEROMETER, this, SensorManager.SENSOR_DELAY_UI);
				shakeRegistered = true;
			}
		}

		super.eventListenerAdded(event, count, proxy);
	}

	protected void eventListenerRemoved(String event, int count, KrollProxy proxy)
	{
		if (EVENT_ORIENTATION_CHANGE.equals (event))
		{
			if (orientationConfigListeners.contains (proxy))
			{
				orientationConfigListeners.remove (proxy);
				if (orientationConfigListeners.size() == 0)
				{
					TiBaseActivity.deregisterOrientationListener();
				}
			}
			else
			{
				Log.e (TAG, "Unable to remove orientation config listener, does not exist");
			}
		}
		else if (EVENT_SHAKE.equals(event))
		{
			if (shakeRegistered) {
				TiSensorHelper.unregisterListener(Sensor.TYPE_ACCELEROMETER, this);
				shakeRegistered = false;
			}
		}

		super.eventListenerRemoved(event, count, proxy);
	}


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
		if (threshold < force)
		{
			if (! inShake) {
				firstEventInShake = currentEventInShake;
				inShake = true;
			}
			lastEventInShake = currentEventInShake;

			Log.d(TAG, "ACC-Shake : threshold: " + threshold + " force: " + force + " delta : " + force + " x: " + x
				+ " y: " + y + " z: " + z, Log.DEBUG_MODE);
		} else {
			if (shakeInitialized && inShake) {
				if (difftime > postShakePeriod) {
					inShake = false;
					if (lastEventInShake - firstEventInShake > inShakePeriod) {
						KrollDict data = new KrollDict();
						data.put("type", EVENT_SHAKE);
						data.put("timestamp", lastEventInShake);
						data.put("x", x);
						data.put("y", y);
						data.put("z", z);
						fireEvent(EVENT_SHAKE, data);
						
						Log.d(TAG, "Firing shake event (x:" + x + " y:" + y + " z:" + z + ")", Log.DEBUG_MODE);
					}
				}
			}
		}

		if (!shakeInitialized) {
			shakeInitialized = true;
		}
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean isPortrait()
	{
		return TiApplication.getInstance().getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT;
	}

	@Kroll.getProperty @Kroll.method
	public boolean isLandscape()
	{
		return TiApplication.getInstance().getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
	}

	@Kroll.getProperty @Kroll.method
	public int getOrientation()
	{
		return TiOrientationHelper.convertConfigToTiOrientationMode(TiApplication.getInstance().getResources().getConfiguration().orientation);
	}
}

