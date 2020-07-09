/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

import androidx.annotation.ColorInt;

@Kroll.proxy
/**
 * This is a proxy representation of the Android Color type.
 * Refer to <a href="https://developer.android.com/reference/android/graphics/Color">Android Color</a> for more details.
 */
public class ColorProxy extends KrollProxy
{
	private final @ColorInt int color;

	public ColorProxy(@ColorInt int colorInt)
	{
		this.color = colorInt;
	}

	@Kroll.method
	public String toHex()
	{
		// Convert to ARGB hex string.
		return String.format(
			"#%02X%02X%02X%02X",
			this.color >>> 24,
			(this.color >>> 16) & 0xFF,
			(this.color >>> 8) & 0xFF,
			this.color & 0xFF);
	}

	@Kroll.method
	@Override
	public String toString()
	{
		return toHex();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Color";
	}
}
