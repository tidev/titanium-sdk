/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;

import java.text.NumberFormat;

import kankan.wheel.widget.NumericWheelAdapter;

public class FormatNumericWheelAdapter extends NumericWheelAdapter
{
	private NumberFormat formatter;
	private int maxCharacterLength = 2;
	
	public FormatNumericWheelAdapter(int minValue, int maxValue, NumberFormat formatter, int maxCharLength)
	{
		this(minValue,maxValue,formatter,maxCharLength, 1);
	}
	
	public FormatNumericWheelAdapter(int minValue, int maxValue, NumberFormat formatter, int maxCharLength, int stepValue)
	{
		super(minValue, maxValue, stepValue);
		this.formatter = formatter;
		this.maxCharacterLength = maxCharLength;
	}
	
	public void setFormatter(NumberFormat formatter) {
		this.formatter = formatter;
	}
	@Override
	public String getItem(int index)
	{
		int actualValue = getValue(index);
		if (formatter == null) {
			return Integer.toString(actualValue);
		} else {
			return formatter.format(actualValue);
		}
	}
	@Override
	public int getMaximumLength()
	{
		return maxCharacterLength;
	}
	
	public void setMaximumLength(int value) 
	{
		maxCharacterLength = value;
	}
}
