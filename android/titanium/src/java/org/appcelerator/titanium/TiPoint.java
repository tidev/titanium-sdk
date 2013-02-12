/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.HashMap;

import org.appcelerator.titanium.util.TiConvert;

public class TiPoint {
	private TiDimension x, y;

	/*
	 * Create a new point with the 'x' and 'y'
	 * coordinates in pixel units.
	 */
	public TiPoint(double x, double y) {
		this.x = new TiDimension(x, TiDimension.TYPE_WIDTH);
		this.y = new TiDimension(y, TiDimension.TYPE_HEIGHT);
	}

	/*
	 * Create a new point from an object
	 * with 'x' and 'y' properties. If any of these
	 * properties is missing, a default value of zero will be used.
	 */
	public TiPoint(HashMap object) {
		this(object, 0, 0);
	}

	/*
	 * Create a new point from an object
	 * with 'x' and 'y' properties. If any of these
	 * properties is missing, the default values will be used.
	 */
	public TiPoint(HashMap object, double defaultValueX, double defaultValueY) {
		x = TiConvert.toTiDimension(object.get(TiC.PROPERTY_X), TiDimension.TYPE_WIDTH);
		if (x == null) {
			x = new TiDimension(defaultValueX, TiDimension.TYPE_WIDTH);
		}

		y = TiConvert.toTiDimension(object.get(TiC.PROPERTY_Y), TiDimension.TYPE_HEIGHT);
		if (y == null) {
			y = new TiDimension(defaultValueY, TiDimension.TYPE_HEIGHT);
		}
	}
	
	/*
	 * Create a new point with the 'x' and 'y'
	 * coordinates as string.
	 * @param x the x value as string.
	 * @param y the y value as string.
	 */
	public TiPoint(String x, String y)
	{
		this.x = new TiDimension(x, TiDimension.TYPE_WIDTH);
		this.y = new TiDimension(y, TiDimension.TYPE_HEIGHT);
	}

	public TiDimension getX() {
		return x;
	}

	public TiDimension getY() {
		return y;
	}
}
