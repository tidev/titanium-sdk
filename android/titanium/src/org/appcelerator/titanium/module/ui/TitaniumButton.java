/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumButton;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Message;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.ImageButton;

public class TitaniumButton extends TitaniumBaseNativeControl
	implements ITitaniumButton, OnClickListener
{
	private static final String LCAT = "TiButton";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CLICK = 300;

	public static final String CLICK_EVENT = "click";

	private String title; // Button text
	private String imagePath;
	private String backgroundImage;
	private String backgroundSelectedImage;
	private String backgroundFocusedImage;
	private String color;
	private String backgroundColor;
	private String fontSize;
	private String fontWeight;

	public TitaniumButton(TitaniumModuleManager tmm)
	{
		super(tmm);
		eventManager.supportEvent(CLICK_EVENT);
	}

	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		super.setLocalOptions(o);

		if (o.has("title")) {
			this.title = o.getString("title");
		}
		if (o.has("image")) {
			this.imagePath = o.getString("image");
		}
		if (o.has("backgroundImage")) {
			this.backgroundImage = o.getString("backgroundImage");
		}
		if (o.has("backgroundSelectedImage")) {
			this.backgroundSelectedImage = o.getString("backgroundSelectedImage");
		}
		if (o.has("backgroundFocusedImage")) {
			this.backgroundFocusedImage = o.getString("backgroundFocusedImage");
		}
		if (o.has("color")) {
			this.color = o.getString("color");
		}
		if (o.has("backgroundColor")) {
			this.backgroundColor = o.getString("backgroundColor");
		}
		if (o.has("fontSize")) {
			this.fontSize = o.getString("fontSize");
		}
		if (o.has("fontWeight")) {
			this.fontWeight = o.getString("fontWeight");
		}
	}

	private boolean isImageButton() {
		return (imagePath != null );
	}

	public void createControl(TitaniumModuleManager tmm)
	{
		Context context = tmm.getAppContext();
		if(!isImageButton()) {
			Button b = new Button(context);
			if (title != null && !isImageButton()) {
				b.setText(title);
			}

			if (color != null) {
				b.setTextColor(TitaniumColorHelper.parseColor(color));
			}

			if (backgroundColor != null) {
				b.setBackgroundColor(TitaniumColorHelper.parseColor(backgroundColor));
			}

			TitaniumUIHelper.styleText(b, fontSize, fontWeight);

			if (backgroundImage != null || backgroundSelectedImage != null || backgroundFocusedImage != null) {
/*				TitaniumFileHelper tfh = new TitaniumFileHelper(context);
				StateListDrawable bd = new StateListDrawable();
				if (backgroundFocusedImage != null) {
					Drawable d = tfh.loadDrawable(backgroundFocusedImage, false, true);
					if (d != null) {
						int[] ss = { android.R.attr.state_focused };
						bd.addState(ss, d);
					}
				}

				if (backgroundSelectedImage != null) {
					Drawable d = tfh.loadDrawable(backgroundSelectedImage, false, true);
					if (d != null) {
						int[] ss = { android.R.attr.state_pressed };
						bd.addState(ss, d);
						int[] ss1 = {android.R.attr.state_focused, android.R.attr.state_pressed };
						bd.addState(ss1, d);
					}
				}
				if (backgroundImage != null) {
					Drawable d = tfh.loadDrawable(backgroundImage, false, true);
					if (d != null) {
						int[] stateSet = { android.R.attr.state_enabled };
						bd.addState(stateSet, d);
					}
				}
*/				StateListDrawable bd = TitaniumUIHelper.buildBackgroundDrawable(context, backgroundImage, backgroundSelectedImage, backgroundFocusedImage);
				b.setBackgroundDrawable(bd);
			}
			control = b;
		} else {
			ImageButton b = new ImageButton(context);

			TitaniumFileHelper tfh = new TitaniumFileHelper(context);
			if (imagePath != null) {
				Drawable d = tfh.loadDrawable(imagePath, false);
				if (d != null) {
					b.setImageDrawable(d);
				} else {
					Log.w(LCAT, "Error loading image: " + imagePath);
				}
			}

			control = b;
		}
		control.setOnClickListener(this);
		control.isFocusable();
		control.setId(100);
	}

	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_CLICK) {
			eventManager.invokeSuccessListeners("click", null);
		}

		return super.handleMessage(msg);
	}

	public void onClick(View view) {
		handler.obtainMessage(MSG_CLICK).sendToTarget();
	}
}
