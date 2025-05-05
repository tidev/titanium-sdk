/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.Context;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.graphics.Color;
import android.util.TypedValue;

import androidx.annotation.ColorInt;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
	static Pattern rgbafloatPattern = Pattern.compile(
		"rgba\\((0|[1-9]\\d{0,2}),\\s*(0|[1-9]\\d{0,2}),\\s*(0|[1-9]\\d{0,2}),"
			+ "\\s*(0|1|(0){0,1}\\.\\d{1,10}|1\\.0{1,10})\\s*\\)");
	static Pattern rgbaPatternFallback =
		Pattern.compile("rgba\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*\\)");

	private static final String TAG = "TiColorHelper";
	private static HashMap<String, Integer> colorTable;
	private static final List<String> alphaMissingColors = Arrays.asList(
		"aqua", "fuchsia", "lime", "maroon", "navy", "olive", "purple", "silver", "teal");

	/**
	 * Convert string representations of colors, like "red" into the corresponding RGB/RGBA representation.
	 * @param value the color value to convert. For example, "red".
	 * @return the RGB/RGBA representation (int) of the color.
	 */
	public static int parseColor(String value)
	{
		return parseColor(value, null);
	}
	public static int parseColor(String value, Context context)
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
			return Color.argb(Integer.valueOf(m.group(4)), Integer.valueOf(m.group(1)), Integer.valueOf(m.group(2)),
							  Integer.valueOf(m.group(3)));
		}
		// rgba(int, int, int, float)
		if ((m = rgbaPattern.matcher(lowval)).matches()) {
			return Color.argb(Math.round(Float.valueOf(m.group(4)) * 255f), Integer.valueOf(m.group(1)),
							  Integer.valueOf(m.group(2)), Integer.valueOf(m.group(3)));
		}
		// rgba(int, int, int, float)
		if ((m = rgbafloatPattern.matcher(lowval)).matches()) {
			return Color.argb(Math.round(Float.valueOf(m.group(4)) * 255f), Integer.valueOf(m.group(1)),
							  Integer.valueOf(m.group(2)), Integer.valueOf(m.group(3)));
		}
		// rgba(int, int, int) with missing alpha value
		if ((m = rgbaPatternFallback.matcher(lowval)).matches()) {
			return Color.rgb(Integer.valueOf(m.group(1)), Integer.valueOf(m.group(2)), Integer.valueOf(m.group(3)));
		}
		// rgba(float, float, float, float)
		if ((m = floatsPattern.matcher(lowval)).matches()) {
			return Color.argb(
				Math.round(Float.valueOf(m.group(4)) * 255f), Math.round(Float.valueOf(m.group(1)) * 255f),
				Math.round(Float.valueOf(m.group(2)) * 255f), Math.round(Float.valueOf(m.group(3)) * 255f));
		}

		// Check if this a "semantic.colors.json" generated string from our common "ti.ui.js" script.
		// Example: "ti.semantic.color:dark=<ColorString>;light=<ColorString>"
		final String TI_SEMANTIC_COLOR_PREFIX = "ti.semantic.color:";
		if (value.startsWith(TI_SEMANTIC_COLOR_PREFIX)) {
			String themePrefix = "light=";
			Configuration config;
			if (context != null) {
				config = context.getResources().getConfiguration();
			} else {
				config = TiApplication.getInstance().getResources().getConfiguration();
			}
			if ((config.uiMode & Configuration.UI_MODE_NIGHT_YES) != 0) {
				themePrefix = "dark=";
			}
			String[] stringArray = value.substring(TI_SEMANTIC_COLOR_PREFIX.length()).split(";");
			for (String nextString : stringArray) {
				if (nextString.startsWith(themePrefix)) {
					return TiColorHelper.parseColor(nextString.substring(themePrefix.length()), context);
				}
			}
			Log.e(TAG, "Cannot find named color: " + value);
			return Color.TRANSPARENT;
		}

		// Ti.Android.R.color or Ti.App.Android.R.color resource (by name)
		if (TiColorHelper.hasColorResource(value, context)) {
			try {
				return TiColorHelper.getColorResource(value, context);
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
			if (alphaMissingColors.contains(lowval)) {
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
		return hasColorResource(colorName, null);
	}
	public static boolean hasColorResource(String colorName, Context context)
	{
		try {
			TypedValue typedValue = TiColorHelper.getColorResourceTypedValue(colorName, context);
			return TiColorHelper.isColor(typedValue);
		} catch (Exception ex) {
		}
		return false;
	}
	@NonNull
	public static TypedValue getColorResourceTypedValue(String colorName) throws Resources.NotFoundException
	{
		return getColorResourceTypedValue(colorName, null);
	}
	@NonNull
	public static TypedValue getColorResourceTypedValue(String colorName, Context context)
		throws Resources.NotFoundException
	{
		TypedValue typedValue = new TypedValue();

		// Validate argument.
		if ((colorName == null) || colorName.isEmpty()) {
			return typedValue;
		}

		// Resource ID starting with '?' (instead of '@') should favor current activity theme.
		// Note: Resources.getIdentifier() won't accept leading '?'. We must replace it.
		TiApplication app = TiApplication.getInstance();
		if (context == null) {
			Context activity = app.getCurrentActivity();
			context = activity != null ? activity : app;
		}
		if (colorName.startsWith("?")) {
			colorName = "@" + colorName.substring(1);
		}

		// First check if resource name is defined in app or its libraries.
		// If not found, then check if it's an Android OS system resource.
		Resources resources = context.getResources();
		int resourceId = resources.getIdentifier(colorName, "color", app.getPackageName());
		if (resourceId == 0) {
			resourceId = resources.getIdentifier(colorName, "color", "android");
		}

		// Fetch the resource's type data.
		if (resourceId != 0) {
			if (colorName.contains("attr/")) {
				// Resource is an attribute such as "?attr/colorPrimary".
				context.getTheme().resolveAttribute(resourceId, typedValue, true);
			} else {
				// Might be a color resource such as "@android:color/white".
				resources.getValue(resourceId, typedValue, true);
				if (!TiColorHelper.isColor(typedValue)) {
					// Not a color resource. Might be a ColorStateList such as "@android:color/primary_text_light".
					// Try to fetch complex resource's default color and set up the type value ourselves.
					typedValue.data = ContextCompat.getColor(context, resourceId);
					typedValue.type = TypedValue.TYPE_INT_COLOR_ARGB8;
				}
			}
		}
		return typedValue;
	}

	public static @ColorInt int getColorResource(String colorName) throws Resources.NotFoundException
	{
		return getColorResource(colorName, null);
	}
	public static @ColorInt int getColorResource(String colorName, Context context) throws Resources.NotFoundException
	{
		TypedValue typedValue = TiColorHelper.getColorResourceTypedValue(colorName, context);
		if (TiColorHelper.isColor(typedValue)) {
			return typedValue.data;
		}
		return 0;
	}

	public static boolean isColor(TypedValue typedValue)
	{
		if (typedValue != null) {
			int type = typedValue.type;
			if ((type >= TypedValue.TYPE_FIRST_COLOR_INT) && (type <= TypedValue.TYPE_LAST_COLOR_INT)) {
				return true;
			}
		}
		return false;
	}

	private static void buildColorTable()
	{
		synchronized (TiColorHelper.class)
		{
			colorTable = new HashMap<>(20);

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
