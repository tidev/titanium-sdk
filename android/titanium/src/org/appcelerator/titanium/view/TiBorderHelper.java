package org.appcelerator.titanium.view;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;

public class TiBorderHelper
{
	// if border color set default width to 1.0f
	public static final float DEFAULT_BORDER = 1.0f;

	public interface BorderSupport {
		public TiBorderHelper getBorderHelper();
	}
	// ClipToBounds if border/radius

	protected Float borderRadius;
	protected Integer borderColor;
	protected Float borderWidth;
	protected Paint paint;
	boolean dirty;

	public TiBorderHelper() {
		paint = new Paint(Paint.ANTI_ALIAS_FLAG);
		dirty = true;
	}

	public float calculatePadding()
	{
		float padding = 0;

		if (borderRadius != null) {
			padding = borderRadius;
			if (borderWidth != null) {
				padding = borderWidth;
			}
		} else {
			if (borderWidth != null) {
				padding = borderWidth;
			} else {
				padding = DEFAULT_BORDER;
			}
		}

		return padding;
	}
	public void preDraw(Canvas canvas, int width, int height)
	{
		if (borderColor != null) {
			float pad = calculatePadding();
			RectF rect = new RectF(pad, pad, width-pad, height - pad);
			if (rect.height() > 0 && rect.width() > 0) {
				canvas.save();
				canvas.clipRect(rect);
			}
		}
	}

	public void postDraw(Canvas canvas, int width, int height)
	{
		if (borderColor != null) {
			float pad = calculatePadding();
			RectF rect = new RectF(pad, pad, width-pad, height-pad);
			canvas.restore();

			if (borderRadius != null) {
				if (dirty) {
					paint.reset();
					paint.setStrokeWidth(pad);
					paint.setColor(borderColor);
					paint.setStyle(Paint.Style.STROKE);
					paint.setStrokeJoin(Paint.Join.ROUND);
					dirty = false;
				}
				canvas.drawRoundRect(rect, borderRadius, borderRadius, paint);
			} else {
				if (dirty) {
					paint.reset();
					paint.setStrokeWidth(pad);
					paint.setColor(borderColor);
					paint.setStyle(Paint.Style.STROKE);
					paint.setStrokeJoin(Paint.Join.ROUND);
					dirty = false;
				}
				canvas.drawRect(rect, paint);
			}
		}
	}

	public Float getBorderRadius() {
		return borderRadius;
	}

	public void setBorderRadius(Float borderRadius) {
		this.borderRadius = borderRadius;
		dirty = true;
	}

	public Integer getBorderColor() {
		return borderColor;
	}

	public void setBorderColor(Integer borderColor) {
		this.borderColor = borderColor;
		dirty = true;
	}

	public Float getBorderWidth() {
		return borderWidth;
	}

	public void setBorderWidth(Float borderWidth) {
		this.borderWidth = borderWidth;
		dirty = true;
	}

}
