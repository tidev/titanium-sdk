/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.graphics.Color;

public class TitaniumColorHelper
{
	static Pattern shortHexPattern = Pattern.compile("#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f]?)");
	static Pattern rgbPattern = Pattern.compile("rgb\\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\\)");
	static Pattern argbPattern = Pattern.compile("rgba\\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\\)");

	public static int parseColor(String value) {
		int color = Color.YELLOW; // Something noticeable
		String lowval = value.toLowerCase();

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
				Log.w("TiColorHelper", "Unknown color: " + value);
			}
		}

		return color;
	}
}
