/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

import android.graphics.Color;

import androidx.annotation.ColorInt;

@Kroll.proxy
/**
 * This is a proxy representation of the Android Color type.
 * Refer to <a href="https://developer.android.com/reference/android/graphics/Color">Android Color</a> for more details.
 */
public class ColorProxy extends KrollProxy
{
	private Color color;

	public ColorProxy(@ColorInt int colorInt)
	{
		this(Color.valueOf(colorInt));
	}

	public ColorProxy(Color color)
	{
		this.color = color;
	}

	@Kroll.method
	public String toHex()
	{
		if (this.color == null) {
			return "#000000";
		}
		// Padding! If length is less than 8, pad with leading 0s
		String hex = Integer.toHexString(this.color.toArgb());
		while (hex.length() < 8) {
			hex = "0" + hex;
		}
		return "#" + hex;
	}

	@Override
	public void release()
	{
		super.release();
		this.color = null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Color";
	}
}
