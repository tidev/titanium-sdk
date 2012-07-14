/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.util.Arrays;

import org.appcelerator.kroll.common.Log;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Path.Direction;
import android.graphics.Path.FillType;
import android.graphics.Rect;
import android.graphics.RectF;
import android.widget.FrameLayout;

/**
 * This class is a wrapper for Titanium Views with borders. Any view that specifies a border
 * related property will have a border wrapper view to maintain its border.
 */
public class TiBorderWrapperView extends FrameLayout
{
	public static final int SOLID = 0;
	private static final String TAG = "TiBorderWrapperView";

	private int color = Color.TRANSPARENT;
	private float radius = 0;
	private float borderWidth = 0;
	private int alpha = -1;
	private RectF outerRect, innerRect;
	private Path innerPath;
	private Path borderPath;
	private Paint paint;

	public TiBorderWrapperView(Context context)
	{
		super(context);
		outerRect = new RectF();
		innerRect = new RectF();
		paint = new Paint(Paint.ANTI_ALIAS_FLAG);
		setWillNotDraw(false);
	}

	@Override
	protected void onDraw(Canvas canvas)
	{
		updateBorderPath();
		drawBorder(canvas);

		if (radius > 0) {
			// This still happens sometimes when hw accelerated so, catch and warn
			try {
				canvas.clipPath(innerPath);
			} catch (Exception e) {
				Log.w(TAG, "clipPath failed on canvas: " + e.getMessage());
			}
		} else {
			canvas.clipRect(innerRect);
		}
	}

	private void updateBorderPath()
	{
		Rect bounds = new Rect();
		getDrawingRect(bounds);
		outerRect.set(bounds);

		int padding = 0;
		int maxPadding = 0;
		// cap padding to current bounds
		maxPadding = (int) Math.min(outerRect.right / 2, outerRect.bottom / 2);
		padding = (int) Math.min(getBorderWidth(), maxPadding);
		innerRect.set(bounds.left + padding, bounds.top + padding, bounds.right - padding, bounds.bottom - padding);

		if (radius > 0) {
			float outerRadii[] = new float[8];
			Arrays.fill(outerRadii, radius);
			borderPath = new Path();
			borderPath.addRoundRect(outerRect, outerRadii, Direction.CW);
			borderPath.setFillType(FillType.EVEN_ODD);
			innerPath = new Path();
			innerPath.setFillType(FillType.EVEN_ODD);
			if (radius - padding > 0) {
				float innerRadii[] = new float[8];
				Arrays.fill(innerRadii, radius - padding);
				borderPath.addRoundRect(innerRect, innerRadii, Direction.CW);
				innerPath.addRoundRect(innerRect, innerRadii, Direction.CW);
			} else {
				borderPath.addRect(innerRect, Direction.CW);
				innerPath.addRect(innerRect, Direction.CW);
			}
		} else {
			borderPath = new Path();
			borderPath.addRect(outerRect, Direction.CW);
			borderPath.addRect(innerRect, Direction.CW);
			borderPath.setFillType(FillType.EVEN_ODD);
		}
	}

	private void drawBorder(Canvas canvas)
	{
		paint.setColor(getColor());
		if (getBorderAlpha() > -1) {
			paint.setAlpha(getBorderAlpha());
		}
		canvas.drawPath(borderPath, paint);
	}

	public int getColor()
	{
		return color;
	}

	public void setColor(int color)
	{
		this.color = color;
	}

	public float getRadius()
	{
		return radius;
	}

	public void setRadius(float radius)
	{
		this.radius = radius;
	}

	public float getBorderWidth()
	{
		return borderWidth;
	}

	public void setBorderWidth(float borderWidth)
	{
		this.borderWidth = borderWidth;
	}

	public void setBorderAlpha(int alpha)
	{
		this.alpha = alpha;
	}

	public int getBorderAlpha()
	{
		return alpha;
	}
}
