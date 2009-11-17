/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumImageView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.AsyncTask;
import android.os.Message;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.URLUtil;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.ZoomControls;
import android.widget.ImageView.ScaleType;

public class TitaniumImageView extends TitaniumBaseView
	implements ITitaniumImageView
{
	private static final String LCAT = "TiImageView";

	private static final int CONTROL_TIMEOUT = 4000;

	private static final String EVENT_CLICK = "click";

	private static final int MSG_CLICK = 500;
	private static final int MSG_SCALE_UP = 501;
	private static final int MSG_SCALE_DOWN = 502;
	private static final int MSG_CONFIGURATION_CHANGE = 503;
	private static final int MSG_HIDE_CONTROLS = 504;
	private static final int MSG_LOAD_URL = 505;

	private String url;
	private boolean canScaleImage;
	private ImageView view;
	private Integer height;
	private Integer width;
	private String backgroundColor;

	private GestureDetector gestureDetector;

	private ZoomControls zoomControls;
	private float scaleFactor;
	private float originalScaleFactor;
	private float scaleIncrement;
	private float scaleMin;
	private float scaleMax;

	private Matrix baseMatrix;
	private Matrix changeMatrix;

	public TitaniumImageView(TitaniumModuleManager tmm) {
		super(tmm);

		eventManager.supportEvent(EVENT_CLICK);

		canScaleImage = false;
		scaleFactor = 1.0f;
		originalScaleFactor = scaleFactor;
		scaleIncrement = 0.1f;
		scaleMin = 1.0f;
		scaleMax = 5.0f;

		baseMatrix = new Matrix();
		changeMatrix = new Matrix();
	}

	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = super.handleMessage(msg);

		if (!handled) {
			switch(msg.what) {
				case MSG_CLICK : {
					boolean sendClick = true;
					if (canScaleImage) {
						if (zoomControls.getVisibility() != View.VISIBLE) {
							sendClick = false;
							manageControls();
							zoomControls.setVisibility(View.VISIBLE);
						}
						scheduleControlTimeout();
					}
					if (sendClick) {
						eventManager.invokeSuccessListeners(EVENT_CLICK, "{}");
					}
					handled = true;
					break;
				}
				case MSG_SCALE_UP : {
					if (scaleFactor < scaleMax) {
						onViewChanged(scaleIncrement);
					}
					handled = true;
					break;
				}
				case MSG_SCALE_DOWN : {
					if (scaleFactor > scaleMin) {
						onViewChanged(-scaleIncrement);
					}
					handled = true;
					break;
				}
				case MSG_CONFIGURATION_CHANGE : {
					computeBaseMatrix();
					handled = true;
					break;
				}
				case MSG_HIDE_CONTROLS : {
					zoomControls.setVisibility(View.GONE);
					handled = true;
					break;
				}
				case MSG_LOAD_URL : {
					zoomControls.setVisibility(View.GONE);
					loadImageFromUrl();
					requestLayout();
					handled = true;
					break;
				}
			}
		}

		return handled;
	}

	@Override
	protected void processLocalOptions(JSONObject o) throws JSONException
	{
		if (o.has("url")) {
			url = o.getString("url");
		}
		if (o.has("canScale")) {
			canScaleImage = o.getBoolean("canScale");
		}
		if (o.has("height")) {
			height = o.getInt("height");
		}
		if (o.has("width")) {
			width = o.getInt("width");
		}
		if (o.has("backgroundColor")) {
			backgroundColor = o.getString("backgroundColor");
		}
	}

	@Override
	protected void doOpen()
	{
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		setLayoutParams(params);

		view = new ImageView(getContext());
		if (backgroundColor != null) {
			int c = TitaniumColorHelper.parseColor(backgroundColor);
			view.setBackgroundColor(c);
		}

		if (canScaleImage) {
			view.setAdjustViewBounds(true);
			view.setScaleType(ScaleType.CENTER);
		} else {
			view.setScaleType(ScaleType.CENTER);
		}

		loadImageFromUrl();

		gestureDetector = new GestureDetector(getContext(),
			new GestureDetector.SimpleOnGestureListener()
			{

				@Override
				public boolean onDown(MotionEvent e) {
					if (zoomControls.getVisibility() == View.VISIBLE) {
						super.onDown(e);
						return true;
					} else {
						handler.sendEmptyMessage(MSG_CLICK);
						return false;
					}
				}

				@Override
				public boolean onScroll(MotionEvent e1, MotionEvent e2, float dx, float dy)
				{
					if (zoomControls.getVisibility() == View.VISIBLE) {
						changeMatrix.postTranslate(-dx,-dy);
						view.setImageMatrix(getViewMatrix());
						requestLayout();
						scheduleControlTimeout();
						return true;
					} else {
						return false;
					}
				}

				@Override
				public boolean onSingleTapConfirmed(MotionEvent e) {
					handler.sendEmptyMessage(MSG_CLICK);
					return super.onSingleTapConfirmed(e);
				}
			}
		);
		gestureDetector.setIsLongpressEnabled(false);
	}

	@Override
	protected void doPostOpen() {
		super.doPostOpen();

		zoomControls = new ZoomControls(getContext());
		zoomControls.setVisibility(View.GONE);
		zoomControls.setZoomSpeed(75);
		zoomControls.setOnZoomInClickListener(new OnClickListener(){

			public void onClick(View v) {
				handler.sendEmptyMessage(MSG_SCALE_UP);
			}});
		zoomControls.setOnZoomOutClickListener(new OnClickListener(){

			public void onClick(View v) {
				handler.sendEmptyMessage(MSG_SCALE_DOWN);
			}});

		RelativeLayout rl = new RelativeLayout(getContext());
		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT,LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
		params.addRule(RelativeLayout.CENTER_HORIZONTAL);
		rl.addView(zoomControls, params);
		addView(rl, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
	}

	private void loadImageFromUrl() {

		Log.i(LCAT, "Loading image: " + url);
		if (URLUtil.isNetworkUrl(url)) {
			Drawable ld = new BitmapDrawable(getClass().getResourceAsStream("/org/appcelerator/titanium/res/drawable/photoDefault.png"));
			if (ld != null) {
				view.setImageDrawable(ld);
			}
		}

		AsyncTask<String, Long, Drawable> task = new AsyncTask<String, Long, Drawable>()
		{

			@Override
			protected Drawable doInBackground(String... arg) {
				TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getAppContext());
				Drawable d = tfh.loadDrawable(arg[0], false);
				if (d != null) {
					BitmapDrawable bd = (BitmapDrawable) d;
					int w = bd.getBitmap().getWidth();
					int h = bd.getBitmap().getHeight();

					if (height != null || width != null) {
						if (width != null) {
							w = width;
						}
						if (height != null) {
							h = height;
						}
						Bitmap b = Bitmap.createScaledBitmap(bd.getBitmap(), w, h, true);
						d = new BitmapDrawable(b);
					}

				} else {
					Log.w(LCAT, "Unable to load image from " + url);
				}
				return d;
			}

			@Override
			protected void onPostExecute(Drawable d) {
				if (d != null) {
					view.setImageDrawable(d);
					scaleFactor = originalScaleFactor;
					updateChangeMatrix(0);
				}

				super.onPostExecute(d);
			}
		};
		task.execute(url);

	}

	private void manageControls() {
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

	private void onViewChanged(float dscale) {
		updateChangeMatrix(dscale);
		manageControls();
		requestLayout();
		scheduleControlTimeout();
	}

	private void computeBaseMatrix()
	{
		Drawable d = view.getDrawable();
		baseMatrix.reset();

		if (d != null) {
			// The base matrix is the matrix that displays the entire image bitmap
			// if the bitmap is smaller than the display, then it simply centers
			// the image on the display. Otherwise, it computes an aspect ratio
			// preserving matrix that will fit the image to the view.

			Rect r = new Rect();
			view.getDrawingRect(r);
			int dwidth = d.getIntrinsicWidth();
			int dheight = d.getIntrinsicHeight();

			float vwidth = view.getWidth() - view.getPaddingLeft() - view.getPaddingRight();
			float vheight = view.getHeight() - view.getPaddingTop() - view.getPaddingBottom();

			float widthScale = Math.min(vwidth/dwidth, 1.0f);
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
		changeMatrix.postScale(scaleFactor, scaleFactor, getWidth()/2, getHeight()/2);
	}

	private Matrix getViewMatrix() {
		Matrix m = new Matrix(baseMatrix);
		m.postConcat(changeMatrix);
		return m;
	}

	private void scheduleControlTimeout() {
		handler.removeMessages(MSG_HIDE_CONTROLS);
		handler.sendEmptyMessageDelayed(MSG_HIDE_CONTROLS, CONTROL_TIMEOUT);
	}

	@Override
	public void dispatchConfigurationChange(Configuration newConfig) {
		super.dispatchConfigurationChange(newConfig);

		handler.sendEmptyMessage(MSG_CONFIGURATION_CHANGE);
	}

	@Override
	public boolean onTouchEvent(MotionEvent ev) {
		boolean handled = false;
		if (canScaleImage) {
			if(zoomControls.getVisibility() == View.VISIBLE) {
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
	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
	{
		super.onLayout(changed, left, top, right, bottom);

		computeBaseMatrix();
		view.setImageMatrix(getViewMatrix());
	}

	@Override
	protected View getContentView() {
		return view;
	}

	@Override
	protected LayoutParams getContentLayoutParams()
	{
		return new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT);
	}

	public void setCanScale(boolean canScale) {
		this.canScaleImage = canScale;
	}

	public void setURL(String url) {
		this.url = url;
		if (hasBeenOpened) {
			handler.sendEmptyMessage(MSG_LOAD_URL);
		}
	}
}
