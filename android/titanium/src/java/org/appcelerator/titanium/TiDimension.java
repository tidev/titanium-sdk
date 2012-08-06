/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.kroll.common.Log;

import android.content.Context;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;

/**
 * A class used to handle different unit measurements for layout purposes.
 * Supported units include: 
 * <li> TypedValue.COMPLEX_UNIT_PX </li>
 * <li> TypedValue.COMPLEX_UNIT_PT </li>
 * <li> TypedValue.COMPLEX_UNIT_DIP </li>
 * <li> TypedValue.COMPLEX_UNIT_SP </li>
 * <li> TypedValue.COMPLEX_UNIT_MM </li>
 * <li> TypedValue.COMPLEX_UNIT_IN </li>
 * <li> TiDimension.COMPLEX_UNIT_PERCENT </li>
 * <li> TiDimension.COMPLEX_UNIT_AUTO </li>
 * <li> TiDimension.COMPLEX_UNIT_UNDEFINED </li>
 * Refer to {@link android.util.TypedValue} for more details.
 *
 */
public class TiDimension
{
	private static final String TAG = "TiDimension";

	public static final int COMPLEX_UNIT_UNDEFINED = TypedValue.COMPLEX_UNIT_MASK + 1;
	public static final int COMPLEX_UNIT_PERCENT = TypedValue.COMPLEX_UNIT_MASK + 2;
	public static final int COMPLEX_UNIT_AUTO = TypedValue.COMPLEX_UNIT_MASK + 3;
	public static final int COMPLEX_UNIT_CM = TypedValue.TYPE_DIMENSION + 1;

	public static final int TYPE_UNDEFINED = -1;
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
	public static final double CM_INCH = 2.54;

	public static final String UNIT_CM = "cm";
	public static final String UNIT_DIP = "dip";
	public static final String UNIT_DP = "dp";
	public static final String UNIT_IN = "in";
	public static final String UNIT_MM = "mm";
	public static final String UNIT_PX = "px";
	public static final String UNIT_PT = "pt";
	public static final String UNIT_SP = "sp";
	public static final String UNIT_SIP = "sip";
	public static final String UNIT_SYSTEM = "system";
	public static final String UNIT_PERCENT = "%";
	public static final String UNIT_AUTO = "auto";

	public static Pattern DIMENSION_PATTERN = Pattern.compile("(-?[0-9]*\\.?[0-9]+)\\s*(system|px|dp|dip|sp|sip|mm|cm|pt|in|%)?");
	protected static DisplayMetrics metrics = null;

	protected double value;
	protected int units, valueType;

	/**
	 * Creates a TiDimension object.
	 * @param value the value to set.
	 * @param valueType the valueType to set. Supported types include: {@link #TYPE_LEFT}, {@link #TYPE_RIGHT}, 
	 * {@link #TYPE_BOTTOM}, {@link #TYPE_TOP}, {@link #TYPE_CENTER_X}, {@link #TYPE_CENTER_Y}, {@link #TYPE_HEIGHT}.
	 * {@link #TYPE_WIDTH}.
	 */
	public TiDimension(double value, int valueType)
	{
		this.value = value;
		this.valueType = valueType;
		this.units = COMPLEX_UNIT_UNDEFINED;
	}

	/**
	 * Creates and parses a TiDimension object.
	 * @param svalue the string to parse.
	 * @param valueType the valueType to set. Supported types include: {@link #TYPE_LEFT}, {@link #TYPE_RIGHT}, 
	 * {@link #TYPE_BOTTOM}, {@link #TYPE_TOP}, {@link #TYPE_CENTER_X}, {@link #TYPE_CENTER_Y}, {@link #TYPE_HEIGHT}.
	 * {@link #TYPE_WIDTH}.
	 */
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
					// if there is no unit, then use the default one
					if (unit == null) {
						unit = TiApplication.getInstance().getDefaultUnit();
					}
					if (UNIT_PX.equals(unit) || UNIT_SYSTEM.equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_PX;
					} else if (UNIT_PT.equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_PT;
					} else if (UNIT_DP.equals(unit) || UNIT_DIP.equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_DIP;
					} else if (UNIT_SP.equals(unit) || UNIT_SIP.equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_SP;
					} else if (UNIT_PERCENT.equals(unit)) {
						this.units = COMPLEX_UNIT_PERCENT;
					} else if (UNIT_MM.equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_MM;
					} else if (UNIT_CM.equals(unit)) {
						this.units = COMPLEX_UNIT_CM;
					} else if (UNIT_IN.equals(unit)) {
						this.units = TypedValue.COMPLEX_UNIT_IN;
					} else {
						if (unit != null) {
							Log.w(TAG, "Unknown unit: " + unit, Log.DEBUG_MODE);
						}
					}
				}
			} else if (svalue.trim().equals(UNIT_AUTO)) {
				this.value = Integer.MIN_VALUE;
				this.units = COMPLEX_UNIT_AUTO;
			}
		}
	}

	/**
	 * @return the TiDimension's value.
	 */
	public double getValue()
	{
		return value;
	}

	/**
	 * @return the TiDimension's int value.
	 */
	public int getIntValue()
	{
		return Double.valueOf(value).intValue();
	}

	/**
	 * Sets value to a double value.
	 * @param value a double to be set.
	 */
	public void setValue(double value)
	{
		this.value = value;
	}

	/**
	 * @return the TiDimension's units. Supported units include: 
	 * <li> TypedValue.COMPLEX_UNIT_PX </li>
	 * <li> TypedValue.COMPLEX_UNIT_PT </li>
	 * <li> TypedValue.COMPLEX_UNIT_DIP </li>
	 * <li> TypedValue.COMPLEX_UNIT_SP </li>
	 * <li> TypedValue.COMPLEX_UNIT_MM </li>
	 * <li> TypedValue.COMPLEX_UNIT_IN </li>
	 * <li> TypedValue.COMPLEX_UNIT_CM </li>
	 * <li> TiDimension.COMPLEX_UNIT_PERCENT </li>
	 * <li> TiDimension.COMPLEX_UNIT_AUTO </li>
	 * <li> TiDimension.COMPLEX_UNIT_UNDEFINED </li>
	 * Refer to {@link android.util.TypedValue} for more details.
	 */
	public int getUnits()
	{
		return units;
	}

	/**
	 * Set TiDimension's units. Refer to {@link #getUnits()} for more details.
	 * @param units the unit to set.
	 */
	public void setUnits(int units)
	{
		this.units = units;
	}

	protected double getPixels(View parent)
	{
		switch (units) {
			case TypedValue.COMPLEX_UNIT_PX:
			case COMPLEX_UNIT_UNDEFINED:
				return (int) this.value;
			case COMPLEX_UNIT_PERCENT:
				return getPercentPixels(parent);
			case TypedValue.COMPLEX_UNIT_DIP:
			case TypedValue.COMPLEX_UNIT_SP:
				return getScaledPixels(parent);
			case TypedValue.COMPLEX_UNIT_PT:
			case TypedValue.COMPLEX_UNIT_MM:
			case COMPLEX_UNIT_CM:
			case TypedValue.COMPLEX_UNIT_IN:
				return getSizePixels(parent);
		}
		return -1;
	}

	/**
	 * Calculates and returns the number of pixels, depending on the type.
	 * It also takes screen/view density into consideration.
	 * @param parent the parent view used for calculation.
	 * @return the number of pixels.
	 */
	public int getAsPixels(View parent)
	{
		return (int) Math.round(getPixels(parent));
	}

	public double getAsMillimeters(View parent)
	{
		if (units == TypedValue.COMPLEX_UNIT_MM) {
			return this.value;
		}

		return ((getPixels(parent) / getDPIForType(parent)) * MM_INCH);
	}

	public double getAsCentimeters(View parent)
	{
		if (units == COMPLEX_UNIT_CM) {
			return this.value;
		}

		return ((getPixels(parent) / getDPIForType(parent)) * CM_INCH);
	}

	public double getAsInches(View parent)
	{
		if (units == TypedValue.COMPLEX_UNIT_IN) {
			return this.value;
		}

		return (getPixels(parent) / getDPIForType(parent));
	}

	public int getAsDIP(View parent)
	{
		if (units == TypedValue.COMPLEX_UNIT_DIP) {
			return (int) this.value;
		}

		return (int) Math.round((getPixels(parent) / getDisplayMetrics(parent).density));
	}
	
	/**
	 * Calculates and returns the dimension in the default units. If the default
	 * unit is not valid, returns in PX.
	 * @param parent the parent of the view used for calculation
	 * @return the dimension in the system unit
	 */
	public double getAsDefault(View parent)
	{
		String defaultUnit = TiApplication.getInstance().getDefaultUnit();
		if (UNIT_DP.equals(defaultUnit) || UNIT_DIP.equals(defaultUnit)) {
			return (double) getAsDIP(parent);
		}
		else if (UNIT_MM.equals(defaultUnit)) {
			return getAsMillimeters(parent);
		}
		else if (UNIT_CM.equals(defaultUnit)) {
			return getAsCentimeters(parent);
		}
		else if (UNIT_IN.equals(defaultUnit)) {
			return getAsInches(parent);
		}

		// Returned for PX, SYSTEM, and unknown values
		return (double) getAsPixels(parent);
	}

	protected double getPercentPixels(View parent)
	{
		int dimension = -1;
		switch (valueType) {
			case TYPE_TOP:
			case TYPE_BOTTOM:
			case TYPE_CENTER_Y:
			case TYPE_HEIGHT:
				dimension = parent.getHeight();
				break;
			case TYPE_LEFT:
			case TYPE_RIGHT:
			case TYPE_CENTER_X:
			case TYPE_WIDTH:
				dimension = parent.getWidth();
				break;
		}
		if (dimension != -1) {
			return ((this.value / 100.0) * dimension);
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

	protected double getScaledPixels(View parent)
	{
		DisplayMetrics metrics = getDisplayMetrics(parent);
		if (units == TypedValue.COMPLEX_UNIT_DIP) {
			return (metrics.density * this.value);
		} else if (units == TypedValue.COMPLEX_UNIT_SP) {
			return (metrics.scaledDensity * this.value);
		}
		return -1;
	}
	
	protected double getDPIForType(View parent)
	{
		DisplayMetrics metrics = getDisplayMetrics(parent);		
		float dpi = -1;
		switch (valueType) {
			case TYPE_TOP:
			case TYPE_BOTTOM:
			case TYPE_CENTER_Y:
			case TYPE_HEIGHT:
				dpi = metrics.ydpi;
				break;
			case TYPE_LEFT:
			case TYPE_RIGHT:
			case TYPE_CENTER_X:
			case TYPE_WIDTH:
				dpi = metrics.xdpi;
				break;
			default:
				dpi = metrics.densityDpi;
		}
		
		return dpi;
	}
	
	protected double getSizePixels(View parent)
	{
		double dpi = getDPIForType(parent);
		
		if (units == TypedValue.COMPLEX_UNIT_PT) {
			return (this.value * (dpi / POINT_DPI));
		} else if (units == TypedValue.COMPLEX_UNIT_MM) {
			return ((this.value / MM_INCH) * dpi);
		} else if (units == COMPLEX_UNIT_CM) {
			return ((this.value / CM_INCH) * dpi);
		} else if (units == TypedValue.COMPLEX_UNIT_IN) {
			return (this.value * dpi);
		}
		return -1;
	}

	/**
	 * @return true if units is TiDimension.COMPLEX_UNIT_UNDEFINED, false otherwise.
	 */
	public boolean isUnitUndefined()
	{
		return units == COMPLEX_UNIT_UNDEFINED;
	}

	/**
	 * @return true if units is TiDimension.COMPLEX_UNIT_PERCENT, false otherwise.
	 */
	public boolean isUnitPercent()
	{
		return units == COMPLEX_UNIT_PERCENT;
	}

	public boolean isUnitAuto()
	{
		return units == COMPLEX_UNIT_AUTO;
	}

	/**
	 * @return string representation of the TiDimension object.
	 */
	public String toString()
	{
		StringBuilder sb = new StringBuilder(10);
		if (!isUnitAuto()) {
			sb.append(value);
			switch (units) {
				case TypedValue.COMPLEX_UNIT_PX:
					sb.append(UNIT_PX);
					break;
				case TypedValue.COMPLEX_UNIT_PT:
					sb.append(UNIT_PT);
					break;
				case TypedValue.COMPLEX_UNIT_DIP:
					sb.append(UNIT_DIP);
					break;
				case TypedValue.COMPLEX_UNIT_SP:
					sb.append(UNIT_SP);
					break;
				case TypedValue.COMPLEX_UNIT_MM:
					sb.append(UNIT_MM);
					break;
				case COMPLEX_UNIT_CM:
					sb.append(UNIT_CM);
					break;
				case TypedValue.COMPLEX_UNIT_IN:
					sb.append(UNIT_IN);
					break;
				case COMPLEX_UNIT_PERCENT:
					sb.append(UNIT_PERCENT);
					break;
			}
		} else {
			sb.append(UNIT_AUTO);
		}

		return sb.toString();
	}
}
