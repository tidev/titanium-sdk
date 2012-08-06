/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.kroll.common.Log;

import android.graphics.Color;

/**
 * This class contain utility methods that converts a String color, like "red", into its corresponding RGB/RGBA representation.
 */
public class TiColorHelper
{
	static Pattern shortHexPattern = Pattern.compile("#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f]?)");
	static Pattern rgbPattern = Pattern.compile("rgb\\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\\)");
	static Pattern argbPattern = Pattern.compile("rgba\\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\\)");

	private static final String TAG = "TiColorHelper";
	private static HashMap<String, Integer> colorTable;

	/**
	 * Convert string representations of colors, like "red" into the corresponding RGB/RGBA representation.
	 * @param value the color value to convert. For example, "red".
	 * @return the RGB/RGBA representation (int) of the color.
	 */
	public static int parseColor(String value) {
		int color = Color.YELLOW; // Something noticeable
		if (value != null) {
			String lowval = value.trim().toLowerCase();

			Matcher m = null;
			if ((m = shortHexPattern.matcher(lowval)).matches()) {
				StringBuilder sb = new StringBuilder();
				sb.append("#");
				for(int i = 1; i <= m.groupCount(); i++) {
					String s = m.group(i);
					sb.append(s).append(s);
				}
				String newColor = sb.toString();
				color = Color.parseColor(newColor);
			} else if ((m = rgbPattern.matcher(lowval)).matches()) {
				color = Color.rgb(
					Integer.valueOf(m.group(1)),
					Integer.valueOf(m.group(2)),
					Integer.valueOf(m.group(3))
					);
			} else if ((m = argbPattern.matcher(lowval)).matches()) {
				color = Color.argb(
						Integer.valueOf(m.group(4)),
						Integer.valueOf(m.group(1)),
						Integer.valueOf(m.group(2)),
						Integer.valueOf(m.group(3))
						);
			} else {
				// Try the parser, will throw illegalArgument if it can't parse it.
				try {
					color = Color.parseColor(lowval);
				} catch (IllegalArgumentException e) {
					if (colorTable == null) {
						buildColorTable();
					}

					if (colorTable.containsKey(lowval)) {
						color = colorTable.get(lowval);
					} else {
						Log.w(TAG, "Unknown color: " + value);
					}
				}
			}
		}
		return color;
	}

	private static void buildColorTable() {
		synchronized(TiColorHelper.class) {
			colorTable = new HashMap<String, Integer>(16);

			colorTable.put("black", Color.BLACK);
			colorTable.put("red", Color.RED);
			colorTable.put("purple", Color.rgb(0x80, 0, 0x80));
			colorTable.put("orange", Color.rgb(0xff, 0x80, 0));
			colorTable.put("gray", Color.GRAY);
			colorTable.put("darkgray", Color.DKGRAY);
			colorTable.put("lightgray", Color.LTGRAY);
			colorTable.put("cyan", Color.CYAN);
			colorTable.put("magenta",Color.MAGENTA);
			colorTable.put("transparent", Color.TRANSPARENT);
			colorTable.put("aqua", Color.rgb(0, 0xff, 0xff));
			colorTable.put("fuchsia", Color.rgb(0xff, 0, 0xff));
			colorTable.put("lime", Color.rgb(0, 0xff, 0));
			colorTable.put("maroon", Color.rgb(0x88,0 ,0x88));
			colorTable.put("pink", Color.rgb(0xff,0xc0, 0xcb));
			colorTable.put("navy", Color.rgb(0, 0, 0x80));
			colorTable.put("silver", Color.rgb(0xc0, 0xc0, 0xc0));
			colorTable.put("olive", Color.rgb(0x80, 0x80, 0));
			colorTable.put("teal", Color.rgb(0x0, 0x80, 0x80));
		}
	}
}
