/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.TiConvert;

public class Ti2DMatrix extends TiProxy
{
	TiDict options;
	Double translateX;
	Double translateY;
	Double fromScaleX, fromScaleY, toScaleX, toScaleY;
	Double rotateDegrees;

	public Ti2DMatrix(TiContext tiContext, Object[] args)
	{
		super(tiContext);
		if (args.length > 0) {
			options = (TiDict) args[0];
		}
	}

	public void translate(double x, double y)
	{
		translateX = x;
		translateY = y;
	}

	public void scale(Object[] args) {
		// varargs for API backwards compatibility
		if (args.length == 4) {
			// scale(fromX, fromY, toX, toY);
			this.fromScaleX = TiConvert.toDouble(args[0]);
			this.fromScaleY = TiConvert.toDouble(args[1]);
			this.toScaleX = TiConvert.toDouble(args[2]);
			this.toScaleY = TiConvert.toDouble(args[3]);
		} else if (args.length == 2) {
			// scale(toX, toY)
			this.fromScaleX = 1.0;
			this.fromScaleY = 1.0;
			this.toScaleX = TiConvert.toDouble(args[0]);
			this.toScaleY = TiConvert.toDouble(args[1]);
		} else if (args.length == 1) {
			// scale(scaleFactor)
			this.fromScaleX = 1.0;
			this.fromScaleY = 1.0;
			this.toScaleX = TiConvert.toDouble(args[0]);
			this.toScaleY = this.toScaleX;
		}
	}

	public void rotate(double degrees) {
		this.rotateDegrees = degrees;
	}

	public boolean hasTranslation() {
		return translateX != null;
	}
	public float getXTranslation() {
		return translateX.floatValue();
	}
	public float getYTranslation() {
		return translateY.floatValue();
	}
	public boolean hasScaleFactor() {
		return toScaleX != null;
	}
	public float getScaleFactor() {
		return toScaleX.floatValue();
	}
	public float getToScaleX() {
		return toScaleX.floatValue();
	}
	public float getToScaleY() {
		return toScaleY.floatValue();
	}
	public float getFromScaleX() {
		return fromScaleX.floatValue();
	}
	public float getFromScaleY() {
		return fromScaleY.floatValue();
	}
	public boolean hasRotation() {
		return rotateDegrees != null;
	}
	public float getRotation() {
		return rotateDegrees.floatValue();
	}
}
