/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.util.TiColorHelper;

import androidx.annotation.ColorInt;

import ti.modules.titanium.ui.UIModule;

@Kroll.proxy
/**
 * This is a proxy representation of the Android Color type.
 * Refer to <a href="https://developer.android.com/reference/android/graphics/Color">Android Color</a> for more details.
 */
public class ColorProxy extends KrollProxy implements UIModule.UIStyleChangedListener
{
	private @ColorInt int color;
	private final String name;
	private boolean hasActualColorIntValue = true;

	public ColorProxy(@ColorInt int colorInt)
	{
		this(colorInt, null);
	}

	public ColorProxy(@ColorInt int colorInt, String name)
	{
		this.color = colorInt;
		this.name = name;
		UIModule.addUIStyleChangedListener(this);
	}

	private @ColorInt int getColor()
	{
		if (!hasActualColorIntValue) {
			color = TiColorHelper.getColorResource(name);
			hasActualColorIntValue = true;
		}
		return color;
	}

	public String getName()
	{
		return name;
	}

	@Kroll.method
	public String toHex()
	{
		@ColorInt int value = getColor();
		// Convert to ARGB hex string.
		return String.format(
			"#%02X%02X%02X%02X",
			value >>> 24,
			(value >>> 16) & 0xFF,
			(value >>> 8) & 0xFF,
			value & 0xFF);
	}

	@Override
	public void onUserInterfaceStyleChanged(int styleId)
	{
		this.hasActualColorIntValue = false;
	}

	@Override
	public void release()
	{
		super.release();
		UIModule.removeUIStyleChangedListener(this);
	}

	@Kroll.method
	@Override
	public String toString()
	{
		if (this.name != null) {
			return this.name;
		}
		return toHex();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Color";
	}
}
