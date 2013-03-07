/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.ColorFilter;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ImageView.ScaleType;
import android.widget.ZoomControls;

public class TiImageView extends ViewGroup implements Handler.Callback, OnClickListener
{
	private static final String TAG = "TiImageView";

	private static final int CONTROL_TIMEOUT = 4000;
	private static final int MSG_HIDE_CONTROLS = 500;

	private Handler handler;

	private OnClickListener clickListener;

	private boolean canScaleImage;
	private boolean enableZoomControls;

	private GestureDetector gestureDetector;
	private ImageView imageView;
	private ZoomControls zoomControls;

	private float scaleFactor;
	private float scaleIncrement;
	private float scaleMin;
	private float scaleMax;

	private Matrix baseMatrix;
	private Matrix changeMatrix;

	// Flags to help determine whether width/height is defined, so we can scale appropriately
	private boolean viewWidthDefined;
	private boolean viewHeightDefined;

	public TiImageView(Context context) {
		super(context);

		final TiImageView me = this;

		handler = new Handler(Looper.getMainLooper(), this);

		enableZoomControls = false;
		scaleFactor = 1.0f;
		scaleIncrement = 0.1f;
		scaleMin = 1.0f;
		scaleMax = 5.0f;

		baseMatrix = new Matrix();
		changeMatrix = new Matrix();

		imageView = new ImageView(context);
		addView(imageView);
		setCanScaleImage(true);

		gestureDetector = new GestureDetector(getContext(), new GestureDetector.SimpleOnGestureListener()
		{
			@Override
			public boolean onDown(MotionEvent e)
			{
				if (zoomControls.getVisibility() == View.VISIBLE) {
					super.onDown(e);
					return true;
				} else {
					onClick(me);
					return false;
				}
			}

			@Override
			public boolean onScroll(MotionEvent e1, MotionEvent e2, float dx, float dy)
			{
				if (zoomControls.getVisibility() == View.VISIBLE) {
					changeMatrix.postTranslate(-dx, -dy);
					imageView.setImageMatrix(getViewMatrix());
					requestLayout();
					scheduleControlTimeout();
					return true;
				} else {
					return false;
				}
			}

			@Override
			public boolean onSingleTapConfirmed(MotionEvent e)
			{
				onClick(me);
				return super.onSingleTapConfirmed(e);
			}
		});
		gestureDetector.setIsLongpressEnabled(false);

		zoomControls = new ZoomControls(context);
		addView(zoomControls);
		zoomControls.setVisibility(View.GONE);
		zoomControls.setZoomSpeed(75);
		zoomControls.setOnZoomInClickListener(new OnClickListener()
		{
			public void onClick(View v)
			{
				handleScaleUp();
			}
		});
		zoomControls.setOnZoomOutClickListener(new OnClickListener()
		{
			public void onClick(View v)
			{
				handleScaleDown();
			}
		});

		super.setOnClickListener(this);
	}

	public void setCanScaleImage(boolean canScaleImage)
	{
		this.canScaleImage = canScaleImage;
		updateScaleType();
	}

	public void setEnableZoomControls(boolean enableZoomControls)
	{
		this.enableZoomControls = enableZoomControls;
		updateScaleType();
	}

	public Drawable getImageDrawable() {
		return imageView.getDrawable();
	}

	/**
	 * Sets a Bitmap as the content of imageView
	 * @param bitmap The bitmap to set. If it is null, it will clear the previous image and show it as blank.
	 */
	public void setImageBitmap(Bitmap bitmap) {
		imageView.setImageBitmap(bitmap);
	}

	public void setOnClickListener(OnClickListener clickListener)
	{
		this.clickListener = clickListener;
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_HIDE_CONTROLS: {
				handleHideControls();
				return true;
			}
		}
		return false;
	}

	public void onClick(View view)
	{
		boolean sendClick = true;
		if (enableZoomControls) {
			if (zoomControls.getVisibility() != View.VISIBLE) {
				sendClick = false;
				manageControls();
				zoomControls.setVisibility(View.VISIBLE);
			}
			scheduleControlTimeout();
		}
		if (sendClick && clickListener != null) {
			clickListener.onClick(view);
		}
	}

	private void handleScaleUp()
	{
		if (scaleFactor < scaleMax) {
			onViewChanged(scaleIncrement);
		}
	}

	private void handleScaleDown()
	{
		if (scaleFactor > scaleMin) {
			onViewChanged(-scaleIncrement);
		}
	}

	private void handleHideControls()
	{
		zoomControls.setVisibility(View.GONE);
	}

	private void manageControls()
	{
		if (scaleFactor == scaleMax) {
			zoomControls.setIsZoomInEnabled(false);
		} else {
			zoomControls.setIsZoomInEnabled(true);
		}

		if (scaleFactor == scaleMin) {
			zoomControls.setIsZoomOutEnabled(false);
		} else {
			zoomControls.setIsZoomOutEnabled(true);
		}
	}

	private void onViewChanged(float dscale)
	{
		updateChangeMatrix(dscale);
		manageControls();
		requestLayout();
		scheduleControlTimeout();
	}

	private void computeBaseMatrix()
	{
		Drawable d = imageView.getDrawable();
		baseMatrix.reset();

		if (d != null) {
			// The base matrix is the matrix that displays the entire image bitmap
			// if the bitmap is smaller than the display, then it simply centers
			// the image on the display. Otherwise, it computes an aspect ratio
			// preserving matrix that will fit the image to the view.

			Rect r = new Rect();
			getDrawingRect(r);
			int dwidth = d.getIntrinsicWidth();
			int dheight = d.getIntrinsicHeight();

			float vwidth = getWidth() - getPaddingLeft() - getPaddingRight();
			float vheight = getHeight() - getPaddingTop() - getPaddingBottom();

			float widthScale = Math.min(vwidth / dwidth, 1.0f);
			float heightScale = Math.min(vheight / dheight, 1.0f);
			float scale = Math.min(widthScale, heightScale);

			baseMatrix.setScale(scale, scale);

			float dx = (vwidth - dwidth * scale) * 0.5f;
			float dy = (vheight - dheight * scale) * 0.5f;

			baseMatrix.postTranslate(dx, dy);

		}
	}

	private void updateChangeMatrix(float dscale)
	{
		changeMatrix.reset();
		scaleFactor += dscale;
		scaleFactor = Math.max(scaleFactor, scaleMin);
		scaleFactor = Math.min(scaleFactor, scaleMax);
		changeMatrix.postScale(scaleFactor, scaleFactor, getWidth() / 2, getHeight() / 2);
	}

	private Matrix getViewMatrix()
	{
		Matrix m = new Matrix(baseMatrix);
		m.postConcat(changeMatrix);
		return m;
	}

	private void scheduleControlTimeout()
	{
		handler.removeMessages(MSG_HIDE_CONTROLS);
		handler.sendEmptyMessageDelayed(MSG_HIDE_CONTROLS, CONTROL_TIMEOUT);
	}

	@Override
	public boolean onTouchEvent(MotionEvent ev)
	{
		boolean handled = false;
		if (enableZoomControls) {
			if (zoomControls.getVisibility() == View.VISIBLE) {
				zoomControls.onTouchEvent(ev);
			}
			handled = gestureDetector.onTouchEvent(ev);
		}
		if (!handled) {
			handled = super.onTouchEvent(ev);
		}
		return handled;
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		super.onMeasure(widthMeasureSpec, heightMeasureSpec);

		int maxWidth = 0;
		int maxHeight = 0;

//		if (DBG) {
//			int w = MeasureSpec.getSize(widthMeasureSpec);
//			int wm = MeasureSpec.getMode(widthMeasureSpec);
//			int h = MeasureSpec.getSize(heightMeasureSpec);
//			int hm = MeasureSpec.getMode(heightMeasureSpec);
//
//			Log.i(LCAT, "w: " + w + " wm: " + wm + " h: " + h + " hm: " + hm);
//		}

		// TODO padding and margins

		measureChild(imageView, widthMeasureSpec, heightMeasureSpec);

		maxWidth = Math.max(maxWidth, imageView.getMeasuredWidth());
		maxHeight = Math.max(maxHeight, imageView.getMeasuredHeight());

		// Allow for zoom controls.
		if (enableZoomControls) {
			measureChild(zoomControls, widthMeasureSpec, heightMeasureSpec);
			maxWidth = Math.max(maxWidth, zoomControls.getMeasuredWidth());
			maxHeight = Math.max(maxHeight, zoomControls.getMeasuredHeight());
		}

		setMeasuredDimension(resolveSize(maxWidth, widthMeasureSpec), resolveSize(maxHeight, heightMeasureSpec));
	}

	@Override
	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
	{
		computeBaseMatrix();
		imageView.setImageMatrix(getViewMatrix());

		int parentLeft = 0;
		int parentRight = right - left;
		int parentTop = 0;
		int parentBottom = bottom - top;

		// imageView.layout(parentLeft, parentTop, imageView.getMeasuredWidth(), imageView.getMeasuredHeight());
		imageView.layout(parentLeft, parentTop, parentRight, parentBottom);
		if (enableZoomControls && zoomControls.getVisibility() == View.VISIBLE) {
			int zoomWidth = zoomControls.getMeasuredWidth();
			int zoomHeight = zoomControls.getMeasuredHeight();
			zoomControls.layout(parentRight - zoomWidth, parentBottom - zoomHeight, parentRight, parentBottom);
		}
	}

	public void setColorFilter(ColorFilter filter)
	{
		imageView.setColorFilter(filter);
	}

	private void updateScaleType()
	{
		if (enableZoomControls) {
			imageView.setAdjustViewBounds(true);
			imageView.setScaleType(ScaleType.MATRIX);
		} else {
			if (viewWidthDefined && viewHeightDefined) {
				imageView.setAdjustViewBounds(false);
				imageView.setScaleType(ScaleType.FIT_XY);
			} else if (!canScaleImage) {
				imageView.setAdjustViewBounds(false);
				imageView.setScaleType(ScaleType.CENTER);
			} else {
				imageView.setAdjustViewBounds(true);
				imageView.setScaleType(ScaleType.FIT_CENTER);
			}
		}
		requestLayout();
	}

	public void setWidthDefined(boolean defined)
	{
		viewWidthDefined = defined;
		updateScaleType();
	}

	public void setHeightDefined(boolean defined)
	{
		viewHeightDefined = defined;
		updateScaleType();
	}
}
