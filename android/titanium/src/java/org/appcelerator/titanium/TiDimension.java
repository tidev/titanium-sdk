/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;

import android.content.Context;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;

public class TiDimension
{
	private static final String LCAT = "TiDimension";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int COMPLEX_UNIT_UNDEFINED = TypedValue.COMPLEX_UNIT_MASK + 1;
	public static final int COMPLEX_UNIT_PERCENT = TypedValue.COMPLEX_UNIT_MASK + 2;
	public static final int COMPLEX_UNIT_AUTO = TypedValue.COMPLEX_UNIT_MASK + 3;

	public static final int TYPE_LEFT = 0;
	public static final int TYPE_CENTER_X = 1;
	public static final int TYPE_RIGHT = 2;
	public static final int TYPE_TOP = 3;
	public static final int TYPE_CENTER_Y = 4;
	public static final int TYPE_BOTTOM = 5;
	public static final int TYPE_WIDTH = 6;
	public static final int TYPE_HEIGHT = 7;

	public static final double POINT_DPI = 72.0;
	public static final double MM_INCH = 25.4;

	public static Pattern DIMENSION_PATTERN = Pattern.compile("(-?[0-9]*\\.?[0-9]+)\\s*(px|dp|dip|sp|sip|mm|pt|in|%)?");
	protected static DisplayMetrics metrics = null;

	protected double value;
	protected int units, valueType;

	public TiDimension(double value, int valueType)
	{
		this.value = value;
		this.valueType = valueType;
		this.units = COMPLEX_UNIT_UNDEFINED;
	}

	public TiDimension(String svalue, int valueType)
	{
		this.valueType = valueType;
		this.units = TypedValue.COMPLEX_UNIT_PX;
		if (svalue != null) {
			Matcher m = DIMENSION_PATTERN.matcher(svalue.trim());
			if (m.matches()) {
				value = Float.parseFloat(m.group(1));

				if (m.groupCount() == 2) {
					String unit = m.group(2);
					if ("px".equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_PX;
					} else if ("pt".equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_PT;
					} else if ("dp".equals(unit) || "dip".equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_DIP;
					} else if ("sp".equals(unit) || "sip".equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_SP;
					} else if ("%".equals(unit)) {
						this.units = COMPLEX_UNIT_PERCENT;
					} else if ("mm".equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_MM;
					} else if ("in".equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_IN;
					} else {
						if (DBG) {
							if (unit != null) {
								Log.w(LCAT, "Unknown unit: " + unit);
							}
						}
					}
				}
			} else if (svalue.trim().equals("auto")) {
				this.value = Integer.MIN_VALUE;
				this.units = COMPLEX_UNIT_AUTO;
			}
		}
	}

	public double getValue()
	{
		return value;
	}

	public int getIntValue()
	{
		return Double.valueOf(value).intValue();
	}

	public void setValue(double value)
	{
		this.value = value;
	}

	public int getUnits()
	{
		return units;
	}

	public void setUnits(int units)
	{
		this.units = units;
	}

	public int getAsPixels(View parent)
	{
		switch (units) {
			case TypedValue.COMPLEX_UNIT_PX:
			case COMPLEX_UNIT_UNDEFINED:
				return (int)this.value;
			case COMPLEX_UNIT_PERCENT:
				return getPercentPixels(parent);
			case TypedValue.COMPLEX_UNIT_DIP:
			case TypedValue.COMPLEX_UNIT_SP:
				return getScaledPixels(parent);
			case TypedValue.COMPLEX_UNIT_PT:
			case TypedValue.COMPLEX_UNIT_MM:
			case TypedValue.COMPLEX_UNIT_IN:
				return getSizePixels(parent);
		}
		return -1;
	}

	protected int getPercentPixels(View parent)
	{
		int dimension = - 1;
		switch (valueType) {
			case TYPE_TOP:
			case TYPE_BOTTOM:
			case TYPE_CENTER_Y:
			case TYPE_HEIGHT:
				dimension = parent.getHeight(); break;
			case TYPE_LEFT:
			case TYPE_RIGHT:
			case TYPE_CENTER_X:
			case TYPE_WIDTH:
				dimension = parent.getWidth(); break;
		}
		if (dimension != -1) {
			return (int) ((this.value / 100.0) * dimension);
		}
		return -1;
	}

	protected static DisplayMetrics getDisplayMetrics(View parent)
	{
		if (metrics == null) {
			WindowManager windowManager = (WindowManager) parent.getContext().getSystemService(Context.WINDOW_SERVICE);
			Display display = windowManager.getDefaultDisplay();
			metrics = new DisplayMetrics();
			display.getMetrics(metrics);
		}
		return metrics;
	}

	protected int getScaledPixels(View parent)
	{
		DisplayMetrics metrics = getDisplayMetrics(parent);
		if (units == TypedValue.COMPLEX_UNIT_DIP) {
			return (int) (metrics.density * this.value);
		} else if (units == TypedValue.COMPLEX_UNIT_SP) {
			return (int) (metrics.scaledDensity * this.value);
		}
		return -1;
	}

	protected int getSizePixels(View parent)
	{
		DisplayMetrics metrics = getDisplayMetrics(parent);
		float dpi = -1;
		switch (valueType) {
			case TYPE_TOP:
			case TYPE_BOTTOM:
			case TYPE_CENTER_Y:
			case TYPE_HEIGHT:
				dpi = metrics.ydpi; break;
			case TYPE_LEFT:
			case TYPE_RIGHT:
			case TYPE_CENTER_X:
			case TYPE_WIDTH:
				dpi = metrics.xdpi; break;
		}
		if (units == TypedValue.COMPLEX_UNIT_PT) { 
			return (int) (this.value * (dpi / POINT_DPI));
		} else if (units == TypedValue.COMPLEX_UNIT_MM) {
			return (int) ((this.value / MM_INCH) * dpi);
		} else if (units == TypedValue.COMPLEX_UNIT_IN) {
			return (int) (this.value * dpi);
		}
		return -1;
	}

	public boolean isUnitUndefined()
	{
		return units == COMPLEX_UNIT_UNDEFINED;
	}

	public boolean isUnitPercent()
	{
		return units == COMPLEX_UNIT_PERCENT;
	}

	public boolean isUnitAuto()
	{
		return units == COMPLEX_UNIT_AUTO;
	}

	public String toString()
	{
		StringBuilder sb = new StringBuilder(10);
		if (! isUnitAuto()) {
			sb.append(value);
			switch(units) {
				case TypedValue.COMPLEX_UNIT_PX : sb.append("px"); break;
				case TypedValue.COMPLEX_UNIT_PT : sb.append("pt"); break;
				case TypedValue.COMPLEX_UNIT_DIP : sb.append("dp"); break;
				case TypedValue.COMPLEX_UNIT_SP : sb.append("sp"); break;
				case TypedValue.COMPLEX_UNIT_MM : sb.append("mm"); break;
				case TypedValue.COMPLEX_UNIT_IN : sb.append("in"); break;
				case COMPLEX_UNIT_PERCENT : sb.append("%"); break;
			}
		} else {
			sb.append("auto");
		}

		return sb.toString();
	}
}
