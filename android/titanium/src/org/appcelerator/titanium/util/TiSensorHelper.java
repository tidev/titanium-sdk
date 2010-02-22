/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.concurrent.atomic.AtomicInteger;

import android.app.Activity;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;

public class TiSensorHelper
{
	private static final String LCAT = "TiSensorHlpr";
	private static final boolean DBG = TiConfig.LOGD;

	private static boolean warningDisplayed = false;

	private SensorManager sensorManager;
	private AtomicInteger listenerCount;

	public TiSensorHelper()
	{
		listenerCount = new AtomicInteger();
	}

	public SensorManager getSensorManager() {
		return sensorManager;
	}

	public boolean isEmpty() {
		return listenerCount.get() == 0;
	}

	public boolean attach(Activity activity) {
		if (! Build.MODEL.equals("sdk"))
		{
			sensorManager = (SensorManager) activity.getSystemService(Context.SENSOR_SERVICE);
		} else {
			if (!TiSensorHelper.warningDisplayed) {
				Log.w(LCAT, "Sensors disabled on Emulator. Bug in 1.5 emulator hangs");
				TiSensorHelper.warningDisplayed = true;
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
	public void registerListener(int[] types, SensorEventListener listener, int rate)
	{
		for (int type : types) {
			registerListener(type, listener, rate);
		}
	}
	public void registerListener(int type, SensorEventListener listener, int rate) {
		if (sensorManager != null) {
			Sensor s  = sensorManager.getDefaultSensor(type);
			if (s != null) {
				if (DBG) {
					Log.d(LCAT, "Enabling Listener: " + s.getName());
				}
				sensorManager.registerListener(listener, s, rate);
				listenerCount.incrementAndGet();
			}
		}
	}

	public void unregisterListener(int[] types, SensorEventListener listener)
	{
		for (int type : types) {
			unregisterListener(type, listener);
		}
	}

	public void unregisterListener(int type, SensorEventListener listener) {
		if (sensorManager != null) {
			Sensor s = sensorManager.getDefaultSensor(type);
			if (s != null) {
				if (DBG) {
					Log.d(LCAT, "Disabling Listener: " + s.getName());
				}
				sensorManager.unregisterListener(listener, s);
				listenerCount.decrementAndGet();
			}
		}
	}
}
