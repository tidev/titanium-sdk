/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.gesture;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
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
	private static final String LCAT = "GestureModule";
	private static final boolean DBG = TiConfig.LOGD;
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


	public GestureModule(TiContext tiContext)
	{
		super(tiContext);

		TiProperties props = TiApplication.getInstance().getAppProperties();
		shakeFactor = props.getDouble("ti.android.shake.factor", 1.3d);
		postShakePeriod = props.getInt("ti.android.shake.quiet.milliseconds", 500);
		inShakePeriod = props.getInt("ti.android.shake.active.milliseconds", 1000);
		threshold = shakeFactor * shakeFactor * SensorManager.GRAVITY_EARTH * SensorManager.GRAVITY_EARTH;
		if (DBG) {
			Log.i(LCAT, "Shake Factor: " + shakeFactor);
			Log.i(LCAT, "Post Shake Period (ms): " + postShakePeriod);
			Log.i(LCAT, "In Shake Period(ms): " + inShakePeriod);
			Log.i(LCAT, "Threshold: " + threshold);
		}
	}

	@Override
	public int addEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		if (EVENT_ORIENTATION_CHANGE.equals (eventName))
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

			orientationConfigListeners.add (listener);
		}
		else if (EVENT_SHAKE.equals(eventName))
		{
			if (!shakeRegistered) {
				TiSensorHelper.registerListener(Sensor.TYPE_ACCELEROMETER, this, SensorManager.SENSOR_DELAY_UI);
				shakeRegistered = true;
			}
		}

		return super.addEventListener(invocation, eventName, listener);
	}

	@Override
	public void removeEventListener(KrollInvocation invocation, String eventName, Object listener)
	{
		if (EVENT_ORIENTATION_CHANGE.equals (eventName))
		{
			if (orientationConfigListeners.contains (listener))
			{
				orientationConfigListeners.remove (listener);
				if (orientationConfigListeners.size() == 0)
				{
					TiBaseActivity.deregisterOrientationListener();
				}
			}
			else
			{
				Log.e (LCAT, "unable to remove orientation config listener, does not exist");
			}
		}
		else if (EVENT_SHAKE.equals(eventName))
		{
			if (shakeRegistered) {
				TiSensorHelper.unregisterListener(Sensor.TYPE_ACCELEROMETER, this);
				shakeRegistered = false;
			}
		}

		super.removeEventListener(invocation, eventName, listener);
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

			Log.d(LCAT, "ACC-Shake : threshold: " + threshold + " force: " + force + " delta : " + force + " x: " + x + " y: " + y + " z: " + z);
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
						
						Log.d(LCAT, "Firing shake event (x:" + x + " y:" + y + " z:" + z + ")");
					}
				}
			}
		}

		if (!shakeInitialized) {
			shakeInitialized = true;
		}
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean isPortrait(KrollInvocation invocation)
	{
		return invocation.getActivity().getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT;
	}

	@Kroll.getProperty @Kroll.method
	public boolean isLandscape(KrollInvocation invocation)
	{
		return invocation.getActivity().getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
	}

	@Kroll.getProperty @Kroll.method
	public int getOrientation(KrollInvocation invocation)
	{
		return TiOrientationHelper.convertConfigToTiOrientationMode(invocation.getActivity().getResources().getConfiguration().orientation);
	}
}

