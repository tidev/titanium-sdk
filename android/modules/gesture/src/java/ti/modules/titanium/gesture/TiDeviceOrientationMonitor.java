/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.gesture;

import android.content.ContentResolver;
import android.content.Context;
import android.database.ContentObserver;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.OrientationEventListener;
import android.view.Surface;
import java.util.List;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiOrientationHelper;
import org.appcelerator.titanium.TiApplication;


/**
 * Monitors the current orientation of the device via its sensors (accelerometer, gyroscope, etc.).
 */
public final class TiDeviceOrientationMonitor
{
	/**
	 * Listener used to detect orientation changes. Intended to be passed to
	 * a "TiDeviceOrientationMonitor" object's setOrientationChangedListener() method.
	 */
	public interface OrientationChangedListener
	{
		/**
		 * Called when the device orientation has changed.
		 * You can access the new orientation via the monitor's getLastReadOrientation() method.
		 */
		public void onDeviceOrientationChanged();
	}

	/** The default Android log tag name to be used by this class. */
	private static final String TAG = "TiDeviceOrientationMonitor";

	private Context context;
	private Handler handler;
	private TiDeviceOrientationMonitor.OrientationChangedListener orientationChangedListener;
	private TiDeviceOrientationMonitor.SensorEventHandler sensorEventHandler;
	private TiDeviceOrientationMonitor.OrientationEventHandler orientationEventHandler;
	private TiDeviceOrientationMonitor.ScreenEventHandler screenEventHandler;
	private SensorManager sensorManager;
	private boolean isUsingSensorManager;
	private boolean isUsingOrientationEventListener;
	private boolean isSystemRotationLockIgnored;
	private TiDeviceOrientation lastReadOrientation = TiDeviceOrientation.UNKNOWN;


	public TiDeviceOrientationMonitor()
	{
		this(null);
	}

	public TiDeviceOrientationMonitor(Handler handler)
	{
		// Fetch the application context.
		this.context = TiApplication.getInstance();
		if (this.context == null) {
			throw new IllegalStateException();
		}

		// Store the handler used to synchronize orientation/sensor events with.
		// If not given a handler, then set up a handler to be ran on the current thread.
		if (handler == null) {
			handler = new Handler();
		}
		this.handler = handler;

		// Create this object's sensor event handler.
		this.sensorEventHandler = new TiDeviceOrientationMonitor.SensorEventHandler(this);

		// Fetch the system's sensor manager.
		Object value = this.context.getSystemService(Context.SENSOR_SERVICE);
		if (value instanceof SensorManager) {
			this.sensorManager = (SensorManager)value;
		} else {
			Log.i(TAG, "Unable to aquire SensorManager.");
		}

		// Create an event handler for the Android "OrientationEventListener".
		// This can only detect device rotation. It cannot detect face-up or face-down.
		// Note: We use this as a fallback when the device does not have a gyroscope.
		this.orientationEventHandler = new TiDeviceOrientationMonitor.OrientationEventHandler(this);

		// Create an event handler for detecting "screen rotation" and "rotation lock" changes.
		this.screenEventHandler = new TiDeviceOrientationMonitor.ScreenEventHandler(this);
	}

	public boolean isSystemRotationLockIgnored()
	{
		return this.isSystemRotationLockIgnored;
	}

	public void setIsSystemRotationLockIgnored(boolean value)
	{
		// Do not continue if the value isn't changing.
		if (value == this.isSystemRotationLockIgnored) {
			return;
		}

		// Update the flag.
		this.isSystemRotationLockIgnored = value;

		// Update this monitor with the last read device/screen orientation.
		// Note: The orientation will only change if the system rotation lock is currently enabled.
		if (isRunning()) {
			if (isRotationLockEnabled()) {
				updateToLastReadScreenOrientation();
			} else {
				updateToLastReadDeviceOrientation();
			}
		}
	}

	public void setOrientationChangedListener(
		TiDeviceOrientationMonitor.OrientationChangedListener listener)
	{
		this.orientationChangedListener = listener;
	}

	public TiDeviceOrientationMonitor.OrientationChangedListener getOrientationChangedListener()
	{
		return this.orientationChangedListener;
	}

	public TiDeviceOrientation getLastReadOrientation()
	{
		return this.lastReadOrientation;
	}

	public boolean isRunning()
	{
		return (this.isUsingSensorManager || this.isUsingOrientationEventListener);
	}

	public boolean start()
	{
		// Do not continue if already running.
		if (isRunning()) {
			return true;
		}

		// First, attempt to use the accelerometer and gyroscope sensors.
		this.isUsingSensorManager = startSensor(Sensor.TYPE_ROTATION_VECTOR);

		// If above is not available, then attempt to use accelerometer and magnetic sensors.
		if (!this.isUsingSensorManager) {
			boolean wasSensor1Started = startSensor(Sensor.TYPE_ACCELEROMETER);
			boolean wasSensor2Started = startSensor(Sensor.TYPE_MAGNETIC_FIELD);
			this.isUsingSensorManager = wasSensor1Started && wasSensor2Started;
			if (!this.isUsingSensorManager) {
				if (this.sensorManager != null) {
					this.sensorManager.unregisterListener(this.sensorEventHandler);
				}
			}
		}

		// If above sensors are not available, then fallback to using Android's OrientationEventListener.
		// This can only detect device rotation. Does not support face-up or face-down.
		if (!this.isUsingSensorManager && this.orientationEventHandler.canDetectOrientation()) {
			this.orientationEventHandler.enable();
			this.isUsingOrientationEventListener = true;
		}

		// Enable the screen rotation lock handler.
		this.screenEventHandler.enable();

		// Return true if we've successfully started an orientation related sensor.
		return isRunning();
	}

	public void stop()
	{
		// Do not continue if already stopped.
		if (!isRunning()) {
			return;
		}

		// Unregister our "SensorManager" handler if registered.
		if (this.isUsingSensorManager) {
			if (this.sensorManager != null) {
				this.sensorManager.unregisterListener(this.sensorEventHandler);
			}
			this.sensorEventHandler.reset();
			this.isUsingSensorManager = false;
		}

		// Disable the Android "OrientationEventListener" if running.
		if (this.isUsingOrientationEventListener) {
			this.orientationEventHandler.disable();
			this.isUsingOrientationEventListener = false;
		}

		// Disable the screen rotation lock handler.
		this.screenEventHandler.disable();
	}

	private boolean startSensor(int typeId)
	{
		boolean wasSuccessful = false;
		try {
			if (this.sensorManager != null) {
				Sensor sensor = this.sensorManager.getDefaultSensor(typeId);
				if (sensor != null) {
					wasSuccessful = this.sensorManager.registerListener(
							this.sensorEventHandler, sensor,
							SensorManager.SENSOR_DELAY_NORMAL, this.handler);
				}
			}
		} catch (Exception ex) {
		}
		return wasSuccessful;
	}

	private boolean isRotationLockEnabled()
	{
		boolean isLockEnabled = false;
		if (this.isSystemRotationLockIgnored == false) {
			try {
				ContentResolver contentResolver = this.context.getContentResolver();
				if (contentResolver != null) {
					int value = Settings.System.getInt(
							contentResolver, Settings.System.ACCELEROMETER_ROTATION, 1);
					isLockEnabled = (value == 0);
				}
			} catch (Exception ex) {
			}
		}
		return isLockEnabled;
	}

	private void updateToLastReadDeviceOrientation()
	{
		if (this.isUsingSensorManager && (this.sensorEventHandler != null)) {
			updateTo(this.sensorEventHandler.getLastReadOrientation());
		} else if (this.isUsingOrientationEventListener && (this.orientationEventHandler != null)) {
			updateTo(this.orientationEventHandler.getLastReadOrientation());
		}
	}

	private void updateToLastReadScreenOrientation()
	{
		updateTo(this.screenEventHandler.getLastReadOrientation());
	}

	private void updateTo(TiDeviceOrientation orientation)
	{
		// Validate argument.
		if (orientation == null) {
			return;
		}

		// Do not continue if this monitor has not been started or has been stopped.
		if (isRunning() == false) {
			return;
		}

		// Do not continue if orientation hasn't changed.
		if (this.lastReadOrientation == orientation) {
			return;
		}

		// Store the given orientation.
		this.lastReadOrientation = orientation;

		// Notify the owner that the orientation has changed.
		if (this.orientationChangedListener != null) {
			this.orientationChangedListener.onDeviceOrientationChanged();
		}
	}


	/**
	 * Detects orientation changes via the Android "SensorManager".
	 * This is the most accurate and preferred method of doing this.
	 */
	private static class SensorEventHandler implements SensorEventListener
	{
		private TiDeviceOrientationMonitor monitor;
		private float[] rotationMatrixArray;
		private float[] orientationArray;
		private float[] accelerationVectorArray;
		private float[] magneticVectorArray;
		private boolean hasAccelerationData;
		private boolean hasMagneticData;
		private TiDeviceOrientation lastReadOrientation;


		public SensorEventHandler(TiDeviceOrientationMonitor monitor)
		{
			// Validate argument.
			if (monitor == null) {
				throw new IllegalArgumentException();
			}

			// Initialize member variables.
			this.monitor = monitor;
			this.rotationMatrixArray = new float[9];
			this.orientationArray = new float[3];
			this.accelerationVectorArray = new float[3];
			this.magneticVectorArray = new float[3];
			this.lastReadOrientation = TiDeviceOrientation.UNKNOWN;
		}

		public TiDeviceOrientation getLastReadOrientation()
		{
			return this.lastReadOrientation;
		}

		public void reset()
		{
			this.hasAccelerationData = false;
			this.hasMagneticData = false;
			this.lastReadOrientation = TiDeviceOrientation.UNKNOWN;
		}

		@Override
		public void onAccuracyChanged(Sensor sensor, int accuracy)
		{
		}

		@Override
		public void onSensorChanged(SensorEvent event)
		{
			// Validate.
			if ((event == null) || (event.sensor == null) || (event.values == null)) {
				return;
			}
			if (this.monitor.sensorManager == null) {
				return;
			}

			// Handle the received sensor data.
			boolean wasRotationMatrixUpdated = false;
			switch (event.sensor.getType()) {
				case Sensor.TYPE_ACCELEROMETER:
					if (event.values.length >= this.accelerationVectorArray.length) {
						// Store the received acceleration data.
						System.arraycopy(
								event.values, 0,
								this.accelerationVectorArray, 0,
								this.accelerationVectorArray.length);
						this.hasAccelerationData = true;

						// Update rotation matrix using previous received magnetic data.
						if (this.hasMagneticData) {
							wasRotationMatrixUpdated = this.monitor.sensorManager.getRotationMatrix(
									this.rotationMatrixArray, null,
									this.accelerationVectorArray,
									this.magneticVectorArray);
						}
					}
					break;
				case Sensor.TYPE_MAGNETIC_FIELD:
					if (event.values.length >= this.magneticVectorArray.length) {
						// Store the received magnetic data.
						System.arraycopy(
								event.values, 0,
								this.magneticVectorArray, 0,
								this.magneticVectorArray.length);
						this.hasMagneticData = true;

						// Update rotation matrix using previous received acceleration data.
						if (this.hasAccelerationData) {
							wasRotationMatrixUpdated = this.monitor.sensorManager.getRotationMatrix(
									this.rotationMatrixArray, null,
									this.accelerationVectorArray,
									this.magneticVectorArray);
						}
					}
					break;
				case Sensor.TYPE_ROTATION_VECTOR:
					// Store the received rotation matrix data.
					this.monitor.sensorManager.getRotationMatrixFromVector(
							this.rotationMatrixArray, event.values);
					wasRotationMatrixUpdated = true;
					break;
			}

			// Do not continue if the device rotation matrix has not been udpated above.
			if (wasRotationMatrixUpdated == false) {
				return;
			}

			// Calculate the device's orientation/attitude in degrees.
			this.monitor.sensorManager.getOrientation(this.rotationMatrixArray, this.orientationArray);
			double pitch = Math.toDegrees((double)this.orientationArray[1]);    // -90 to 90
			double roll = Math.toDegrees((double)this.orientationArray[2]);     // -180 to 180

			// Determine the device's orientation from pitch and roll.
			// Note: For face-up, Android typically expects a near flat orientation of +/-20 degrees.
			TiDeviceOrientation orientation;
			if (pitch <= -45.0) {
				orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_0);
			} else if (pitch >= 45.0) {
				orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_180);
			} else if ((roll > -135.0) && (roll < -45.0)) {
				orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_90);
			} else if ((roll > 45.0) && (roll < 135.0)) {
				orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_270);
			} else if ((roll >= -45.0) && (roll <= 45.0)) {
				if (pitch <= -20.0) {
					orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_0);
				} else if (pitch >= 20.0) {
					orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_180);
				} else if (roll <= -20.0) {
					orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_90);
				} else if (roll >= 20.0) {
					orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(Surface.ROTATION_270);
				} else {
					orientation = TiDeviceOrientation.FACE_UP;
				}
			} else {
				orientation = TiDeviceOrientation.FACE_DOWN;
			}

			// Store the orientation value.
			this.lastReadOrientation = orientation;

			// Update the device monitor's orientation, but only if rotation lock is disabled.
			if (this.monitor.isRotationLockEnabled() == false) {
				this.monitor.updateTo(orientation);
			}
		}
	}

	/**
	 * Detects orientation changes via the Android "OrientationEventLister".
	 * This is a fall-back mechanism and does not support FACE_UP or FACE_DOWN detection.
	 */
	private static class OrientationEventHandler extends OrientationEventListener
	{
		private TiDeviceOrientationMonitor monitor;
		private TiDeviceOrientation lastReadOrientation;


		public OrientationEventHandler(TiDeviceOrientationMonitor monitor)
		{
			super(monitor.context, SensorManager.SENSOR_DELAY_NORMAL);
			this.monitor = monitor;
			this.lastReadOrientation = TiDeviceOrientation.UNKNOWN;
		}

		public TiDeviceOrientation getLastReadOrientation()
		{
			return this.lastReadOrientation;
		}

		@Override
		public void onOrientationChanged(int rotationInDegrees)
		{
			// Determine the device orientation based on the given rotation angle from the sensor.
			final TiDeviceOrientation orientation;
			if (rotationInDegrees == OrientationEventListener.ORIENTATION_UNKNOWN) {
				orientation = TiDeviceOrientation.UNKNOWN;
			} else {
				orientation = TiDeviceOrientation.fromUprightRotationDegreesClockwise(rotationInDegrees);
			}
			this.lastReadOrientation = orientation;

			// Do not continue if the system rotation lock is enabled.
			if (this.monitor.isRotationLockEnabled()) {
				return;
			}

			// Update the device monitor with the new orientation on the handler's thread.
			Runnable runnable = new Runnable()
			{
				@Override
				public void run()
				{
					monitor.updateTo(orientation);
				}
			};
			Looper looper = this.monitor.handler.getLooper();
			if ((looper != null) && (looper.getThread().getId() == Thread.currentThread().getId())) {
				runnable.run();
			} else {
				this.monitor.handler.post(runnable);
			}
		}
	}

	/**
	 * Detects system rotation lock and display orientation changes.
	 * <p>
	 * When the rotation lock has been enabled, this handler will dispatch screen/display
	 * orientation changes to the orientation monitor to match iOS' behavior.
	 */
	private static class ScreenEventHandler
	{
		private TiDeviceOrientationMonitor monitor;
		private boolean isEnabled;
		private ContentObserver contentObserver;
		private TiDeviceOrientation lastReadOrientation;

		public ScreenEventHandler(TiDeviceOrientationMonitor monitor)
		{
			// Validate argument.
			if (monitor == null) {
				throw new IllegalArgumentException();
			}

			// Initialize member variables.
			this.monitor = monitor;
			this.isEnabled = false;
			this.lastReadOrientation = TiDeviceOrientation.UNKNOWN;
			this.contentObserver = new ContentObserver(this.monitor.handler)
			{
				@Override
				public boolean deliverSelfNotifications()
				{
					return true;
				}

				@Override
				public void onChange(boolean wasSelfChanged)
				{
					updateLastReadOrientation();
				}
			};
		}

		public TiDeviceOrientation getLastReadOrientation()
		{
			return this.lastReadOrientation;
		}

		public boolean isEnabled()
		{
			return this.isEnabled;
		}

		public void enable()
		{
			// Do not continue if already enabled.
			if (isEnabled()) {
				return;
			}

			// Flag this handler as enabled.
			this.isEnabled = true;

			// Start listening for system rotation lock setting changes.
			try {
				ContentResolver contentResolver = this.monitor.context.getContentResolver();
				if (contentResolver != null) {
					contentResolver.registerContentObserver(
							Settings.System.getUriFor(Settings.System.ACCELEROMETER_ROTATION),
							true, this.contentObserver);
				}
			} catch (Exception ex) {
			}

			// Set up a timer to poll for the current screen orientation.
			// Note: There is no reliable event-based way of doing this on Android 4.1 or older.
			//       For example, the Activity.onConfigurationChanged() method won't
			//       be called for 180 degree changes such as LandscapeRight<->LandscapeLeft.
			// TODO: In the future, use API Level 17 "DisplayManager.Listener" instead.
			final long TIMER_INTERVAL_IN_MILLISECONDS = 200;
			final Runnable runnable = new Runnable()
			{
				@Override
				public void run()
				{
					// Fetch the screen's current orientation.
					updateLastReadOrientation();

					// Schedule this timer's next elapse time if screen handler is still enabled.
					if (isEnabled()) {
						ScreenEventHandler.this.monitor.handler.postDelayed(
								this, TIMER_INTERVAL_IN_MILLISECONDS);
					}
				}
			};
			this.monitor.handler.postDelayed(runnable, TIMER_INTERVAL_IN_MILLISECONDS);
		}

		public void disable()
		{
			// Do not continue if already disabled.
			if (!isEnabled()) {
				return;
			}

			// Stop listening for system rotation lock setting changes.
			try {
				ContentResolver contentResolver = this.monitor.context.getContentResolver();
				if (contentResolver != null) {
					contentResolver.unregisterContentObserver(this.contentObserver);
				}
			} catch (Exception ex) {
			}

			// Flag this handler as disabled.
			this.isEnabled = false;
		}

		private void updateLastReadOrientation()
		{
			// Do not continue if the screen handler has been disabled.
			if (this.isEnabled == false) {
				return;
			}

			// Fetch and store the current screen orientation.
			this.lastReadOrientation = TiDeviceOrientation.fromTiIntegerId(
					TiOrientationHelper.getScreenTiOrientationMode());

			// Update device monitor's orientation.
			// Use screen orientation if rotation lock is enabled. Otherwise use device orientation.
			if (this.monitor.isRotationLockEnabled()) {
				this.monitor.updateTo(this.lastReadOrientation);
			} else {
				this.monitor.updateToLastReadDeviceOrientation();
			}
		}
	}
}
