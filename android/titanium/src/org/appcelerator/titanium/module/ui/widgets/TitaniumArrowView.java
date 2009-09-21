package org.appcelerator.titanium.module.ui.widgets;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Path;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.PathShape;
import android.widget.ImageView;

public class TitaniumArrowView extends ImageView
{

	private boolean leftArrow;
	private ShapeDrawable drawable;

	public TitaniumArrowView(Context context) {
		super(context);
		leftArrow = true;
		setFocusable(false);
		setFocusableInTouchMode(false);
		configureDrawable();
	}

	public void setLeft(boolean leftArrow) {
		this.leftArrow = leftArrow;
		configureDrawable();
	}

	private void configureDrawable() {
		Path path = new Path();

		if (leftArrow) {
			path.moveTo(0.0f, 1.0f);
			path.lineTo(1.0f, 2.0f);
			path.lineTo(1.0f, 0.0f);
			path.close();
		} else {
			path.lineTo(1.0f, 1.0f);
			path.lineTo(0.0f, 2.0f);
			path.lineTo(0.0f, 0.0f);
			path.close();
		}

		drawable = new ShapeDrawable(new PathShape(path, 1, 2));
		drawable.getPaint().setARGB(150, 255, 255, 255);
		setImageDrawable(drawable);
		//setPadding(5,0,5,0);
	}

	@Override
	protected void onDraw(Canvas canvas) {
		super.onDraw(canvas);

		if (drawable != null) {
			drawable.draw(canvas);
		}
	}
}
