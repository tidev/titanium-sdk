/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumNativeControl;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.view.View;
import android.view.View.OnFocusChangeListener;
import android.view.inputmethod.InputMethodManager;
import android.widget.AbsoluteLayout;

public abstract class TitaniumBaseNativeControl
	implements ITitaniumNativeControl, Handler.Callback, OnFocusChangeListener
{
	private static final String LCAT = "TiBaseNativeCtrl";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final String FOCUS_EVENT = "focus";
	protected static final String BLUR_EVENT = "blur";

	// Keep event ids below 300
	protected static final int MSG_LAYOUT = 200;
	protected static final int MSG_FOCUSCHANGE = 201;
	protected static final int MSG_FOCUS = 202;
	protected static final int MSG_BLUR = 203;
	protected static final int MSG_OPEN = 204;

	protected SoftReference<TitaniumModuleManager> softModuleMgr;
	protected Handler handler;
	protected TitaniumJSEventManager eventManager;

	protected String id; // HTML Element ID
	protected Integer width;
	protected Integer height;

	protected View control;

	protected TitaniumBaseNativeControl(TitaniumModuleManager tmm) {
		tmm.checkThread();
		this.softModuleMgr = new SoftReference<TitaniumModuleManager>(tmm);
		this.handler = new Handler(this);
		this.eventManager = new TitaniumJSEventManager(tmm);
		eventManager.supportEvent(FOCUS_EVENT);
		eventManager.supportEvent(BLUR_EVENT);
	}

	public int addEventListener(String eventName, String listener) {
		return eventManager.addListener(eventName, listener);
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
		switch (msg.what) {
			case MSG_LAYOUT : {
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
			}
			case MSG_FOCUSCHANGE : {
				boolean hasFocus = (Boolean) msg.obj;
				if (hasFocus) {
					eventManager.invokeSuccessListeners(FOCUS_EVENT, null);
				} else {
					eventManager.invokeSuccessListeners(BLUR_EVENT, null);
				}
				return false;
			}
			case MSG_FOCUS : {
				if (control != null) {
					control.requestFocus();
				}
				return false;
			}
			case MSG_BLUR : {
				if (control != null) {
			        InputMethodManager imm = getIMM();
			        if (imm != null) {
			        	imm.hideSoftInputFromWindow(control.getWindowToken(), 0);
			        }
					control.clearFocus();
				}
				return false;
			}
			case MSG_OPEN : {
				TitaniumModuleManager tmm = softModuleMgr.get();
				if (tmm != null && control == null) {

					createControl(tmm);

					if (control != null && id != null) {
						TitaniumWebView wv = tmm.getWebView();
						if (wv != null) {
							//TODO: POSSIBLE LEAK
							wv.addListener(this);
							control.setOnFocusChangeListener(this);
							wv.addControl(control);
						} else {
							Log.e(LCAT, "No webview, control not added");
						}
					}
				}
				return true;
			}
		}

		return false;
	}

	public void focus() {
		handler.obtainMessage(MSG_FOCUS).sendToTarget();
	}

	public void blur() {
		handler.obtainMessage(MSG_BLUR).sendToTarget();
	}

	protected InputMethodManager getIMM() {
		InputMethodManager imm = null;
		TitaniumModuleManager tmm = softModuleMgr.get();
		if (tmm != null) {
			imm = (InputMethodManager) tmm.getAppContext().getSystemService(Context.INPUT_METHOD_SERVICE);
		}
		return imm;
	}

	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		if (o.has("id")) {
			this.id = o.getString("id");
		}
		if (o.has("width")) {
			this.width = new Integer(o.getInt("width"));
		}
		if (o.has("height")) {
			this.height = new Integer(o.getInt("height"));
		}
	}

	public void setOptions(String json)
	{
		Log.e(LCAT, json);

		try {
			JSONObject o = new JSONObject(json);

			setLocalOptions(o);

		} catch (JSONException e) {
			Log.e(LCAT, "Error setting option from JSON: ", e);
		}
	}

	// Added for controls using TitaniumMethod, because of bridge issues w/
	// polymorphism

	public void setControlOptions(JSONObject o)
		throws JSONException
	{
		setLocalOptions(o);
	}

	public void open()
	{
		handler.obtainMessage(MSG_OPEN).sendToTarget();
	}

	public void onFocusChange(View view, boolean hasFocus) {
		handler.obtainMessage(MSG_FOCUSCHANGE, new Boolean(hasFocus)).sendToTarget();
	}

	public abstract void createControl(TitaniumModuleManager tmm);
}
