/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.gesture;

import android.view.Surface;
import org.appcelerator.titanium.util.TiOrientationHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.TiApplication;


/**
 * Enum type indicating if a device portrait-upright, landscape-left, landscape-right, etc.
 * <p>
 * Provides methods to acquire it's unique Titanium integer ID used in JavaScript
 * and to determine if the device is portrait or landscape.
 */
public enum TiDeviceOrientation
{
	/** Indicates that the device orientation is unknown. */
	UNKNOWN(TiUIHelper.UNKNOWN),

	/** Indicates that the device is in portrait form and in the upright position. */
	PORTRAIT_UPRIGHT(TiUIHelper.PORTRAIT),

	/** Indicates that the device is in portrait form and upside-down. */
	PORTRAIT_UPSIDE_DOWN(TiUIHelper.UPSIDE_PORTRAIT),

	/** Indicates that the device is landscape where the bottom of the device is on the left side. */
	LANDSCAPE_LEFT(TiUIHelper.LANDSCAPE_LEFT),

	/** Indicates that the device is landscape where the bottom of the device is on the right side. */
	LANDSCAPE_RIGHT(TiUIHelper.LANDSCAPE_RIGHT),

	/** Indicates that the device is laying down flat and is facing up towards the sky. */
	FACE_UP(TiUIHelper.FACE_UP),

	/** Indicates that the device is laying down flat and is facing down towards the Earth. */
	FACE_DOWN(TiUIHelper.FACE_DOWN);


	/** Titanium's unique integer ID used in JavaScript to identify the orientation position. */
	private int tiIntegerId;


	/**
	 * Creates a new device orientation type using the given data.
	 * @param tiIntegerId Unique ID used in JavaScript to identify the orientation position.
	 */
	private TiDeviceOrientation(int tiIntegerId)
	{
		this.tiIntegerId = tiIntegerId;
	}

	/**
	 * Determines if the device orientation is in portrait form.
	 * @return
	 * Returns true if orientation is PORTRAIT_UPRIGHT or PORTRAIT_UPSIDE_DOWN.
	 * <p>
	 * Returns false for all other orientation types.
	 */
	public boolean isPortrait()
	{
		switch (this.tiIntegerId) {
			case TiUIHelper.PORTRAIT:
			case TiUIHelper.UPSIDE_PORTRAIT:
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
		switch (this.tiIntegerId) {
			case TiUIHelper.LANDSCAPE_LEFT:
			case TiUIHelper.LANDSCAPE_RIGHT:
				return true;
		}
		return false;
	}

	/**
	 * Gets the unique integer ID that Titanium uses to represent this device orientation
	 * in JavaScript such as Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, etc.
	 * @return Returns the device orientation's unique integer identifier.
	 */
	public int toTiIntegerId()
	{
		return this.tiIntegerId;
	}

	/**
	 * Fetches a device orientation matching the given unique Titanium integer ID.
	 * <p>
	 * This ID matches the value returned by TiDeviceOrientation.toTiIntegerId().
	 * It also matches the orientation IDs Titanium uses in JavaScript such as
	 * Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, etc.
	 * @param value The unique integer ID of the orientation to search for.
	 * @return Returns a matching orientation object. Returns null if given an invalid ID.
	 */
	public static TiDeviceOrientation fromTiIntegerId(int value)
	{
		for (TiDeviceOrientation nextObject : TiDeviceOrientation.values()) {
			if ((nextObject != null) && (nextObject.tiIntegerId == value)) {
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
		int orientationId = TiOrientationHelper.convertRotationToTiOrientationMode(value);
		return TiDeviceOrientation.fromTiIntegerId(orientationId);
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
}
