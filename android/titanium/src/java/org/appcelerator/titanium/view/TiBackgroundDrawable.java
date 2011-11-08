/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
	private Path path;
	private Paint paint;

	public TiBackgroundDrawable()
	{
		background = new ColorDrawable(Color.TRANSPARENT);
		border = null;
		outerRect = new RectF();
		innerRect = new RectF();
		paint = new Paint(Paint.ANTI_ALIAS_FLAG);
	}

	@Override
	public void draw(Canvas canvas) {
		if (border != null) {
			paint.setColor(border.color);
			if (border.radius > 0) {
				canvas.drawRoundRect(outerRect, border.radius, border.radius, paint);
			} else {
				canvas.drawRect(outerRect, paint);
			}
		}

		//paint.setColor(backgroundColor);
		if (background != null) {
			background.setBounds((int)innerRect.left, (int)innerRect.top, (int)innerRect.right, (int)innerRect.bottom);
		}
		canvas.save();
		if (border != null && border.radius > 0) {
			// This still happens sometimes when hw accelerated so, catch and warn
			try {
				canvas.clipPath(path);
			} catch (Exception e) {
				Log.w(TAG, "clipPath failed on canvas: " + e.getMessage());
			}
		} else {
			// innerRect == outerRect if there is no border
			//canvas.drawRect(innerRect, paint);
			canvas.clipRect(innerRect);
		}

		if (background != null) {
			if (alpha > NOT_SET) {
				background.setAlpha(alpha);
			}
			background.draw(canvas);
		}
		
		canvas.restore();

		/*if (backgroundImage != null && !backgroundImage.isRecycled()) {
			canvas.drawBitmap(backgroundImage, null, innerRect, paint);
		}*/
	}

	@Override
	protected void onBoundsChange(Rect bounds) {
		super.onBoundsChange(bounds);

		outerRect.set(bounds);
		int padding = 0;
		if (border != null) {
			padding = (int)border.width;
		}
		innerRect.set(bounds.left+padding, bounds.top+padding, bounds.right-padding, bounds.bottom-padding);
		if (background != null) {
			background.setBounds((int)innerRect.left, (int)innerRect.top, (int)innerRect.right, (int)innerRect.bottom);
		}

		if (border != null && border.radius > 0) {
			path = new Path();
			float radii[] = new float[8];
			Arrays.fill(radii, border.radius);
			path.addRoundRect(innerRect, radii, Direction.CW);
			path.setFillType(FillType.EVEN_ODD);
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
	}

//	public Drawable getBackgroundDrawable() {
//		return background;
//	}
}
