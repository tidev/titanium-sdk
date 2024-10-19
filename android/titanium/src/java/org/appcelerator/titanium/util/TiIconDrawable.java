package org.appcelerator.titanium.util;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.text.TextPaint;

import androidx.annotation.NonNull;

import org.appcelerator.titanium.TiApplication;

public class TiIconDrawable extends Drawable
{

	Paint paint;
	String icon;
	int size = 64;
	private int alpha = 255;

	public TiIconDrawable(String icon, String fontFamily)
	{
		this.icon = icon;
		paint = new TextPaint();

		Typeface typeface = TiUIHelper.toTypeface(TiApplication.getAppRootOrCurrentActivity(), fontFamily);
		paint.setTypeface(typeface);
		paint.setStyle(Paint.Style.FILL);
		paint.setTextAlign(Paint.Align.CENTER);
		paint.setUnderlineText(false);
		paint.setColor(Color.WHITE);
		paint.setAntiAlias(true);
	}

	public static boolean isEnabled(int[] stateSet)
	{
		for (int state : stateSet)
			if (state == android.R.attr.state_enabled)
				return true;
		return false;
	}

	@Override
	public void draw(@NonNull Canvas canvas)
	{
		paint.setTextSize(getBounds().height());
		Rect textBounds = new Rect();
		String textValue = icon;
		paint.getTextBounds(textValue, 0, 1, textBounds);
		float textBottom = (getBounds().height() - textBounds.height()) / 2f + textBounds.height() - textBounds.bottom;

		canvas.drawText(textValue, getBounds().width() / 2f, textBottom, paint);
	}

	@Override
	public int getIntrinsicHeight()
	{
		return size;
	}

	@Override
	public int getIntrinsicWidth()
	{
		return size;
	}

	public TiIconDrawable color(int color)
	{
		paint.setColor(color);
		invalidateSelf();
		return this;
	}

	public TiIconDrawable colorRes(int colorRes)
	{
		paint.setColor(TiApplication.getAppRootOrCurrentActivity().getResources().getColor(colorRes));
		invalidateSelf();
		return this;
	}

	public TiIconDrawable alpha(int alpha)
	{
		setAlpha(alpha);
		invalidateSelf();
		return this;
	}

	@Override
	public int getOpacity()
	{
		return PixelFormat.OPAQUE;
	}

	@Override
	public boolean isStateful()
	{
		return true;
	}

	@Override
	public void setAlpha(int alpha)
	{
		this.alpha = alpha;
		paint.setAlpha(alpha);
	}

	@Override
	public void setColorFilter(ColorFilter cf)
	{
		paint.setColorFilter(cf);
	}

	@Override
	public void clearColorFilter()
	{
		paint.setColorFilter(null);
	}

	public void setStyle(Paint.Style style)
	{
		paint.setStyle(style);
	}
}
