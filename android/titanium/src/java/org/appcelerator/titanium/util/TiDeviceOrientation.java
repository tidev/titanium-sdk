/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TiApplication;

import android.content.Context;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;

/**
 * Enum type indicating if a device is portrait-upright, landscape-left, landscape-right, etc.
 * <p>
 * Provides methods to acquire its unique Titanium integer ID used in JavaScript
 * and to determine if the device is portrait or landscape.
 */
public enum TiDeviceOrientation {
	/** Indicates that the device orientation is unknown. */
	UNKNOWN(0),

	/** Indicates that the device is in portrait form and in the upright position. */
	PORTRAIT(1),

	/** Indicates that the device is in portrait form and upside-down. */
	UPSIDE_PORTRAIT(2),

	/** Indicates that the device is landscape where the bottom of the device is on the left side. */
	LANDSCAPE_LEFT(3),

	/** Indicates that the device is landscape where the bottom of the device is on the right side. */
	LANDSCAPE_RIGHT(4),

	/** Indicates that the device is laying down flat and is facing up towards the sky. */
	FACE_UP(5),

	/** Indicates that the device is laying down flat and is facing down towards the Earth. */
	FACE_DOWN(6);

	/** Titanium's unique integer ID used in JavaScript to identify the orientation position. */
	private final int tiIntId;

	/** JavaScript constant name defined by Titanium's UI module for this orientation position. */
	private final String tiConstantName;

	/**
	 * Creates a new device orientation type using the given data.
	 * @param tiIntId Unique ID used in JavaScript to identify the orientation position.
	 */
	private TiDeviceOrientation(int tiIntId)
	{
		this.tiIntId = tiIntId;
		this.tiConstantName = "Ti.UI." + this.name();
	}

	/**
	 * Determines if the device orientation is in portrait form.
	 * @return
	 * Returns true if orientation is PORTRAIT or UPSIDE_PORTRAIT.
	 * <p>
	 * Returns false for all other orientation types.
	 */
	public boolean isPortrait()
	{
		switch (this) {
			case PORTRAIT:
			case UPSIDE_PORTRAIT:
				return true;
		}
		return false;
	}

	/**
	 * Determines if the device orientation is in landscape form.
	 * @return
	 * Returns true if orientation is LANDSCAPE_LEFT or LANDSCAPE_RIGHT.
	 * <p>
	 * Returns false for all other orientation types.
	 */
	public boolean isLandscape()
	{
		switch (this) {
			case LANDSCAPE_LEFT:
			case LANDSCAPE_RIGHT:
				return true;
		}
		return false;
	}

	/**
	 * Gets the unique integer ID that Titanium uses to represent this device orientation
	 * in JavaScript such as Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, etc.
	 * @return Returns the device orientation's unique integer identifier.
	 */
	public int toTiIntId()
	{
		return this.tiIntId;
	}

	/**
	 * Gets the JavaScript constant name used by Titanium's UI module for this orientation.
	 * Intented to be used to by Titanium APIs to indicate which orientation constants are valid/invalid.
	 * @return Returns the device orientation's JavaScript constant name.
	 */
	public String toTiConstantName()
	{
		return this.tiConstantName;
	}

	/**
	 * Gets a human readable name identifying this orientation type.
	 * @return Returns the device orientation's name.
	 */
	@Override
	public String toString()
	{
		return this.tiConstantName;
	}

	/**
	 * Fetches a device orientation matching the given unique Titanium integer ID.
	 * <p>
	 * This ID matches the value returned by TiDeviceOrientation.toTiIntId().
	 * It also matches the orientation IDs Titanium uses in JavaScript such as
	 * Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, etc.
	 * @param value The unique integer ID of the orientation to search for.
	 * @return Returns a matching orientation object. Returns null if given an invalid ID.
	 */
	public static TiDeviceOrientation fromTiIntId(int value)
	{
		for (TiDeviceOrientation nextObject : TiDeviceOrientation.values()) {
			if ((nextObject != null) && (nextObject.tiIntId == value)) {
				return nextObject;
			}
		}
		return null;
	}

	/**
	 * Fetches a device orientation matching the given Android "Surface" class rotation constant
	 * such as Surface.ROTATION_0, Surface.ROTATION_90, Surface.ROTATION_180, or Surface.ROTATION_270.
	 * <p>
	 * This method will never return a FACE_UP or FACE_DOWN object since the given ID only
	 * specifies the rotation of the screen. It does not specify tilt.
	 * @param value A "Surface" class rotation constant.
	 * @return
	 * Returns a matching orientation object for the given rotation ID.
	 * <p>
	 * Returns UNKNOWN if given an unknown or invalid rotation ID.
	 */
	public static TiDeviceOrientation fromAndroidSurfaceRotationId(int value)
	{
		// Fetch the device's display info.
		DisplayInfo displayInfo = DisplayInfo.from(getDefaultDisplay());
		if (displayInfo == null) {
			return TiDeviceOrientation.UNKNOWN;
		}

		// Determine if the device's upright orientation is portrait or landscape.
		// Note: Large tablets typically have a landscape upright orientation.
		boolean isUprightOrientationPortrait = displayInfo.isUprightOrientationPortrait();

		// Configure display info object with given rotation and device's upright orientation.
		// Note: The below width/height doesn't need to match the device's actual dispaly size.
		//       They just need to indicate if the device is portrait/landscape for given rotation.
		switch (value) {
			case Surface.ROTATION_0:
			case Surface.ROTATION_180:
				displayInfo.setWidth(isUprightOrientationPortrait ? 320 : 480);
				displayInfo.setHeight(isUprightOrientationPortrait ? 480 : 320);
				break;
			case Surface.ROTATION_90:
			case Surface.ROTATION_270:
				displayInfo.setWidth(isUprightOrientationPortrait ? 480 : 320);
				displayInfo.setHeight(isUprightOrientationPortrait ? 320 : 480);
				break;
		}
		displayInfo.setRotationId(value);

		// Return a matching orientation for the given Android surface rotation ID.
		return displayInfo.toTiDeviceOrientation();
	}

	/**
	 * Fetches a device orientation matching the given rotation of the screen in degrees clockwise,
	 * where zero represents the upright orientation of the device.
	 * <p>
	 * Note that the upright orientation is typically portrait for phones and landscape for large tablets.
	 * <p>
	 * This method is intended to be called by an Android "OrientationEventListener" object
	 * whose onOrientationChanged() method provides the screen rotation in degrees clockwise.
	 * Although, this method does not handle the "OrientationEventListener.ORIENTATION_UNKNOWN" case
	 * and it's the caller's responsibility to handle it.
	 * <p>
	 * This method will never return a FACE_UP or FACE_DOWN object.
	 * @param value
	 * Screen rotation in degrees clockwise.
	 * Can be negative, in which case the rotation will be counter-clockwise.
	 * @return Returns a matching orientation object for the given degrees of rotation.
	 */
	public static TiDeviceOrientation fromUprightRotationDegreesClockwise(int value)
	{
		if (value == Integer.MIN_VALUE) {
			value %= 360;
		}
		return TiDeviceOrientation.fromUprightRotationDegreesCounterClockwise(-value);
	}

	/**
	 * Fetches a device orientation matching the given rotation of the screen in degrees
	 * counter-clockwise, where zero represents the upright orientation of the device.
	 * <p>
	 * Note that the upright orientation is typically portrait for phones and landscape for large tablets.
	 * <p>
	 * This method will never return a FACE_UP or FACE_DOWN object.
	 * @param value
	 * Screen rotation in degrees counter-clockwise.
	 * Can be negative, in which case the rotation will be clockwise.
	 * @return Returns a matching orientation object for the given degrees of rotation.
	 */
	public static TiDeviceOrientation fromUprightRotationDegreesCounterClockwise(int value)
	{
		// Determine if the given angle of rotation is clockwise or counter-clockwise.
		boolean isCounterClockwise = (value >= 0);

		// Convert the given rotation degrees to an Android surface rotation identifier.
		int surfaceRotationId;
		value %= 360;
		value = Math.abs(value);
		if (value <= 45) {
			surfaceRotationId = Surface.ROTATION_0;
		} else if (value < 135) {
			surfaceRotationId = Surface.ROTATION_90;
		} else if (value <= 225) {
			surfaceRotationId = Surface.ROTATION_180;
		} else if (value < 315) {
			surfaceRotationId = Surface.ROTATION_270;
		} else {
			surfaceRotationId = Surface.ROTATION_0;
		}

		// If the given rotation was clockwise, then flip the result determined above.
		if (!isCounterClockwise) {
			if (surfaceRotationId == Surface.ROTATION_90) {
				surfaceRotationId = Surface.ROTATION_270;
			} else if (surfaceRotationId == Surface.ROTATION_270) {
				surfaceRotationId = Surface.ROTATION_90;
			}
		}

		// Return a device orientation object matching the given rotation.
		return TiDeviceOrientation.fromAndroidSurfaceRotationId(surfaceRotationId);
	}

	/**
	 * Fetches the orientation the screen contents are being displayed from the display returned
	 * by Android's WindowManager.getDefaultDisplay() method.
	 * <p>
	 * This method will never return FACE_UP or FACE_DOWN orientations.
	 * @return
	 * Returns PORTRAIT, UPSIDE_PORTRAIT, LANDSCAPE_LEFT, or LANDSCAPE_RIGHT
	 * if the default display orientation was successfully acquired.
	 * <p>
	 * Returns UNKNOWN if failed to acquire the default display's orientation.
	 */
	public static TiDeviceOrientation fromDefaultDisplay()
	{
		return TiDeviceOrientation.from(getDefaultDisplay());
	}

	/**
	 * Fetches the orientation the screen contents are being displayed from the given display.
	 * <p>
	 * This method will never return FACE_UP or FACE_DOWN orientations.
	 * @return
	 * Returns PORTRAIT, UPSIDE_PORTRAIT, LANDSCAPE_LEFT, or LANDSCAPE_RIGHT
	 * if the display orientation was successfully acquired.
	 * <p>
	 * Returns UNKNOWN if given a null display reference.
	 */
	public static TiDeviceOrientation from(Display display)
	{
		DisplayInfo displayInfo = DisplayInfo.from(display);
		if (displayInfo == null) {
			return TiDeviceOrientation.UNKNOWN;
		}
		return displayInfo.toTiDeviceOrientation();
	}

	/**
	 * Determines the natural upright orientation of the device's default display.
	 * <p>
	 * Will typically be portrait for phones.
	 * Will typically be landscape for large tablets and TV devices.
	 * <p>
	 * This method will never return FACE_UP or FACE_DOWN orientations.
	 * @return
	 * Returns a portrait or landscape orientation if the display's upright orientation
	 * was successfully acquired.
	 * <p>
	 * Returns UNKNOWN if failed to aquire the default display's information.
	 */
	public static TiDeviceOrientation fromUprightPositionOfDefaultDisplay()
	{
		return TiDeviceOrientation.fromUprightPositionOf(getDefaultDisplay());
	}

	/**
	 * Determines the natural upright orientation for the given display.
	 * <p>
	 * Will typically be portrait for phones.
	 * Will typically be landscape for large tablets and TV devices.
	 * <p>
	 * This method will never return FACE_UP or FACE_DOWN orientations.
	 * @param display Reference to the display to query orientation info from.
	 * @return
	 * Returns a portrait or landscape orientation if the display's upright orientation
	 * was successfully acquired.
	 * <p>
	 * Returns UNKNOWN if given a null argument or failed to aquire display info.
	 */
	public static TiDeviceOrientation fromUprightPositionOf(Display display)
	{
		DisplayInfo displayInfo = DisplayInfo.from(display);
		if (displayInfo != null) {
			if (displayInfo.isUprightOrientationPortrait()) {
				return TiDeviceOrientation.PORTRAIT;
			} else if (displayInfo.isUprightOrientationLandscape()) {
				return TiDeviceOrientation.LANDSCAPE_RIGHT;
			}
		}
		return TiDeviceOrientation.UNKNOWN;
	}

	/**
	 * Fetches the default display currently being used by the application's window manager.
	 * @return Returns the default display. Returns null if failed to access the device's display.
	 */
	private static Display getDefaultDisplay()
	{
		TiApplication application = TiApplication.getInstance();
		if (application != null) {
			Object object = application.getSystemService(Context.WINDOW_SERVICE);
			if (object instanceof WindowManager) {
				WindowManager windowManager = (WindowManager) object;
				return windowManager.getDefaultDisplay();
			}
		}
		return null;
	}

	/**
	 * Private class used to fetch or store screen information and determine its upright orientation.
	 */
	private static class DisplayInfo
	{
		private int rotationId;
		private int width;
		private int height;

		public void setRotationId(int value)
		{
			this.rotationId = value;
		}

		public int getRotationId(int value)
		{
			return this.rotationId;
		}

		public void setWidth(int value)
		{
			this.width = Math.max(value, 0);
		}

		public int getWidth()
		{
			return this.width;
		}

		public void setHeight(int value)
		{
			this.height = Math.max(value, 0);
		}

		public int getHeight()
		{
			return this.height;
		}

		public boolean isUprightOrientationPortrait()
		{
			// Determine if the display size is portrait.
			// Note: A square display size is considred portrait. (The most commonly used orientation.)
			boolean result;
			switch (this.rotationId) {
				case Surface.ROTATION_0:
				case Surface.ROTATION_180:
					result = (this.width <= this.height);
					break;
				case Surface.ROTATION_90:
				case Surface.ROTATION_270:
					result = (this.width >= this.height);
					break;
				default:
					result = true;
					break;
			}
			return result;
		}

		public boolean isUprightOrientationLandscape()
		{
			return !isUprightOrientationPortrait();
		}

		public TiDeviceOrientation toTiDeviceOrientation()
		{
			if (isUprightOrientationPortrait()) {
				switch (this.rotationId) {
					case Surface.ROTATION_0:
						return TiDeviceOrientation.PORTRAIT;
					case Surface.ROTATION_90:
						return TiDeviceOrientation.LANDSCAPE_RIGHT;
					case Surface.ROTATION_180:
						return TiDeviceOrientation.UPSIDE_PORTRAIT;
					case Surface.ROTATION_270:
						return TiDeviceOrientation.LANDSCAPE_LEFT;
				}
			} else {
				switch (this.rotationId) {
					case Surface.ROTATION_0:
						return TiDeviceOrientation.LANDSCAPE_RIGHT;
					case Surface.ROTATION_90:
						return TiDeviceOrientation.UPSIDE_PORTRAIT;
					case Surface.ROTATION_180:
						return TiDeviceOrientation.LANDSCAPE_LEFT;
					case Surface.ROTATION_270:
						return TiDeviceOrientation.PORTRAIT;
				}
			}
			return TiDeviceOrientation.UNKNOWN;
		}

		public static DisplayInfo from(Display display)
		{
			// Validate argument.
			if (display == null) {
				return null;
			}

			// Acquire screen metrics from the given display.
			DisplayMetrics metrics = new DisplayMetrics();
			if (Build.VERSION.SDK_INT >= 17) {
				// Fetch full screen metrics, which includes status bar and navigation bar.
				// Note: This includes entire screen, even when in split-screen mode.
				display.getRealMetrics(metrics);
			} else {
				// Fetch this app's window metrics, excluding status bar and navigation bar.
				// Note: This is our only option on older OS versions.
				display.getMetrics(metrics);
			}

			// Return information about the given display.
			DisplayInfo displayInfo = new DisplayInfo();
			displayInfo.rotationId = display.getRotation();
			displayInfo.width = metrics.widthPixels;
			displayInfo.height = metrics.heightPixels;
			return displayInfo;
		}
	}
}
