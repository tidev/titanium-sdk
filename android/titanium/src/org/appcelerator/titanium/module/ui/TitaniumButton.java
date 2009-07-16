package org.appcelerator.titanium.module.ui;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumButton;
import org.appcelerator.titanium.api.ITitaniumNativeControl;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.AbsoluteLayout;
import android.widget.Button;
import android.widget.ImageButton;

public class TitaniumButton implements ITitaniumButton, ITitaniumNativeControl, Handler.Callback, OnClickListener
{
	private static final String LCAT = "TiButton";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_LAYOUT = 300;
	private static final int MSG_CLICK = 301;

	public static final String CLICK_EVENT = "click";

	private SoftReference<TitaniumModuleManager> softModuleMgr;
	private Handler handler;
	private TitaniumJSEventManager eventManager;

	private String id; // HTML element id
	private String title; // Button text
	private String imagePath;
	private Integer width;
	private Integer height;
	private String backgroundImage;
	private String color;
	private String backgroundColor;

	private View control;

	public TitaniumButton(TitaniumModuleManager tmm)
	{
		tmm.checkThread();
		this.softModuleMgr = new SoftReference<TitaniumModuleManager>(tmm);
		this.handler = new Handler(this);
		this.eventManager = new TitaniumJSEventManager(tmm);

		eventManager.supportEvent(CLICK_EVENT);
	}

	public void setOptions(String json)
	{
		try {
			JSONObject o = new JSONObject(json);

			if (o.has("id")) {
				this.id = o.getString("id");
			}
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
			if (o.has("width")) {
				this.width = new Integer(o.getInt("width"));
			}
			if (o.has("height")) {
				this.height = new Integer(o.getInt("height"));
			}

		} catch (JSONException e) {
			Log.e(LCAT, "Error setting option from JSON: ", e);
		}
	}

	public int addEventListener(String eventName, String listener) {
		return eventManager.addListener(eventName, listener);
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

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
	}

	public String getHtmlId() {
		return id;
	}

	public void handleLayoutRequest(Bundle position) {
		handler.obtainMessage(MSG_LAYOUT, position).sendToTarget();
	}

	public boolean handleMessage(Message msg) {
		if (msg.what == MSG_LAYOUT) {
			Bundle position = (Bundle) msg.obj;
			int left = position.getInt("left");
			int top = position.getInt("top");

			int w = -1;
			int h = -1;
			if (width == null) {
				w = position.getInt("width");
			} else {
				w = width;
			}
			if (height == null) {
				h = position.getInt("height");
			} else {
				h = height;
			}

			if (DBG) {
				StringBuilder sb = new StringBuilder();
				sb.append("Updating control position")
				 .append(" id : ").append(id)
				 .append(" left: ").append(left)
				 .append(" top: ").append(top)
				 .append(" width: ").append(w)
				 .append(" height: ").append(h)
				 ;
				Log.d(LCAT, sb.toString());
			}
			AbsoluteLayout.LayoutParams params = new AbsoluteLayout.LayoutParams(w, h, left, top);
			control.setLayoutParams(params);

			return true;
		} else if (msg.what == MSG_CLICK) {
			eventManager.invokeSuccessListeners("click", null);
		}
		return false;
	}

	public void onClick(View view) {
		handler.obtainMessage(MSG_CLICK).sendToTarget();
	}
}
