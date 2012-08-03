/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.app.Activity;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

/**
 * Utility methods to register/unregister sensor listeners.
 */
public class TiSensorHelper
{
	private static final String TAG = "TiSensorHelper";

	private static SensorManager sensorManager;


	/**
	 * Registers a sensor listener with specified types and sensitivity.
	 * @param types sensor's types, refer to {@link android.hardware.Sensor} for the supported list.
	 * @param listener the sensor listener to be registered.
	 * @param rate the listener sensitivity measured in milliseconds.
	 */
	public static void registerListener(int[] types, SensorEventListener listener, int rate)
	{
		for (int type : types) {
			registerListener(type, listener, rate);
		}
	}

	public static void registerListener(int type, SensorEventListener listener, int rate)
	{
		SensorManager sensorManager = getSensorManager();
		if (sensorManager == null) {
			Log.w(TAG, "registerListener failed, no sensor manager found.", Log.DEBUG_MODE);
			return;
		}

		Sensor sensor  = sensorManager.getDefaultSensor(type);
		if (sensor != null) {
			Log.d(TAG, "Enabling Listener: " + sensor.getName(), Log.DEBUG_MODE);
			sensorManager.registerListener(listener, sensor, rate);
		} else {
			Log.e(TAG, "Unable to register, sensor is null");
		}
	}

	public static void unregisterListener(int[] types, SensorEventListener listener)
	{
		for (int type : types) {
			unregisterListener(type, listener);
		}
	}

	/**
	 * Attempts to unregister the listener. An error will be logged if unable to unregister.
	 * @param type the register's type, refer to {@link android.hardware.Sensor} for the supported list.
	 * @param listener the sensor listener.
	 */
	public static void unregisterListener(int type, SensorEventListener listener)
	{
		SensorManager sensorManager = getSensorManager();
		if (sensorManager == null) {
			Log.w(TAG, "UnregisterListener failed, no sensor manager found.", Log.DEBUG_MODE);
		}

		Sensor sensor = sensorManager.getDefaultSensor(type);
		if (sensor != null) {
			Log.d(TAG, "Disabling Listener: " + sensor.getName(), Log.DEBUG_MODE);
			sensorManager.unregisterListener(listener, sensor);
		} else {
			Log.e(TAG, "Unable to unregister, sensor is null");
		}
	}

	/**
	 * @param activity the referenced activity.
	 * @param type the sensor's type, refer to {@link android.hardware.Sensor} for the supported list.
	 * @return true if activity has a default sensor of the given type, false otherwise.
	 */
	public static boolean hasDefaultSensor(Activity activity, int type)
	{
		SensorManager sensorManager = getSensorManager();
		if (sensorManager == null) {
			return false;
		}

		return sensorManager.getDefaultSensor(type) != null;
	}

	public static synchronized SensorManager getSensorManager() {
		if (sensorManager == null) {
			sensorManager = (SensorManager) TiApplication.getInstance().getSystemService(Context.SENSOR_SERVICE);
		}
		return sensorManager;
	}
}

