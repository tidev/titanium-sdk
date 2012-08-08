/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.res.Configuration;


public class TiOrientationHelper
{
	// public member
	public static final int ORIENTATION_UNKNOWN = 0;
	public static final int ORIENTATION_PORTRAIT = 1;
	public static final int ORIENTATION_LANDSCAPE = 2;
	public static final int ORIENTATION_PORTRAIT_REVERSE = 3;
	public static final int ORIENTATION_LANDSCAPE_REVERSE = 4;
	public static final int ORIENTATION_SQUARE = 5;

	public static int convertConfigToTiOrientationMode (int configOrientationMode)
	{
		switch (configOrientationMode)
		{
			case Configuration.ORIENTATION_PORTRAIT:
				return ORIENTATION_PORTRAIT;

			case Configuration.ORIENTATION_LANDSCAPE:
				return ORIENTATION_LANDSCAPE;

			case Configuration.ORIENTATION_SQUARE:
				return ORIENTATION_SQUARE;

			default:
				return ORIENTATION_UNKNOWN;
		}
	}
}

