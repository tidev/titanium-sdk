/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.app.Activity;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;

import org.appcelerator.kroll.common.Log;

@SuppressWarnings("deprecation")
public class TiOrientationHelper
{
	// public member
	public static final int ORIENTATION_UNKNOWN = 0;
	public static final int ORIENTATION_PORTRAIT = 1;
	public static final int ORIENTATION_LANDSCAPE = 2;
	public static final int ORIENTATION_PORTRAIT_REVERSE = 3;
	public static final int ORIENTATION_LANDSCAPE_REVERSE = 4;

	public static int convertRotationToTiOrientationMode (int rotation, int width, int height)
	{
		Log.d("convertRotationToTiOrientationMode","rotation = "+ rotation + " width= " + width +"  height=" + height);
		// Device that has portrait natural orientation
		if ((rotation == Surface.ROTATION_0 || rotation == Surface.ROTATION_180) && height > width ||
				(rotation == Surface.ROTATION_90 || rotation == Surface.ROTATION_270) && width > height) {
			Log.d("convertRotationToTiOrientationMode","Portrait natural orientation");
			switch (rotation)
			{
				case Surface.ROTATION_0:
					return ORIENTATION_PORTRAIT;

				case Surface.ROTATION_90:
					return ORIENTATION_LANDSCAPE;

				case Surface.ROTATION_180:
					return ORIENTATION_PORTRAIT_REVERSE;

				case Surface.ROTATION_270:
					return ORIENTATION_LANDSCAPE_REVERSE;

				default:
					return ORIENTATION_UNKNOWN;
			}

			// Device that has landscape natural orientation. Eg Samsung Galaxy Tab 3 10.1
		} else {
			Log.d("convertRotationToTiOrientationMode","Landscape natural orientation");
			switch (rotation)
			{
				case Surface.ROTATION_0:
					return ORIENTATION_LANDSCAPE;

				case Surface.ROTATION_90:
					return ORIENTATION_PORTRAIT;

				case Surface.ROTATION_180:
					return ORIENTATION_LANDSCAPE_REVERSE;

				case Surface.ROTATION_270:
					return ORIENTATION_PORTRAIT_REVERSE;

				default:
					return ORIENTATION_UNKNOWN;
			}

		}

	}


	public static int getWindowTiOrientationModeFrom(Activity activity)
	{
		int orientation = ORIENTATION_UNKNOWN;
		if (activity != null) {
			WindowManager windowManager = activity.getWindowManager();
			if (windowManager != null) {
				Display display = windowManager.getDefaultDisplay();
				if (display != null) {
					DisplayMetrics dm = new DisplayMetrics();
					display.getMetrics(dm);
					orientation = convertRotationToTiOrientationMode(
							display.getRotation(), dm.widthPixels, dm.heightPixels);
				}
			}
		}
		return orientation;
	}
}
