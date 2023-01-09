package ti.modules.titanium.ui;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.style.ReplacementSpan;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

public class AttributedStringRoundBackground extends ReplacementSpan
{

	private static int cornerRadius = 12;

	int paddingTop = 2;
	int paddingRight = 8;
	int paddingBottom = 2;
	int paddingLeft = 8;

	private static final float MAGIC_NUMBER = convertDptoPx(2);

	private final int mBackgroundColor;
	private final int mTextColor;
	private final float mTextSize;

	/**
	 * @param backgroundColor color value, not res id
	 * @param textSize        in pixels
	 */
	public AttributedStringRoundBackground(int backgroundColor, int textColor, int radius,
										   float textSize, KrollDict padding)
	{
		if (padding != null) {
			paddingLeft = convertDptoPx(TiConvert.toInt(padding.get(TiC.PROPERTY_LEFT), paddingLeft));
			paddingTop = convertDptoPx(TiConvert.toInt(padding.get(TiC.PROPERTY_TOP), paddingTop));
			paddingRight = convertDptoPx(TiConvert.toInt(padding.get(TiC.PROPERTY_RIGHT), paddingRight));
			paddingBottom = convertDptoPx(TiConvert.toInt(padding.get(TiC.PROPERTY_BOTTOM), paddingBottom));
		}
		cornerRadius = convertDptoPx(radius);
		mBackgroundColor = backgroundColor;
		mTextColor = textColor;
		mTextSize = convertDptoPx((int) textSize);
	}

	public static int convertDptoPx(int dp)
	{
		float scale = TiApplication.getAppCurrentActivity().getResources().getDisplayMetrics().density;
		return (int) (dp * scale + 0.5f);
	}

	@Override
	public void draw(Canvas canvas, CharSequence text, int start, int end,
					 float x, int top, int y, int bottom, Paint paint)
	{
		paint = new Paint(paint); // make a copy for not editing the referenced paint

		paint.setTextSize(mTextSize);

		// Draw the rounded background
		paint.setColor(mBackgroundColor);
		//float textHeightWrapping = convertDptoPx(4);
		float tagBottom = top + paddingTop + mTextSize + paddingBottom;
		float tagRight = x + getTagWidth(text, start, end, paint);
		RectF rect = new RectF(x, top - paddingTop - paddingBottom, tagRight, tagBottom);
		canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint);

		// Draw the text
		paint.setColor(mTextColor);
		canvas.drawText(text, start, end, x + paddingLeft,
			tagBottom - paddingBottom - paddingTop - MAGIC_NUMBER, paint);
	}

	private int getTagWidth(CharSequence text, int start, int end, Paint paint)
	{
		return Math.round(paddingLeft + paint.measureText(text.subSequence(start, end).toString()) + paddingRight);
	}

	@Override
	public int getSize(Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm)
	{
		paint = new Paint(paint); // make a copy for not editing the referenced paint
		paint.setTextSize(mTextSize);
		return getTagWidth(text, start, end, paint);
	}
}
