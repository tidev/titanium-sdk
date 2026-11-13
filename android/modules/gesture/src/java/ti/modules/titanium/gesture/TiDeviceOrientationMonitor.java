/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
import android.hardware.display.DisplayManager;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Display;
import android.view.OrientationEventListener;
import android.view.Surface;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiDeviceOrientation;
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
	public interface OrientationChangedListener {
		/**
		 * Called when the device orientation has changed.
		 * You can access the new orientation via the monitor's getLastReadOrientation() method.
		 */
		void onDeviceOrientationChanged();
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
	private boolean isSystemRotationLockEnabled;
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
			this.sensorManager = (SensorManager) value;
		} else {
			Log.w(TAG, "Unable to acquire SensorManager.");
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

	public void setOrientationChangedListener(TiDeviceOrientationMonitor.OrientationChangedListener listener)
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

		// Read the system's current rotation lock setting.
		// Note: The screen event handler will keep this up to date while running.
		readSystemRotationLockSetting();

		// First, attempt to use the accelerometer and gyroscope sensors.
		this.isUsingSensorManager = startSensor(Sensor.TYPE_ROTATION_VECTOR);

		// If above is not available, then attempt to use accelerometer and magnetic sensors.
		if (!this.isUsingSensorManager) {
			boolean wasAccelerationSensorStarted = startSensor(Sensor.TYPE_ACCELEROMETER);
			boolean wasMagneticSensorStarted = startSensor(Sensor.TYPE_MAGNETIC_FIELD);
			this.isUsingSensorManager = wasAccelerationSensorStarted && wasMagneticSensorStarted;
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
						this.sensorEventHandler, sensor, SensorManager.SENSOR_DELAY_NORMAL, this.handler);
				}
			}
		} catch (Exception ex) {
		}
		return wasSuccessful;
	}

	private boolean isRotationLockEnabled()
	{
		// Note: The rotation lock setting is cached so that sensor events and screen events
		//       use the same orientation source until the setting is observed to change.
		return (!this.isSystemRotationLockIgnored && this.isSystemRotationLockEnabled);
	}

	private void readSystemRotationLockSetting()
	{
		boolean isLockEnabled = false;
		try {
			ContentResolver contentResolver = this.context.getContentResolver();
			if (contentResolver != null) {
				int value = Settings.System.getInt(contentResolver, Settings.System.ACCELEROMETER_ROTATION, 1);
				isLockEnabled = (value == 0);
			}
		} catch (Exception ex) {
		}
		this.isSystemRotationLockEnabled = isLockEnabled;
	}

	private void updateToLastReadDeviceOrientation()
	{
		TiDeviceOrientation orientation = null;
		if (this.isUsingSensorManager && (this.sensorEventHandler != null)) {
			orientation = this.sensorEventHandler.getLastReadOrientation();
		} else if (this.isUsingOrientationEventListener && (this.orientationEventHandler != null)) {
			orientation = this.orientationEventHandler.getLastReadOrientation();
		}

		// Do not continue if the sensor has not provided an orientation yet.
		// Note: This happens after a stop()/start() until the first sensor event is received.
		//       Keep the last known orientation instead of reporting an unknown one.
		if ((orientation == null) || (orientation == TiDeviceOrientation.UNKNOWN)) {
			return;
		}
		updateTo(orientation);
	}

	private void updateToLastReadScreenOrientation()
	{
		TiDeviceOrientation orientation = this.screenEventHandler.getLastReadOrientation();
		if ((orientation == null) || (orientation == TiDeviceOrientation.UNKNOWN)) {
			return;
		}
		updateTo(orientation);
	}

	private void updateTo(TiDeviceOrientation orientation)
	{
		// Validate argument.
		if (orientation == null) {
			return;
		}

		// Do not continue if this monitor has not been started or has been stopped.
		if (!isRunning()) {
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
		/** Cosine of the max tilt from flat (20 degrees) at which the device is considered face-up/down. */
		private static final float FLAT_THRESHOLD = (float) Math.cos(Math.toRadians(20.0));

		private TiDeviceOrientationMonitor monitor;
		private float[] rotationMatrixArray;
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
						System.arraycopy(event.values, 0, this.accelerationVectorArray, 0,
										 this.accelerationVectorArray.length);
						this.hasAccelerationData = true;

						// Update rotation matrix using previous received magnetic data.
						if (this.hasMagneticData) {
							wasRotationMatrixUpdated = this.monitor.sensorManager.getRotationMatrix(
								this.rotationMatrixArray, null, this.accelerationVectorArray, this.magneticVectorArray);
						}
					}
					break;
				case Sensor.TYPE_MAGNETIC_FIELD:
					if (event.values.length >= this.magneticVectorArray.length) {
						// Store the received magnetic data.
						System.arraycopy(event.values, 0, this.magneticVectorArray, 0, this.magneticVectorArray.length);
						this.hasMagneticData = true;

						// Update rotation matrix using previous received acceleration data.
						if (this.hasAccelerationData) {
							wasRotationMatrixUpdated = this.monitor.sensorManager.getRotationMatrix(
								this.rotationMatrixArray, null, this.accelerationVectorArray, this.magneticVectorArray);
						}
					}
					break;
				case Sensor.TYPE_ROTATION_VECTOR:
					// Store the received rotation matrix data.
					this.monitor.sensorManager.getRotationMatrixFromVector(this.rotationMatrixArray, event.values);
					wasRotationMatrixUpdated = true;
					break;
			}

			// Do not continue if the device rotation matrix has not been updated above.
			if (!wasRotationMatrixUpdated) {
				return;
			}

			// Fetch the direction of "up" (opposite of gravity) in device coordinates.
			// This is the 3rd row of the rotation matrix. Positive Y means the device is upright.
			// Note: Do not use SensorManager.getOrientation() pitch/roll angles here. They are undefined
			//       (gimbal lock) when the device is held exactly upright. Float rounding then flips the
			//       pitch between -90 and NaN, which made the orientation flap randomly on emulators.
			float upX = this.rotationMatrixArray[6];
			float upY = this.rotationMatrixArray[7];
			float upZ = this.rotationMatrixArray[8];
			if (Float.isNaN(upX) || Float.isNaN(upY) || Float.isNaN(upZ)) {
				return;
			}

			// Determine the device's orientation from the "up" direction.
			// Note: For face-up/down, Android typically expects a near flat orientation of +/-20 degrees.
			TiDeviceOrientation orientation;
			if (Math.abs(upZ) >= FLAT_THRESHOLD) {
				orientation = (upZ > 0) ? TiDeviceOrientation.FACE_UP : TiDeviceOrientation.FACE_DOWN;
			} else {
				// Angle of "up" around the device's Z axis. Zero is upright. Positive is counter-clockwise.
				double degrees = Math.toDegrees(Math.atan2(upX, upY));
				int rotationId;
				if ((degrees >= -45.0) && (degrees <= 45.0)) {
					rotationId = Surface.ROTATION_0;
				} else if ((degrees > 45.0) && (degrees < 135.0)) {
					rotationId = Surface.ROTATION_90;
				} else if ((degrees > -135.0) && (degrees < -45.0)) {
					rotationId = Surface.ROTATION_270;
				} else {
					rotationId = Surface.ROTATION_180;
				}
				orientation = TiDeviceOrientation.fromAndroidSurfaceRotationId(rotationId);
			}

			// Store the orientation value.
			this.lastReadOrientation = orientation;

			// Update the device monitor's orientation, but only if rotation lock is disabled.
			if (!this.monitor.isRotationLockEnabled()) {
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
			Runnable runnable = new Runnable() {
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
		private DisplayManager displayManager;
		private DisplayManager.DisplayListener displayListener;

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
			this.displayManager = (DisplayManager) this.monitor.context.getSystemService(Context.DISPLAY_SERVICE);
			this.contentObserver = new ContentObserver(this.monitor.handler) {
				@Override
				public boolean deliverSelfNotifications()
				{
					return true;
				}

				@Override
				public void onChange(boolean wasSelfChanged)
				{
					// Update the cached rotation lock setting and then switch to the matching orientation source.
					ScreenEventHandler.this.monitor.readSystemRotationLockSetting();
					updateLastReadOrientation();
				}
			};
			// Use DisplayManager.DisplayListener (API 17+) for efficient orientation detection
			this.displayListener = new DisplayManager.DisplayListener() {
				@Override
				public void onDisplayAdded(int displayId)
				{
				}

				@Override
				public void onDisplayRemoved(int displayId)
				{
				}

				@Override
				public void onDisplayChanged(int displayId)
				{
					if (displayId == Display.DEFAULT_DISPLAY) {
						updateLastReadOrientation();
					}
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
						Settings.System.getUriFor(Settings.System.ACCELEROMETER_ROTATION), true, this.contentObserver);
				}
			} catch (Exception ex) {
			}

			// Use DisplayManager.DisplayListener (API 17+) for efficient event-based orientation detection.
			try {
				this.displayManager.registerDisplayListener(this.displayListener, this.monitor.handler);
			} catch (Exception ex) {
				Log.w(TAG, "Failed to register DisplayManager listener: " + ex.getMessage());
			}
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

			// Stop listening for display orientation changes via DisplayManager.
			if (this.displayManager != null) {
				try {
					this.displayManager.unregisterDisplayListener(this.displayListener);
				} catch (Exception ex) {
					Log.w(TAG, "Failed to unregister DisplayManager listener: " + ex.getMessage());
				}
			}

			// Flag this handler as disabled.
			this.isEnabled = false;
		}

		private void updateLastReadOrientation()
		{
			// Do not continue if the screen handler has been disabled.
			if (!this.isEnabled) {
				return;
			}

			// Fetch and store the current screen orientation.
			this.lastReadOrientation = TiDeviceOrientation.fromDefaultDisplay();

			// Update device monitor's orientation.
			// Use screen orientation if rotation lock is enabled. Otherwise use device orientation.
			if (this.monitor.isRotationLockEnabled()) {
				this.monitor.updateToLastReadScreenOrientation();
			} else {
				this.monitor.updateToLastReadDeviceOrientation();
			}
		}
	}
}
