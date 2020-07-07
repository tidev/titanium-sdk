/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.content.res.Resources;
import android.graphics.Color;
import android.os.Build;

import androidx.annotation.ColorInt;
import androidx.core.content.ContextCompat;

/**
 * This class contain utility methods that converts a String color, like "red", into its corresponding RGB/RGBA representation.
 */
public class TiColorHelper
{
	static Pattern shortHexPattern = Pattern.compile("#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f]?)");
	static Pattern rgbPattern =
		Pattern.compile("rgb\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*\\)");
	static Pattern argbPattern = Pattern.compile(
		"rgba\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3}[^\\.\\)])\\s*\\)");
	static Pattern rgbaPattern = Pattern.compile(
		"rgba\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*(\\d\\.\\d+)\\s*\\)");
	static Pattern floatsPattern = Pattern.compile(
		"rgba\\(\\s*(\\d\\.\\d+)\\s*,\\s*(\\d\\.\\d+)\\s*,\\s*(\\d\\.\\d+)\\s*,\\s*(\\d\\.\\d+)\\s*\\)");

	private static final String TAG = "TiColorHelper";
	private static HashMap<String, Integer> colorTable;
	private static List<String> alphaMissingColors = Arrays.asList(
		new String[] { "aqua", "fuchsia", "lime", "maroon", "navy", "olive", "purple", "silver", "teal" });

	/**
	 * Convert string representations of colors, like "red" into the corresponding RGB/RGBA representation.
	 * @param value the color value to convert. For example, "red".
	 * @return the RGB/RGBA representation (int) of the color.
	 */
	public static int parseColor(String value)
	{
		if (value == null) {
			return Color.TRANSPARENT;
		}

		String lowval = value.trim().toLowerCase();

		Matcher m = null;
		if ((m = shortHexPattern.matcher(lowval)).matches()) {
			StringBuilder sb = new StringBuilder();
			sb.append("#");
			for (int i = 1; i <= m.groupCount(); i++) {
				String s = m.group(i);
				sb.append(s).append(s);
			}
			String newColor = sb.toString();
			return Color.parseColor(newColor);
		}
		// rgb(int, int, int)
		if ((m = rgbPattern.matcher(lowval)).matches()) {
			return Color.rgb(Integer.valueOf(m.group(1)), Integer.valueOf(m.group(2)), Integer.valueOf(m.group(3)));
		}
		// rgba(int, int, int, int)
		if ((m = argbPattern.matcher(lowval)).matches()) {
			return Color.argb(Integer.valueOf(m.group(4)), Integer.valueOf(m.group(1)),
							Integer.valueOf(m.group(2)), Integer.valueOf(m.group(3)));
		}
		// rgba(int, int, int, float)
		if ((m = rgbaPattern.matcher(lowval)).matches()) {
			return Color.argb(Math.round(Float.valueOf(m.group(4)) * 255f), Integer.valueOf(m.group(1)),
							Integer.valueOf(m.group(2)), Integer.valueOf(m.group(3)));
		}
		// rgba(float, float, float, float)
		if ((m = floatsPattern.matcher(lowval)).matches()) {
			return Color.argb(
				Math.round(Float.valueOf(m.group(4)) * 255f), Math.round(Float.valueOf(m.group(1)) * 255f),
				Math.round(Float.valueOf(m.group(2)) * 255f), Math.round(Float.valueOf(m.group(3)) * 255f));
		}

		// Ti.Android.R.color or Ti.App.Android.R.color resource (by name)
		if (TiColorHelper.hasColorResource(value)) {
			try {
				return TiColorHelper.getColorResource(value);
			} catch (Exception e) {
				Log.e(TAG, "Cannot find named color: " + value, e);
			}
		}

		// Try the parser, will throw illegalArgument if it can't parse it.
		try {
			// In 4.3, Google introduced some new string color constants and they forgot to
			// add the alpha bits to them! This is a temporary workaround
			// until they fix it. I've created a Google ticket for this:
			// https://code.google.com/p/android/issues/detail?id=58352&thanks=58352
			if (Build.VERSION.SDK_INT > 17 && alphaMissingColors.contains(lowval)) {
				return Color.parseColor(lowval) | 0xFF000000;
			}
			return Color.parseColor(lowval);
		} catch (IllegalArgumentException e) {
			if (colorTable == null) {
				buildColorTable();
			}

			if (colorTable.containsKey(lowval)) {
				return colorTable.get(lowval);
			}
			Log.w(TAG, "Unknown color: " + value);
		}
		return Color.TRANSPARENT;
	}

	public static boolean hasColorResource(String colorName)
	{
		return TiRHelper.hasResource("color." + colorName);
	}

	public static @ColorInt int getColorResource(String colorName)
		throws TiRHelper.ResourceNotFoundException, Resources.NotFoundException
	{
		int colorResId = TiRHelper.getResource("color." + colorName);
		// Now we need to convert it!
		return ContextCompat.getColor(TiApplication.getInstance(), colorResId);
	}

	private static void buildColorTable()
	{
		synchronized (TiColorHelper.class)
		{
			colorTable = new HashMap<String, Integer>(20);

			colorTable.put("black", Color.BLACK);
			colorTable.put("red", Color.RED);
			colorTable.put("purple", Color.rgb(0x80, 0, 0x80));
			colorTable.put("orange", Color.rgb(0xff, 0x80, 0));
			colorTable.put("gray", Color.GRAY);
			colorTable.put("darkgray", Color.DKGRAY);
			colorTable.put("lightgray", Color.LTGRAY);
			colorTable.put("cyan", Color.CYAN);
			colorTable.put("magenta", Color.MAGENTA);
			colorTable.put("transparent", Color.TRANSPARENT);
			colorTable.put("aqua", Color.rgb(0, 0xff, 0xff));
			colorTable.put("fuchsia", Color.rgb(0xff, 0, 0xff));
			colorTable.put("lime", Color.rgb(0, 0xff, 0));
			colorTable.put("maroon", Color.rgb(0x88, 0, 0x88));
			colorTable.put("pink", Color.rgb(0xff, 0xc0, 0xcb));
			colorTable.put("navy", Color.rgb(0, 0, 0x80));
			colorTable.put("silver", Color.rgb(0xc0, 0xc0, 0xc0));
			colorTable.put("olive", Color.rgb(0x80, 0x80, 0));
			colorTable.put("teal", Color.rgb(0x0, 0x80, 0x80));
			colorTable.put("brown", Color.rgb(0x99, 0x66, 0x33));
		}
	}
}
