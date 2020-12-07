/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Path.Direction;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.Build;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.widget.FrameLayout;

/**
 * This class is a wrapper for Titanium Views with borders. Any view that specifies a border
 * related property will have a border wrapper view to maintain its border.
 */
public class TiBorderWrapperView extends FrameLayout
{
	private static final String TAG = "TiBorderWrapperView";

	private int color = Color.TRANSPARENT;
	private int backgroundColor = Color.TRANSPARENT;
	private float[] radius = { 0, 0, 0, 0, 0, 0, 0, 0 };
	private float borderWidth = 0;
	private int alpha = -1;
	private Paint paint;
	private Rect bounds;
	private ViewOutlineProvider viewOutlineProvider;

	public TiBorderWrapperView(Context context)
	{
		super(context);
		init();
	}

	public TiBorderWrapperView(Context context, AttributeSet set)
	{
		super(context, set);
		init();
	}

	private void init()
	{
		setWillNotDraw(false);

		paint = new Paint(Paint.ANTI_ALIAS_FLAG);
		bounds = new Rect();
	}

	public void reset()
	{
		this.color = Color.TRANSPARENT;
		this.backgroundColor = Color.TRANSPARENT;
		this.borderWidth = 0;
		this.alpha = -1;

		for (int i = 0; i < this.radius.length; i++) {
			this.radius[i] = 0;
		}
	}

	@Override
	protected void onDraw(Canvas canvas)
	{
		getDrawingRect(bounds);

		int maxPadding = (int) Math.min(bounds.right / 2, bounds.bottom / 2);
		int padding = (int) Math.min(borderWidth, maxPadding);
		RectF innerRect =
			new RectF(bounds.left + padding, bounds.top + padding, bounds.right - padding, bounds.bottom - padding);
		RectF outerRect = new RectF(bounds);

		paint.setColor(color);
		if (alpha > -1) {
			paint.setAlpha(alpha);
		}

		Path outerPath = new Path();
		if (hasRadius()) {
			float[] innerRadius = new float[this.radius.length];
			for (int i = 0; i < this.radius.length; i++) {
				innerRadius[i] = this.radius[i] - padding;
			}
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
				// Set specified border corners.
				outerPath.addRoundRect(innerRect, innerRadius, Direction.CCW);
			} else {
				outerPath.addRoundRect(innerRect, innerRadius[0], innerRadius[0], Direction.CCW);
			}
			Path innerPath = new Path(outerPath);

			// Draw border.
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
				// Set specified border corners.
				outerPath.addRoundRect(outerRect, this.radius, Direction.CW);
			} else {
				outerPath.addRoundRect(outerRect, this.radius[0], this.radius[0], Direction.CW);
			}
			canvas.drawPath(outerPath, paint);

			// TIMOB-16909: hack to fix anti-aliasing
			if (backgroundColor != Color.TRANSPARENT) {
				paint.setColor(backgroundColor);
				canvas.drawPath(innerPath, paint);
			}
			canvas.clipPath(innerPath);
			if (backgroundColor != Color.TRANSPARENT) {
				canvas.drawColor(0, PorterDuff.Mode.CLEAR);
			}
		} else {
			outerPath.addRect(outerRect, Direction.CW);
			outerPath.addRect(innerRect, Direction.CCW);
			canvas.drawPath(outerPath, paint);
			canvas.clipRect(innerRect);
		}

		// TIMOB-20076: set the outline for the view in order to use elevation
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && viewOutlineProvider == null) {
			viewOutlineProvider = new ViewOutlineProvider() {
				@Override
				public void getOutline(View view, Outline outline)
				{
					outline.setRoundRect(bounds, radius[0]);
				}
			};
			setOutlineProvider(viewOutlineProvider);
		}
	}

	@Override
	public void onDescendantInvalidated(View child, View target)
	{
		// Also invalidate outline to recalculate drop shadow.
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			invalidateOutline();
		}
		super.onDescendantInvalidated(child, target);
	}

	public void setColor(int color)
	{
		this.color = color;
	}

	public void setBgColor(int color)
	{
		this.backgroundColor = color;
	}

	public boolean hasRadius()
	{
		for (float r : this.radius) {
			if (r > 0f) {
				return true;
			}
		}
		return false;
	}

	public void setRadius(Object obj)
	{
		if (obj instanceof Object[]) {
			final Object[] cornerObjects = (Object[]) obj;
			final float[] cornerPixels = new float[cornerObjects.length];

			for (int i = 0; i < cornerObjects.length; i++) {
				final Object corner = cornerObjects[i];
				final TiDimension radiusDimension = TiConvert.toTiDimension(corner, TiDimension.TYPE_WIDTH);
				if (radiusDimension != null) {
					cornerPixels[i] = (float) radiusDimension.getPixels(this);
				} else {
					Log.w(TAG, "Invalid value specified for borderRadius[" + i + "].");
					cornerPixels[i] = 0;
				}
			}

			if (cornerPixels.length >= 4) {

				// Top-Left, Top-Right, Bottom-Right, Bottom-Left
				this.radius[0] = cornerPixels[0];
				this.radius[1] = cornerPixels[0];
				this.radius[2] = cornerPixels[1];
				this.radius[3] = cornerPixels[1];
				this.radius[4] = cornerPixels[2];
				this.radius[5] = cornerPixels[2];
				this.radius[6] = cornerPixels[3];
				this.radius[7] = cornerPixels[3];

			} else if (cornerPixels.length >= 2) {

				// Top-Left + Bottom-Right, Top-Right + Bottom-Left
				this.radius[0] = cornerPixels[0]; // Top-Left
				this.radius[1] = cornerPixels[0]; // Top-Left
				this.radius[2] = cornerPixels[1]; // Top-Right
				this.radius[3] = cornerPixels[1]; // Top-Right
				this.radius[4] = cornerPixels[0]; // Bottom-Right
				this.radius[5] = cornerPixels[0]; // Bottom-Right
				this.radius[6] = cornerPixels[1]; // Bottom-Left
				this.radius[7] = cornerPixels[1]; // Bottom-Left

			} else if (cornerPixels.length == 1) {

				// Set all radius.
				for (int i = 0; i < radius.length; i++) {
					this.radius[i] = cornerPixels[0];
				}

			} else {
				Log.w(TAG, "Could not set borderRadius, empty array.");
			}

		} else if (obj instanceof Object) {

			// Support string formatting for multiple corners.
			if (obj instanceof String) {
				final String[] corners = ((String) obj).split("\\s");
				if (corners != null && corners.length > 1) {
					setRadius(corners);
					return;
				}
			}

			final TiDimension radiusDimension = TiConvert.toTiDimension(obj, TiDimension.TYPE_WIDTH);
			float pixels = 0;

			if (radiusDimension != null) {
				pixels = (float) radiusDimension.getPixels(this);
			} else {
				Log.w(TAG, "Invalid value specified for borderRadius.");
			}

			for (int i = 0; i < radius.length; i++) {
				this.radius[i] = pixels;
			}
		}
	}

	public void setBorderWidth(float borderWidth)
	{
		this.borderWidth = borderWidth;
	}

	@Override
	public boolean onSetAlpha(int alpha)
	{
		return false;
	}
}
