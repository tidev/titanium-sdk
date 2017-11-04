/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.Context;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;
import org.appcelerator.titanium.TiApplication;


@SuppressWarnings("deprecation")
public class TiOrientationHelper
{
	// public member
	public static final int ORIENTATION_UNKNOWN = TiUIHelper.UNKNOWN;
	public static final int ORIENTATION_PORTRAIT = TiUIHelper.PORTRAIT;
	public static final int ORIENTATION_LANDSCAPE = TiUIHelper.LANDSCAPE_RIGHT;
	public static final int ORIENTATION_PORTRAIT_REVERSE = TiUIHelper.UPSIDE_PORTRAIT;
	public static final int ORIENTATION_LANDSCAPE_REVERSE = TiUIHelper.LANDSCAPE_LEFT;


	/**
	 * Gets the orientation of the window based on the given Android "Surface" class rotation ID
	 * and the given size of the window. The window width/height are needed to determine if
	 * the upright orienation (ie: Surface.ROTATION_0) is portrait or landscape.
	 * @param surfaceRotationId
	 * An Android "Surface" class rotation constant such as Surface.ROTATION_0, Surface.ROTATION_90,
	 * Surface.ROTATION_180, or Surface.ROTATION_270.
	 * @param width The width of the window in pixels.
	 * @param height The height of the window in pixels.
	 * @return
	 * Returns the orientation of the window such as ORIENTATION_PORTRAIT, ORIENTATION_PORTRAIT_REVERSE,
	 * ORIENTATION_LANDSCAPE, or ORIENTATION_LANDSCAPE_REVERSE.
	 * <p>
	 * Returns ORIENTATION_UNKNOWN if unable to determine the orientation or if given invalid arguments.
	 */
	public static int convertRotationToTiOrientationMode(int surfaceRotationId, int width, int height)
	{
		DisplayInfo displayInfo = new DisplayInfo();
		displayInfo.setRotationId(surfaceRotationId);
		displayInfo.setWidth(width);
		displayInfo.setHeight(height);
		return displayInfo.getTiOrientationMode();
	}

	/**
	 * Gets the orientation of the screen based on the given Android "Surface" class rotation ID.
	 * @param surfaceRotationId
	 * An Android "Surface" class rotation constant such as Surface.ROTATION_0, Surface.ROTATION_90,
	 * Surface.ROTATION_180, or Surface.ROTATION_270.
	 * @return
	 * Returns the orientation of the screen such as ORIENTATION_PORTRAIT, ORIENTATION_PORTRAIT_REVERSE,
	 * ORIENTATION_LANDSCAPE, or ORIENTATION_LANDSCAPE_REVERSE.
	 * <p>
	 * Returns ORIENTATION_UNKNOWN if unable to determine the orientation or if given invalid arguments.
	 */
	public static int convertRotationToTiOrientationMode(int surfaceRotationId)
	{
		// Fetch the device's display info.
		DisplayInfo displayInfo = DisplayInfo.fromWindowManager();
		if (displayInfo == null) {
			return ORIENTATION_UNKNOWN;
		}

		// Determine if the device's upright orientation is portrait or landscape.
		// Note: Large tablets typically have a landscape upright orientation.
		boolean isUprightOrientationPortrait = displayInfo.isUprightOrientationPortrait();

		// Configure display info object with given rotation and device's upright orientation.
		// Note: The below width/height doesn't need to match the device's actual dispaly size.
		//       They just need to indicate if the device is portrait/landscape for given rotation.
		switch (surfaceRotationId) {
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
		displayInfo.setRotationId(surfaceRotationId);

		// Return a matching Titanium orientation ID matching the given Android surface rotation ID.
		return displayInfo.getTiOrientationMode();
	}

	/**
	 * Gets the orientation of the screen, not the application window.
	 * <p>
	 * Note that the application window is normally the same orientation as the screen,
	 * except when the Android device has been put into split-screen/multi-window mode.
	 * <p>
	 * For example, split-screen mode with the screen in landscape form will display 2 apps portrait.
	 * In this case, this method will return landscape (the screen orientation).
	 * @return
	 * Returns the orientation of the screen such as ORIENTATION_PORTRAIT, ORIENTATION_PORTRAIT_REVERSE,
	 * ORIENTATION_LANDSCAPE, or ORIENTATION_LANDSCAPE_REVERSE.
	 * <p>
	 * Returns ORIENTATION_UNKNOWN if unable to determine screen orientation.
	 */
	public static int getScreenTiOrientationMode()
	{
		DisplayInfo displayInfo = DisplayInfo.fromWindowManager();
		if (displayInfo != null) {
			return displayInfo.getTiOrientationMode();
		}
		return ORIENTATION_UNKNOWN;
	}

	/**
	 * Determines if the device's upright orientation is portrait.
	 * This is typically the case for phones and small tablets.
	 * @return Returns true if the upright orientation is portrait. Returns false if landscape.
	 */
	public static boolean isUprightOrientationPortrait()
	{
		DisplayInfo displayInfo = DisplayInfo.fromWindowManager();
		if (displayInfo != null) {
			return displayInfo.isUprightOrientationPortrait();
		}
		return true;
	}

	/**
	 * Determines if the device's upright orientation is landscape.
	 * This is typically the case for large tablets and TVs.
	 * @return Returns true if the upright orientation is landscape. Returns false if portrait.
	 */
	public static boolean isUprightOrientationLandscape()
	{
		return !isUprightOrientationPortrait();
	}


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

		public int getTiOrientationMode()
		{
			if (isUprightOrientationPortrait()) {
				switch (this.rotationId) {
					case Surface.ROTATION_0:
						return ORIENTATION_PORTRAIT;
					case Surface.ROTATION_90:
						return ORIENTATION_LANDSCAPE;
					case Surface.ROTATION_180:
						return ORIENTATION_PORTRAIT_REVERSE;
					case Surface.ROTATION_270:
						return ORIENTATION_LANDSCAPE_REVERSE;
				}
			} else {
				switch (this.rotationId) {
					case Surface.ROTATION_0:
						return ORIENTATION_LANDSCAPE;
					case Surface.ROTATION_90:
						return ORIENTATION_PORTRAIT_REVERSE;
					case Surface.ROTATION_180:
						return ORIENTATION_LANDSCAPE_REVERSE;
					case Surface.ROTATION_270:
						return ORIENTATION_PORTRAIT;
				}
			}
			return ORIENTATION_UNKNOWN;
		}

		public static DisplayInfo fromWindowManager()
		{
			DisplayInfo displayInfo = null;
			TiApplication application = TiApplication.getInstance();
			if (application != null) {
				Object object = application.getSystemService(Context.WINDOW_SERVICE);
				if (object instanceof WindowManager) {
					WindowManager windowManager = (WindowManager)object;
					Display display = windowManager.getDefaultDisplay();
					if (display != null) {

						DisplayMetrics metrics = new DisplayMetrics();
						if (Build.VERSION.SDK_INT >= 17) {
							// Fetch full screen metrics.
							// Note: This includes entire screen, even when in split-screen mode.
							display.getRealMetrics(metrics);
						} else {
							// Fetch this app's window metrics, excluding status bar and navigation bar.
							// Note: This is our only option on older OS versions.
							display.getMetrics(metrics);
						}

						displayInfo = new DisplayInfo();
						displayInfo.rotationId = display.getRotation();
						displayInfo.width = metrics.widthPixels;
						displayInfo.height = metrics.heightPixels;
					}
				}
			}
			return displayInfo;
		}
	}
}
