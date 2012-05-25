/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.io.IOException;
import java.util.Arrays;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Path.Direction;
import android.graphics.Path.FillType;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.PaintDrawable;
import android.graphics.drawable.StateListDrawable;
import android.util.AttributeSet;
import android.util.Log;

public class TiBackgroundDrawable extends StateListDrawable {

	//private int backgroundColor;
	//private Bitmap backgroundImage;
	private static final String TAG = "TiBackgroundDrawable";

	private Drawable background;
	private Border border;
	private RectF outerRect, innerRect;
	private static final int NOT_SET = -1;
	private int alpha = NOT_SET;
	private Path innerPath;
	private Path borderPath;
	private Paint paint;

	public TiBackgroundDrawable()
	{
		background = new ColorDrawable(Color.TRANSPARENT);
		border = null;
		outerRect = new RectF();
		innerRect = new RectF();
		paint = new Paint(Paint.ANTI_ALIAS_FLAG);
	}

	private void drawBorder(Canvas canvas)
	{
		paint.setColor(border.color);

		if (border.alpha > NOT_SET) {
			paint.setAlpha(border.alpha);
		}

		canvas.drawPath(borderPath, paint);
	}

	@Override
	public void draw(Canvas canvas)
	{
		if (border != null) {
			drawBorder(canvas);
		}

		if (background != null) {
			background.setBounds((int) innerRect.left, (int) innerRect.top, (int) innerRect.right, (int) innerRect.bottom);
		}

		canvas.save();

		if (border != null && border.radius > 0) {
			// This still happens sometimes when hw accelerated so, catch and warn
			try {
				canvas.clipPath(innerPath);
			} catch (Exception e) {
				Log.w(TAG, "clipPath failed on canvas: " + e.getMessage());
			}
		} else {
			canvas.clipRect(innerRect);
		}

		if (background != null) {
			if (alpha > NOT_SET) {
				background.setAlpha(alpha);
			}
			background.draw(canvas);
		}

		canvas.restore();
	}

	@Override
	protected void onBoundsChange(Rect bounds)
	{
		super.onBoundsChange(bounds);

		outerRect.set(bounds);

		int padding = 0;
		int maxPadding = 0;
		if (border != null) {
			// cap padding to current bounds
			maxPadding = (int) Math.min(outerRect.right / 2, outerRect.bottom / 2);
			padding = (int) Math.min((int) border.width, maxPadding);
		}
		innerRect.set(bounds.left + padding, bounds.top + padding, bounds.right - padding, bounds.bottom - padding);

		if (background != null) {
			background.setBounds((int) innerRect.left, (int) innerRect.top, (int) innerRect.right, (int) innerRect.bottom);
		}

		if (border != null) {
			if (border.radius > 0) {
				float outerRadii[] = new float[8];
				Arrays.fill(outerRadii, border.radius);
				borderPath = new Path();
				borderPath.addRoundRect(outerRect, outerRadii, Direction.CW);
				borderPath.setFillType(FillType.EVEN_ODD);
				innerPath = new Path();
				innerPath.setFillType(FillType.EVEN_ODD);
				if (border.radius - padding > 0) {
					float innerRadii[] = new float[8];
					Arrays.fill(innerRadii, border.radius - padding);
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
				innerPath = new Path();
				innerPath.addRect(innerRect, Direction.CW);
				innerPath.setFillType(FillType.EVEN_ODD);
			}
		}
	}

	@Override
	protected boolean onStateChange(int[] stateSet) {
		boolean changed = super.onStateChange(stateSet);
		changed = setState(stateSet);
		boolean drawableChanged = false;
		if (background != null) {
//			Log.e("TiBackground", "background="+background.getClass().getSimpleName()+",state.len="+stateSet.length);
//			for (int i = 0; i < stateSet.length; i++) {
//				Log.e("TiBackground", "    state[" + i + "]=" + stateSet[i]);
//			}
			drawableChanged = background.setState(stateSet);
			if (drawableChanged) {
				invalidateSelf();
			}
		}

		return changed || drawableChanged;
	}

	@Override
	public void addState(int[] stateSet, Drawable drawable) {
		if (background instanceof StateListDrawable) {
			((StateListDrawable)background).addState(stateSet, drawable);
		}
	}

	@Override
	protected boolean onLevelChange(int level) {
		boolean changed = super.onLevelChange(level);
		boolean backgroundChanged = false;
		if (background instanceof StateListDrawable) {
			backgroundChanged = ((StateListDrawable)background).setLevel(level);
		}
		return changed || backgroundChanged;
	}

	
	@Override
	public void invalidateSelf() {
		super.invalidateSelf();
		if (background instanceof StateListDrawable) {
			((StateListDrawable)background).invalidateSelf();			
		}
	}

	@Override
	public void invalidateDrawable(Drawable who) {
		super.invalidateDrawable(who);
		if (background instanceof StateListDrawable) {
			((StateListDrawable)background).invalidateDrawable(who);
		}
	}

	@Override
	public void inflate(Resources r, XmlPullParser parser, AttributeSet attrs)
			throws XmlPullParserException, IOException {
		super.inflate(r, parser, attrs);
		if (background != null) {
			background.inflate(r, parser, attrs);
		}
	}

	public void releaseDelegate() {
		if (background != null) {
			if (background instanceof BitmapDrawable) {
				((BitmapDrawable)background).getBitmap().recycle();
			}
			background.setCallback(null);
			background = null;
		}
	}

	public static class Border {
		public static final int SOLID = 0;

		private int color = Color.TRANSPARENT;
		private float radius = 0;
		private float width = 0;
		private int style = SOLID;
		private int alpha = NOT_SET;
		public int getColor() {
			return color;
		}
		public void setColor(int color) {
			this.color = color;
		}
		public float getRadius() {
			return radius;
		}
		public void setRadius(float radius) {
			this.radius = radius;
		}
		public float getWidth() {
			return width;
		}
		public void setWidth(float width) {
			this.width = width;
		}
		public int getStyle() {
			return style;
		}
		public void setStyle(int style) {
			this.style = style;
		}
		public void setAlpha(int alpha) {
			this.alpha = alpha;
		}
		public int getAlpha() {
			return alpha;
		}
	}

	public void setBorder(Border border) {
		this.border = border;
	}

	public Border getBorder() {
		return border;
	}

	public void setBackgroundColor(int backgroundColor) {
		//this.background = new ColorDrawable(backgroundColor);
		releaseDelegate();
		this.background = new PaintDrawable(backgroundColor);
	}

	public void setBackgroundImage(Bitmap backgroundImage) {
		releaseDelegate();
		this.background = new BitmapDrawable(backgroundImage);
	}

	public void setBackgroundDrawable(Drawable drawable) {
		releaseDelegate();
		this.background = drawable;
		onStateChange(getState());
	}

	@Override
	public void setAlpha(int alpha)
	{
		super.setAlpha(alpha);
		this.alpha = alpha;
		if (border != null) {
			border.setAlpha(alpha);
		}
	}

	
//	public Drawable getBackgroundDrawable() {
//		return background;
//	}
}
