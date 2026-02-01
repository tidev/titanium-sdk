/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Paint.Cap;
import android.graphics.Paint.Join;
import android.graphics.Path;
import android.view.View;

public class TiArrowView extends View
{

	private boolean leftArrow;
	private Path path;
	private Paint p;

	public TiArrowView(Context context)
	{
		super(context);
		leftArrow = true;
		setFocusable(false);
		setFocusableInTouchMode(false);
		if (android.os.Build.VERSION.SDK_INT < 28) {
			// The drawPath() method is only HW accelerated on Android 9.0 and higher.
			this.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
		}
		p = new Paint();
		configureDrawable();
	}

	public void setLeft(boolean leftArrow)
	{
		this.leftArrow = leftArrow;
		configureDrawable();
	}

	private void configureDrawable()
	{
		path = new Path();

		if (leftArrow) {
			path.moveTo(0.0f, 1.0f);
			path.lineTo(1.0f, 2.0f);
			path.lineTo(1.0f, 0.0f);
		} else {
			path.lineTo(1.0f, 1.0f);
			path.lineTo(0.0f, 2.0f);
			path.lineTo(0.0f, 0.0f);
		}
		path.close();

		setWillNotDraw(false);
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{

		setMeasuredDimension(getSuggestedMinimumWidth(), getSuggestedMinimumHeight());
	}

	@Override
	protected void onDraw(Canvas canvas)
	{
		super.onDraw(canvas);

		if (path != null) {
			int w = getWidth() / 2;
			int h = getHeight() / 2;
			canvas.save();
			canvas.scale(w, h);
			if (!leftArrow) {
				canvas.translate(1, 0);
			}

			p.setAntiAlias(false);
			p.setARGB(175, 216, 216, 216);
			p.setStyle(Paint.Style.FILL);
			canvas.drawPath(path, p);
			p.setARGB(75, 0, 0, 0);
			p.setStrokeWidth(0.1f);
			p.setStrokeJoin(Join.ROUND);
			p.setStrokeCap(Cap.ROUND);
			p.setAntiAlias(true);
			p.setStyle(Paint.Style.STROKE);
			canvas.drawPath(path, p);
			canvas.restore();
		}
	}
}
