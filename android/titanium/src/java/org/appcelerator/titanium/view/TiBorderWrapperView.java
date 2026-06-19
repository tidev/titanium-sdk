/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
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
	private final float[] radius = { 0, 0, 0, 0, 0, 0, 0, 0 };
	private float borderLeftWidth = 0;
	private float borderTopWidth = 0;
	private float borderRightWidth = 0;
	private float borderBottomWidth = 0;
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
		this.borderLeftWidth = 0;
		this.borderTopWidth = 0;
		this.borderRightWidth = 0;
		this.borderBottomWidth = 0;
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
		int paddingTop = (int) Math.min(borderTopWidth, maxPadding);
		int paddingBottom = (int) Math.min(borderBottomWidth, maxPadding);
		int paddingLeft = (int) Math.min(borderLeftWidth, maxPadding);
		int paddingRight = (int) Math.min(borderRightWidth, maxPadding);

		RectF innerRect = new RectF(
			bounds.left + paddingLeft,
			bounds.top + paddingTop,
			bounds.right - paddingRight,
			bounds.bottom - paddingBottom);
		RectF outerRect = new RectF(bounds);

		paint.setColor(color);
		if (alpha > -1) {
			paint.setAlpha(alpha);
		}

		Path outerPath = new Path();
		if (hasRadius()) {
			float[] innerRadius = new float[this.radius.length];
			for (int i = 0; i < this.radius.length; i++) {
				float adjPadding;
				switch (i) {
					case 0:
					case 1:
						adjPadding = Math.min(paddingLeft, paddingTop);
						break; // TL
					case 2:
					case 3:
						adjPadding = Math.min(paddingRight, paddingTop);
						break; // TR
					case 4:
					case 5:
						adjPadding = Math.min(paddingRight, paddingBottom);
						break; // BR
					default:
						adjPadding = Math.min(paddingLeft, paddingBottom);
						break; // BL
				}
				innerRadius[i] = Math.max(0, this.radius[i] - adjPadding);
			}
			outerPath.addRoundRect(innerRect, innerRadius, Direction.CCW);
			Path innerPath = new Path(outerPath);

			// Draw border.
			outerPath.addRoundRect(outerRect, this.radius, Direction.CW);
			canvas.drawPath(outerPath, paint);

			// TIMOB-16909: hack to fix anti-aliasing
			if (Build.VERSION.SDK_INT < 30 && backgroundColor != Color.TRANSPARENT) {
				paint.setColor(backgroundColor);
				canvas.drawPath(innerPath, paint);
			}
			canvas.clipPath(innerPath);
			if (Build.VERSION.SDK_INT < 30 && backgroundColor != Color.TRANSPARENT) {
				canvas.drawColor(0, PorterDuff.Mode.CLEAR);
			}
		} else {
			outerPath.addRect(outerRect, Direction.CW);
			outerPath.addRect(innerRect, Direction.CCW);
			canvas.drawPath(outerPath, paint);
			canvas.clipRect(innerRect);
		}

		// TIMOB-20076: set the outline for the view in order to use elevation
		if (viewOutlineProvider == null) {
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
		invalidateOutline();
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

	public void setBorderWidth(Object obj)
	{
		if (obj instanceof Object[]) {
			final Object[] widthValues = (Object[]) obj;
			final float[] pixelValues = new float[widthValues.length];

			for (int i = 0; i < widthValues.length; i++) {
				final TiDimension widthDim = TiConvert.toTiDimension(widthValues[i], TiDimension.TYPE_WIDTH);
				if (widthDim != null) {
					pixelValues[i] = (float) widthDim.getPixels(this);
				} else {
					Log.w(TAG, "Invalid value specified for borderWidth[" + i + "].");
					pixelValues[i] = 0;
				}
			}

			if (pixelValues.length >= 4) {
				// Top, Right, Bottom, Left (CSS order)
				this.borderTopWidth = pixelValues[0];
				this.borderRightWidth = pixelValues[1];
				this.borderBottomWidth = pixelValues[2];
				this.borderLeftWidth = pixelValues[3];
			} else if (pixelValues.length >= 2) {
				// Top+Bottom, Left+Right
				this.borderTopWidth = pixelValues[0];
				this.borderBottomWidth = pixelValues[0];
				this.borderLeftWidth = pixelValues[1];
				this.borderRightWidth = pixelValues[1];
			} else if (pixelValues.length == 1) {
				// All sides
				this.borderTopWidth = pixelValues[0];
				this.borderRightWidth = pixelValues[0];
				this.borderBottomWidth = pixelValues[0];
				this.borderLeftWidth = pixelValues[0];
			} else {
				Log.w(TAG, "Could not set borderWidth, empty array.");
			}
		} else if (obj instanceof Object) {
			// Support string formatting for multiple values.
			if (obj instanceof String) {
				final String[] values = ((String) obj).split("\\s");
				if (values != null && values.length > 1) {
					setBorderWidth(values);
					return;
				}
			}

			final TiDimension widthDim = TiConvert.toTiDimension(obj, TiDimension.TYPE_WIDTH);
			float pixels = 0;
			if (widthDim != null) {
				pixels = (float) widthDim.getPixels(this);
			} else {
				Log.w(TAG, "Invalid value specified for borderWidth.");
			}

			this.borderTopWidth = pixels;
			this.borderRightWidth = pixels;
			this.borderBottomWidth = pixels;
			this.borderLeftWidth = pixels;
		}
	}

	@Override
	public boolean onSetAlpha(int alpha)
	{
		return false;
	}
}
