/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import android.graphics.Matrix;

@Kroll.proxy
public class Ti2DMatrix extends KrollProxy
{
	protected Matrix matrix;

	public Ti2DMatrix(TiContext tiContext)
	{
		// Default Identity Matrix
		this(tiContext, new Matrix());
	}

	protected Ti2DMatrix(TiContext tiContext, Matrix matrix)
	{
		super(tiContext);
		this.matrix = matrix;
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);
		if (dict.containsKey(TiC.PROPERTY_ROTATE)) {
			handleRotate(matrix, dict, TiConvert.toDouble(dict, TiC.PROPERTY_ROTATE));
		}
		if (dict.containsKey(TiC.PROPERTY_SCALE)) {
			float scale = TiConvert.toFloat(dict, TiC.PROPERTY_SCALE);
			handleScale(matrix, dict, scale, scale);
		}
	}

	protected void handleRotate(Matrix m, KrollDict dict, double angle)
	{
		float degrees = (float) angle;
		boolean rotateWithAnchorPoint = false;
		if (dict.containsKey(TiC.PROPERTY_ANCHOR_POINT)) {
			KrollDict anchorPoint = dict.getKrollDict(TiC.PROPERTY_ANCHOR_POINT);
			if (anchorPoint != null) {
				float px = TiConvert.toFloat(anchorPoint, TiC.PROPERTY_X);
				float py = TiConvert.toFloat(anchorPoint, TiC.PROPERTY_Y);
				m.preRotate(degrees, px, py);
				rotateWithAnchorPoint = true;
			}
		}
		if (!rotateWithAnchorPoint) {
			m.preRotate(degrees, 0.5f, 0.5f);
		}
	}

	protected void handleScale(Matrix m, KrollDict dict, float scaleX, float scaleY)
	{
		boolean scaleWithAnchorPoint = false;
		if (dict.containsKey(TiC.PROPERTY_ANCHOR_POINT)) {
			KrollDict anchorPoint = dict.getKrollDict(TiC.PROPERTY_ANCHOR_POINT);
			if (anchorPoint != null) {
				float px = TiConvert.toFloat(anchorPoint, TiC.PROPERTY_X);
				float py = TiConvert.toFloat(anchorPoint, TiC.PROPERTY_Y);
				m.preScale(scaleX, scaleY, px, py);
				scaleWithAnchorPoint = true;
			}
		}
		if (!scaleWithAnchorPoint) {
			m.preScale(scaleX, scaleY, 0.5f, 0.5f);
		}
	}

	@Kroll.method
	public Ti2DMatrix translate(KrollInvocation invocation, double x, double y)
	{
		Matrix m = new Matrix(matrix);
		m.preTranslate((float)x, (float)y);
		return new Ti2DMatrix(invocation.getTiContext(), m);
	}

	@Kroll.method
	public Ti2DMatrix scale(KrollInvocation invocation, Object args[])
	{
		float scaleX = 1.0f, scaleY = 1.0f;
		// varargs for API backwards compatibility
		if (args.length == 2) {
			// scale(toX, toY)
			scaleX = TiConvert.toFloat(args[0]);
			scaleY = TiConvert.toFloat(args[1]);
		} else if (args.length == 1) {
			// scale(scaleFactor)
			scaleX = scaleY = TiConvert.toFloat(args[0]);
		}
		Matrix m = new Matrix(matrix);
		handleScale(m, getProperties(), scaleX, scaleY);
		return new Ti2DMatrix(invocation.getTiContext(), m);
	}

	@Kroll.method
	public Ti2DMatrix rotate(KrollInvocation invocation, double angle)
	{
		Matrix m = new Matrix(matrix);
		handleRotate(m, getProperties(), angle);
		return new Ti2DMatrix(invocation.getTiContext(), m);
	}

	@Kroll.method
	public Ti2DMatrix invert(KrollInvocation invocation)
	{
		Matrix m = new Matrix(matrix);
		m.invert(m);
		return new Ti2DMatrix(invocation.getTiContext(), m);
	}

	@Kroll.method
	public Ti2DMatrix multiply(KrollInvocation invocation, Ti2DMatrix other)
	{
		Matrix m = new Matrix(matrix);
		m.preConcat(other.matrix);
		return new Ti2DMatrix(invocation.getTiContext(), m);
	}

	public Matrix getMatrix()
	{
		return matrix;
	}
}
