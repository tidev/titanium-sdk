/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.picker;


import java.util.ArrayList;
import java.util.Arrays;

import kankan.wheel.widget.WheelAdapter;

public class TextWheelAdapter implements WheelAdapter
{
	private ArrayList<Object> values = null;
	private int maxLength;
	
	public TextWheelAdapter(ArrayList<Object> values)
	{
		setValues(values);
	}

	public TextWheelAdapter(Object[] values)
	{
		this( new ArrayList<Object>( Arrays.asList(values) ) );
	}

	@Override
	public String getItem(int index)
	{
		if (values == null || index < values.size()) {
			return values.get(index).toString();
		} else {
			throw new ArrayIndexOutOfBoundsException(index);
		}
	}

	@Override
	public int getMaximumLength()
	{
		return maxLength;
	}

	private int calcMaxLength()
	{
		if (values == null) {
			return 0; // TODO really?
		} else {
			int max = 0;
			for (Object o : values) {
				max = Math.max(max, o.toString().length());
			}
			return max;
		}
	}

	public void setValues(Object[] newValues)
	{
		setValues( new ArrayList<Object>( Arrays.asList(newValues) ) );
	}

	public void setValues(ArrayList<Object> newValues)
	{
		if (values != null) values.clear();
		this.values = newValues;
		this.maxLength = calcMaxLength();
	}

	@Override
	public int getItemsCount()
	{
		return (values == null) ? 0 : values.size();
	}
	
}
