/*
 *  Copyright 2010 Yuri Kanivets
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/**
 * MODIFICATIONS:
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package kankan.wheel.widget;



/**
 * Numeric Wheel adapter.
 */
public class NumericWheelAdapter implements WheelAdapter {
	
	/** The default min value */
	public static final int DEFAULT_MAX_VALUE = 9;

	/** The default max value */
	private static final int DEFAULT_MIN_VALUE = 0;

	/** The default max value */
	private static final int DEFAULT_STEP_VALUE = 1;
	
	// Values
	private int minValue;
	private int maxValue;
	private int stepValue;
	
	/**
	 * Default constructor
	 */
	public NumericWheelAdapter() {
		this(DEFAULT_MIN_VALUE, DEFAULT_MAX_VALUE, DEFAULT_STEP_VALUE);
	}

	/**
	 * Constructor
	 * @param minValue the wheel min value
	 * @param maxValue the wheel maz value
	 */
	public NumericWheelAdapter(int minValue, int maxValue) {
		this(minValue, maxValue, DEFAULT_STEP_VALUE);
	}

	/**
	 * Constructor
	 * @param minValue the wheel min value
	 * @param maxValue the wheel maz value
	 * @param stepValue the numeric step value
	 */
	public NumericWheelAdapter(int minValue, int maxValue, int stepValue) {
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.stepValue = stepValue;
	}
	
	
	@Override
	public String getItem(int index) {
		if (index >= 0 && index < getItemsCount()) {
			int actualValue = minValue + index * stepValue;
			return Integer.toString(actualValue);
		}
		return null;
	}

	@Override
	public int getItemsCount() {
		int itemCount = ( (maxValue - minValue) / stepValue) + 1;
		return itemCount;
	}
	
	@Override
	public int getMaximumLength() {
		int max = Math.max(Math.abs(maxValue), Math.abs(minValue));
		int maxLen = Integer.toString(max).length();
		if (minValue < 0) {
			maxLen++;
		}
		return maxLen;
	}
	
	public int getMinValue() {
		return minValue;
	}
	
	public int getMaxValue() {
		return maxValue;
	}
	
	public int getValue(int index) {
		int tmpValue = (minValue + index * stepValue);
		if (tmpValue > maxValue)
			return maxValue;
		else
			return tmpValue;	
	}
	
	public int getIndex(int value) {
		return (value - minValue) / stepValue;
	}
	public void setStepValue(int value)
	{
		this.stepValue = value;
	}
}
