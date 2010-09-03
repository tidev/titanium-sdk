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

@Kroll.proxy
public class Ti2DMatrix extends KrollProxy
{
	KrollDict options;
	Double translateX;
	Double translateY;
	Double scaleFactor;
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
	public void translate(double x, double y)
	{
		translateX = x;
		translateY = y;
	}

	@Kroll.method
	public void scale(double scaleFactor) {
		this.scaleFactor = scaleFactor;
	}

	@Kroll.method
	public void rotate(double degrees) {
		this.rotateDegrees = degrees;
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
		return scaleFactor != null;
	}
	
	@Kroll.getProperty @Kroll.method
	public float getScaleFactor() {
		return scaleFactor.floatValue();
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
