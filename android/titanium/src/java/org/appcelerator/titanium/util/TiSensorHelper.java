/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;

import android.app.Activity;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

public class TiSensorHelper
{
	private static final String LCAT = "TiSensorHelper";
	private static final boolean DBG = TiConfig.LOGD;

	private static AtomicInteger listenerCount = new AtomicInteger();
	private static SensorManager sensorManager;


	public static void registerListener(int[] types, SensorEventListener listener, int rate)
	{
		for (int type : types) {
			registerListener(type, listener, rate);
		}
	}

	public static void registerListener(int type, SensorEventListener listener, int rate)
	{
		if (sensorManager == null) {
			sensorManager = (SensorManager) TiApplication.getInstance().getSystemService(Context.SENSOR_SERVICE);
		}

		Sensor sensor  = sensorManager.getDefaultSensor(type);
		if (sensor != null) {
			if (DBG) {
				Log.d(LCAT, "Enabling Listener: " + sensor.getName());
			}
			sensorManager.registerListener(listener, sensor, rate);
			listenerCount.incrementAndGet();
		} else {
			Log.e(LCAT, "unable to register, sensor is null");
		}
	}

	public static void unregisterListener(int[] types, SensorEventListener listener)
	{
		for (int type : types) {
			unregisterListener(type, listener);
		}
	}

	public static void unregisterListener(int type, SensorEventListener listener)
	{
		if (sensorManager != null) {
			Sensor sensor = sensorManager.getDefaultSensor(type);
			if (sensor != null) {
				if (DBG) {
					Log.d(LCAT, "Disabling Listener: " + sensor.getName());
				}
				sensorManager.unregisterListener(listener, sensor);

				if (listenerCount.decrementAndGet() == 0) {
					sensorManager = null;
				}
			} else {
				Log.e(LCAT, "unable to unregister, sensor is null");
			}
		} else {
			Log.e(LCAT, "unable to unregister, sensorManager is null");
		}
	}

	public static boolean hasDefaultSensor(Activity activity, int type)
	{
		boolean oneShot = false;
		boolean result = false;

		if (sensorManager == null)
		{
			oneShot = true;
			sensorManager = (SensorManager) activity.getSystemService(Context.SENSOR_SERVICE);
		}
		if (sensorManager != null)
		{
			result = (sensorManager.getDefaultSensor(type) != null);
			if (oneShot) {
				sensorManager = null;
			}
		}

		return result;
	}

	public static SensorManager getSensorManager() {
		return sensorManager;
	}
}

