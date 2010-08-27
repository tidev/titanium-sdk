/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;

public class Ti2DMatrix extends KrollProxy
{
	KrollDict options;
	Double translateX;
	Double translateY;
	Double scaleFactor;
	Double rotateDegrees;

	public Ti2DMatrix(TiContext tiContext, Object[] args)
	{
		super(tiContext);
		if (args.length > 0) {
			options = (KrollDict) args[0];
		}
	}

	public void translate(double x, double y)
	{
		translateX = x;
		translateY = y;
	}

	public void scale(double scaleFactor) {
		this.scaleFactor = scaleFactor;
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
		return scaleFactor != null;
	}
	public float getScaleFactor() {
		return scaleFactor.floatValue();
	}
	public boolean hasRotation() {
		return rotateDegrees != null;
	}
	public float getRotation() {
		return rotateDegrees.floatValue();
	}
}
