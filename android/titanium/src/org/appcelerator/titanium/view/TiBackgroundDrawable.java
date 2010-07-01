/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.io.IOException;
import java.util.Arrays;

import org.appcelerator.titanium.util.Log;
import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Path.Direction;
import android.graphics.Path.FillType;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.PaintDrawable;
import android.graphics.drawable.StateListDrawable;
import android.util.AttributeSet;

public class TiBackgroundDrawable extends StateListDrawable {

	//private int backgroundColor;
	//private Bitmap backgroundImage;
	private Drawable background;
	private Border border;
	private RectF outerRect, innerRect;

	public TiBackgroundDrawable()
	{
		background = new ColorDrawable(Color.TRANSPARENT);
		border = null;
		outerRect = new RectF();
		innerRect = new RectF();
	}

	@Override
	public void draw(Canvas canvas) {
		Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
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
			Path path = new Path();
			float radii[] = new float[8];
			Arrays.fill(radii, border.radius);
			path.addRoundRect(innerRect, radii, Direction.CW);
			path.setFillType(FillType.EVEN_ODD);
			canvas.clipPath(path);
			//canvas.clipRoundRect(innerRect, border.radius, border.radius, paint);
		} else {
			// innerRect == outerRect if there is no border
			//canvas.drawRect(innerRect, paint);
			canvas.clipRect(innerRect);
		}

		if (background != null) {
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
	}

	@Override
	protected boolean onStateChange(int[] stateSet) {
		boolean changed = super.onStateChange(stateSet);
		boolean drawableChanged = false;
		if (background != null) {
//			Log.e("TiBackground", "background="+background.getClass().getSimpleName()+",state.len="+stateSet.length);
//			for (int i = 0; i < stateSet.length; i++) {
//				Log.e("TiBackground", "    state[" + i + "]=" + stateSet[i]);
//			}
			drawableChanged = background.setState(stateSet);
//			if (drawableChanged) {
//				background.invalidateSelf();
//			}
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

//	public Drawable getBackgroundDrawable() {
//		return background;
//	}
}
