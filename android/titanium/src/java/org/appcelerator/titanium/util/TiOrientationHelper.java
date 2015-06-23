/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.res.Configuration;
import android.view.Surface;

@SuppressWarnings("deprecation")
public class TiOrientationHelper
{
	// public member
	public static final int ORIENTATION_UNKNOWN = 0;
	public static final int ORIENTATION_PORTRAIT = 1;
	public static final int ORIENTATION_LANDSCAPE = 2;
	public static final int ORIENTATION_PORTRAIT_REVERSE = 3;
	public static final int ORIENTATION_LANDSCAPE_REVERSE = 4;
	public static final int ORIENTATION_SQUARE = 5;

	public static int convertRotationToTiOrientationMode (int rotation)
	{
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
	}
}

