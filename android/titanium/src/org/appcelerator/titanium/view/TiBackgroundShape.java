package org.appcelerator.titanium.view;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.drawable.shapes.Shape;

public class TiBackgroundShape extends Shape {
	
	private int backgroundColor;
	private Bitmap backgroundImage;
	private Border border;
	private RectF outerRect, innerRect;
	
	public TiBackgroundShape()
	{
		backgroundColor = Color.TRANSPARENT;
		border = null;
		outerRect = new RectF();
		innerRect = new RectF();
	}
	
	@Override
	public void draw(Canvas canvas, Paint paint) {
		if (border != null) {
			paint.setColor(border.color);
			if (border.radius > 0) {
				canvas.drawRoundRect(outerRect, border.radius, border.radius, paint);
			} else {
				canvas.drawRect(outerRect, paint);
			}
		}
		
		paint.setColor(backgroundColor);
		if (border != null && border.radius > 0) {
			canvas.drawRoundRect(innerRect, border.radius, border.radius, paint);
		} else {
			// innerRect == outerRect if there is no border
			canvas.drawRect(innerRect, paint);
		}
		
		if (backgroundImage != null && !backgroundImage.isRecycled()) {
			canvas.drawBitmap(backgroundImage, null, innerRect, paint);
		}
	}
	
	@Override
	protected void onResize(float width, float height) {
		super.onResize(width, height);
		
		outerRect.set(0, 0, width, height);
		int padding = 0;
		if (border != null) {
			padding = (int)Math.max(border.radius, border.width);
		}
		innerRect.set(padding, padding, (int)width-padding, (int)height-padding);
	}
	
	public static class Border {
		public static final int SOLID = 0;
				
		private int color = Color.BLACK;
		private float radius = 0;
		private float width = 1;
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
		this.backgroundColor = backgroundColor;
	}
	
	public int getBackgroundColor() {
		return backgroundColor;
	}
	
	public void setBackgroundImage(Bitmap backgroundImage) {
		this.backgroundImage = backgroundImage;
	}
	
	public Bitmap getBackgroundImage() {
		return backgroundImage;
	}
}
