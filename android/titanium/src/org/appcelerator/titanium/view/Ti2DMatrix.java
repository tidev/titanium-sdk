/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.proxy
public class Ti2DMatrix extends KrollProxy
{
	KrollDict options;
	Double translateX;
	Double translateY;
	Double fromScaleX, fromScaleY, toScaleX, toScaleY;
	Double rotateDegrees;

	public Ti2DMatrix(TiContext tiContext)
	{
		super(tiContext);
	}
	
	@Override
	public void handleCreationDict(KrollDict dict) {
		super.handleCreationDict(dict);
		options = dict;
	}

	@Kroll.method
	public Ti2DMatrix translate(double x, double y)
	{
		translateX = x;
		translateY = y;
		return this;
	}

	@Kroll.method
	public Ti2DMatrix scale(Object args[]) {
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
		return this;
	}

	@Kroll.method
	public Ti2DMatrix rotate(double degrees) {
		this.rotateDegrees = degrees;
		return this;
	}

	@Kroll.method
	public boolean hasTranslation() {
		return translateX != null;
	}
	
	@Kroll.getProperty @Kroll.method
	public float getXTranslation() {
		return translateX.floatValue();
	}
	
	@Kroll.getProperty @Kroll.method
	public float getYTranslation() {
		return translateY.floatValue();
	}
	
	@Kroll.method
	public boolean hasScaleFactor() {
		return toScaleX != null;
	}
	
	@Kroll.getProperty @Kroll.method
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
	
	@Kroll.method
	public boolean hasRotation() {
		return rotateDegrees != null;
	}
	
	@Kroll.getProperty @Kroll.method
	public float getRotation() {
		return rotateDegrees.floatValue();
	}
}
