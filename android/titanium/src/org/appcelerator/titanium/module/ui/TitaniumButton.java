package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumButton;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.drawable.Drawable;
import android.os.Message;
import android.util.Log;
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
	private String color;
	private String backgroundColor;

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
		if (o.has("color")) {
			this.color = o.getString("color");
		}
		if (o.has("backgroundColor")) {
			this.backgroundColor = o.getString("backgroundColor");
		}
	}

	private boolean isImageButton() {
		return (imagePath != null || backgroundImage != null);
	}

	public void open(String json) {
		TitaniumModuleManager ttm = softModuleMgr.get();
		if (ttm != null && control == null) {
			if(!isImageButton()) {
				Button b = new Button(ttm.getActivity());
				if (title != null && !isImageButton()) {
					b.setText(title);
				}

				if (color != null) {
					b.setTextColor(TitaniumColorHelper.parseColor(color));
				}

				if (backgroundColor != null) {
					b.setBackgroundColor(TitaniumColorHelper.parseColor(backgroundColor));
				}
				control = b;
			} else {
				ImageButton b = new ImageButton(ttm.getActivity());

				TitaniumFileHelper tfh = new TitaniumFileHelper(ttm.getActivity());
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

			if (id != null) {
				TitaniumWebView wv = ttm.getActivity().getWebView();
				if (wv != null) {
					wv.addListener(this); //TODO consider needing an immediate layout.
					wv.addControl(control);
				} else {
					Log.e(LCAT, "No webview, control not added");
				}
			}
		}
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
