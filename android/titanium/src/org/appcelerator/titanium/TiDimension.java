/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.util.TypedValue;

public class TiDimension
{
	private static final String LCAT = "TiDimension";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int COMPLEX_UNIT_UNDEFINED = TypedValue.COMPLEX_UNIT_MASK + 1;
	public static final int COMPLEX_UNIT_PERCENT = TypedValue.COMPLEX_UNIT_MASK + 2;
	public static final int COMPLEX_UNIT_AUTO = TypedValue.COMPLEX_UNIT_MASK + 3;

	public static Pattern DIMENSION_PATTERN = Pattern.compile("(-?[0-9]*\\.?[0-9]+)\\W*(px|dp|dip|sp|sip|mm|pt|in|%)?");

	private double value;
	private int units;

	public TiDimension(double value) {
		this.value = value;
		this.units = COMPLEX_UNIT_UNDEFINED;
	}

	public TiDimension(String svalue)
	{
		this.units = TypedValue.COMPLEX_UNIT_SP;

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

	public double getValue() {
		return value;
	}

	public int getIntValue() {
		return Double.valueOf(value).intValue();
	}

	public void setValue(double value) {
		this.value = value;
	}

	public int getUnits() {
		return units;
	}

	public void setUnits(int units) {
		this.units = units;
	}

	public boolean isUnitUndefined() {
		return units == COMPLEX_UNIT_UNDEFINED;
	}

	public boolean isUnitPercent() {
		return units == COMPLEX_UNIT_PERCENT;
	}

	public boolean isUnitAuto() {
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
