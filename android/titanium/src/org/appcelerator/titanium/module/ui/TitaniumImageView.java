/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumImageView;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Message;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ImageView.ScaleType;

public class TitaniumImageView extends TitaniumBaseView
	implements ITitaniumImageView, View.OnClickListener
{
	private static final String EVENT_CLICK = "click";

	private static final int MSG_CLICK = 500;

	private String url;
	private boolean scaleImage;
	private ImageView view;
	private Integer height;
	private Integer width;

	public TitaniumImageView(TitaniumModuleManager tmm) {
		super(tmm);

		eventManager.supportEvent(EVENT_CLICK);

		scaleImage = false;
	}

	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = super.handleMessage(msg);

		if (!handled) {
			switch(msg.what) {
				case MSG_CLICK : {
					eventManager.invokeSuccessListeners(EVENT_CLICK, "{}");
					handled = true;
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
		if (o.has("scale")) {
			scaleImage = o.getBoolean("scale");
		}
		if (o.has("height")) {
			height = o.getInt("height");
		}
		if (o.has("width")) {
			width = o.getInt("width");
		}
	}

	@Override
	protected void doOpen()
	{
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		setLayoutParams(params);
		//setBackgroundColor(Color.BLUE);

		view = new ImageView(getContext());
		//view.setBackgroundColor(Color.RED);

		if (scaleImage) {
			view.setAdjustViewBounds(true);
			view.setScaleType(ScaleType.CENTER_INSIDE);
		} else {
			view.setScaleType(ScaleType.CENTER);
		}

		setOnClickListener(this);

		TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getAppContext());

		Drawable d = tfh.loadDrawable(url, false);
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

			view.setImageDrawable(d);
		}
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

	public void setScale(boolean scale) {
		this.scaleImage = scale;
	}

	public void setURL(String url) {
		this.url = url;
	}

	public void onClick(View view) {
		handler.sendEmptyMessage(MSG_CLICK);
	}
}
