/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.config.TitaniumConfig;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;

public class TitaniumSensorHelper
{
	private static final String LCAT = "TiSensorHlpr";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static boolean warningDisplayed = false;

	private SensorManager sensorManager;
	private AtomicInteger listenerCount;

	public TitaniumSensorHelper()
	{
		listenerCount = new AtomicInteger();
	}

	public boolean attach(TitaniumActivity activity) {
		if (! Build.MODEL.equals("sdk"))
		{
			sensorManager = (SensorManager) activity.getSystemService(Context.SENSOR_SERVICE);
		} else {
			if (!TitaniumSensorHelper.warningDisplayed) {
				Log.w(LCAT, "Sensors disabled on Emulator. Bug in 1.5 emulator hangs");
				TitaniumSensorHelper.warningDisplayed = true;
			}
		}

		return sensorManager != null;
	}

	public void detach()
	{
		if (sensorManager != null) {
			if (listenerCount.get() == 0) {
				sensorManager = null;
			} else {
				throw new IllegalStateException("Detaching not allowed with registered listeners.");
			}
		}
	}
	public void registerListener(int type, SensorEventListener listener, int rate) {
		if (sensorManager != null) {
			Sensor s  = sensorManager.getDefaultSensor(type);
			if (s != null) {
				if (DBG) {
					Log.d(LCAT, "Enabling Accelerometer Listener");
				}
				sensorManager.registerListener(listener, s, rate);
				listenerCount.incrementAndGet();
			}
		}
	}

	public void unregisterListener(int type, SensorEventListener listener) {
		if (sensorManager != null) {
			Sensor s = sensorManager.getDefaultSensor(type);
			if (s != null) {
				if (DBG) {
					Log.d(LCAT, "Disabling Accelerometer Listener");
				}
				sensorManager.unregisterListener(listener, s);
				listenerCount.decrementAndGet();
			}
		}
	}
}
