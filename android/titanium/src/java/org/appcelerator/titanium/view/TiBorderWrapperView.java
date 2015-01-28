/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.util.Arrays;

import org.appcelerator.kroll.common.Log;

import com.nineoldandroids.view.ViewHelper;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Path.Direction;
import android.graphics.Path.FillType;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.Build;
import android.view.View;
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
	private int bgColor = Color.TRANSPARENT;
	private float radius = 0;
	private float borderWidth = 0;
	private int alpha = -1;
	private RectF outerRect, innerRect;
	private Path innerPath;
	private Path borderPath;
	private Paint paint;
	private View child;

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
				// If the view's background color is not transparent, we draw the background first
				if (bgColor != Color.TRANSPARENT) {
					paint.setColor(bgColor);
					canvas.drawPath(innerPath, paint);
				}
				// Then we clip it to ensure anti-aliasing.
				canvas.clipPath(innerPath);
				
				// Then we clear the clipped region so when the view draws, alpha doesn't stack if bgColor
				// has an alpha that is less than 1. We then reset the color and alpha.
				if (bgColor != Color.TRANSPARENT) {
					canvas.drawColor(0, PorterDuff.Mode.CLEAR);
					setAlphaAndColor();
				}
			} catch (Exception e) {
				Log.w(TAG, "clipPath failed on canvas: " + e.getMessage(), Log.DEBUG_MODE);
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
		padding = (int) Math.min(borderWidth, maxPadding);
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
				innerPath.addRoundRect(innerRect, innerRadii, Direction.CW);
				borderPath.addRoundRect(innerRect, innerRadii, Direction.CCW);
			} else {
				innerPath.addRect(innerRect, Direction.CW);
				borderPath.addRect(innerRect, Direction.CCW);
			}
		} else {
			borderPath = new Path();
			borderPath.addRect(outerRect, Direction.CW);
			borderPath.addRect(innerRect, Direction.CCW);
			borderPath.setFillType(FillType.EVEN_ODD);
		}
	}

	private void drawBorder(Canvas canvas)
	{
		setAlphaAndColor();
		canvas.drawPath(borderPath, paint);
	}

	private void setAlphaAndColor()
	{
		paint.setColor(color);
		if (alpha > -1) {
			paint.setAlpha(alpha);
		}
	}

	public void setColor(int color)
	{
		this.color = color;
	}
	
	public void setBgColor(int color)
	{
		this.bgColor = color;
	}

	public void setRadius(float radius)
	{
		this.radius = radius;
	}

	public void setBorderWidth(float borderWidth)
	{
		this.borderWidth = borderWidth;
	}
	
	@Override
	public boolean onSetAlpha(int alpha)
	{
		if (Build.VERSION.SDK_INT < 11) {
			/*
			 * This is an ugly hack. ViewHelper.setAlpha does not work on border when 
			 * alpha < 1. So we are going to manage alpha animation for ourselves and our
			 * child view manually. This needs to be researched and factored out.
			 * 
			 * TIMOB-17287
			 */
			this.alpha = alpha;
			float falpha = alpha/255.0f;
			if (child == null) {
				try {
					child = getChildAt(0);
				} catch (Throwable t) {
					//Ignore this error.
					child = null;
				}
			}
			if (child != null) {
				//Set alpha of child view
				ViewHelper.setAlpha(child, falpha);
			}
			return true;
		}
		return false;
	}
}
