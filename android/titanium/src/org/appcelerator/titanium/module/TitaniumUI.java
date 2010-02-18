/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumButton;
import org.appcelerator.titanium.api.ITitaniumCompositeView;
import org.appcelerator.titanium.api.ITitaniumDatePicker;
import org.appcelerator.titanium.api.ITitaniumDialog;
import org.appcelerator.titanium.api.ITitaniumEmailDialog;
import org.appcelerator.titanium.api.ITitaniumImageView;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumMapView;
import org.appcelerator.titanium.api.ITitaniumMenuItem;
import org.appcelerator.titanium.api.ITitaniumModalDatePicker;
import org.appcelerator.titanium.api.ITitaniumModalPicker;
import org.appcelerator.titanium.api.ITitaniumNotifier;
import org.appcelerator.titanium.api.ITitaniumPicker;
import org.appcelerator.titanium.api.ITitaniumProgressDialog;
import org.appcelerator.titanium.api.ITitaniumScrollableView;
import org.appcelerator.titanium.api.ITitaniumSlider;
import org.appcelerator.titanium.api.ITitaniumSwitch;
import org.appcelerator.titanium.api.ITitaniumTableView;
import org.appcelerator.titanium.api.ITitaniumText;
import org.appcelerator.titanium.api.ITitaniumUI;
import org.appcelerator.titanium.api.ITitaniumUIWebView;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.api.ITitaniumUserWindowBuilder;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.module.map.TitaniumMapView;
import org.appcelerator.titanium.module.ui.TitaniumButton;
import org.appcelerator.titanium.module.ui.TitaniumCompositeView;
import org.appcelerator.titanium.module.ui.TitaniumDatePicker;
import org.appcelerator.titanium.module.ui.TitaniumDatePickerDialog;
import org.appcelerator.titanium.module.ui.TitaniumDialog;
import org.appcelerator.titanium.module.ui.TitaniumEmailDialog;
import org.appcelerator.titanium.module.ui.TitaniumImageView;
import org.appcelerator.titanium.module.ui.TitaniumMenuItem;
import org.appcelerator.titanium.module.ui.TitaniumPicker;
import org.appcelerator.titanium.module.ui.TitaniumPickerDialog;
import org.appcelerator.titanium.module.ui.TitaniumProgressDialog;
import org.appcelerator.titanium.module.ui.TitaniumScrollableView;
import org.appcelerator.titanium.module.ui.TitaniumSlider;
import org.appcelerator.titanium.module.ui.TitaniumSwitch;
import org.appcelerator.titanium.module.ui.TitaniumTableView;
import org.appcelerator.titanium.module.ui.TitaniumText;
import org.appcelerator.titanium.module.ui.TitaniumTextField;
import org.appcelerator.titanium.module.ui.TitaniumToastNotifier;
import org.appcelerator.titanium.module.ui.TitaniumUIWebView;
import org.appcelerator.titanium.module.ui.TitaniumUserWindowBuilder;
import org.appcelerator.titanium.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Handler;
import android.os.Message;
import android.webkit.WebView;

public class TitaniumUI extends TitaniumBaseModule implements ITitaniumUI, Handler.Callback
{
	private static final String LCAT = "TiUI";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_START_CREATE_SECTION = 300;

	private static final int MSG_CREATE_TABLEVIEW = 300;
	private static final int MSG_CREATE_ALERTDIALOG = 301;
	private static final int MSG_CREATE_OPTIONDIALOG = 302;
	private static final int MSG_CREATE_TOASTNOTIFIER = 303;
	private static final int MSG_CREATE_BUTTON = 304;
	private static final int MSG_CREATE_SWITCH = 305;
	private static final int MSG_CREATE_SLIDER = 306;
	private static final int MSG_CREATE_TEXTAREA = 307;
	private static final int MSG_CREATE_TEXTFIELD = 308;
	private static final int MSG_CREATE_PROGRESSDIALOG = 309;
	private static final int MSG_CREATE_WINDOW = 310;
	private static final int MSG_CREATE_EMAILDIALOG = 311;
	private static final int MSG_CREATE_WEBVIEW = 312;
	private static final int MSG_CREATE_DATEPICKER = 313;
	private static final int MSG_CREATE_PICKER = 314;
	private static final int MSG_CREATE_MODALDATEPICKER = 315;
	private static final int MSG_CREATE_MODALPICKER = 316;
	private static final int MSG_CREATE_IMAGEVIEW = 317;
	private static final int MSG_CREATE_SCROLLABLEVIEW = 318;
	private static final int MSG_CREATE_COMPOSITEVIEW = 319;

	private static final int MSG_END_CREATE_SECTION = 330;

	private static final int MSG_WINDOW_FOCUS_CHANGED = 340;

	protected TitaniumMenuItem menu;
	protected ITitaniumUserWindow userWindow;

	protected HashSet<ITitaniumLifecycle> windowObjects;

	protected Handler handler;

	class Holder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public Holder() {
			super(0);
		}
		public Object o;
	}

	public TitaniumUI(TitaniumModuleManager tmm, String name) {
		super(tmm, name);

		handler = new Handler(this);

		windowObjects = new HashSet<ITitaniumLifecycle>();
		this.userWindow = tmm.getCurrentWindow();
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumUI as " + name);
		}
		webView.addJavascriptInterface((ITitaniumUI) this, name);
	}


	public boolean handleMessage(Message msg)
	{

		if (msg.what >= MSG_START_CREATE_SECTION && msg.what <= MSG_END_CREATE_SECTION)
		{
			Holder h = (Holder) msg.obj;
			TitaniumActivity activity = null;

			switch (msg.what) {
				case MSG_CREATE_TABLEVIEW:
					activity = tmm.getActivity();
					int themeId = android.R.style.Theme;

					if (activity.isFullscreen()) {
						themeId = android.R.style.Theme_NoTitleBar;
					}

					h.o = new TitaniumTableView(tmm, themeId);
					break;
				case MSG_CREATE_ALERTDIALOG:
					h.o = new TitaniumDialog(tmm);
					break;
				case MSG_CREATE_OPTIONDIALOG:
					h.o = new TitaniumDialog(tmm);
					break;
				case MSG_CREATE_TOASTNOTIFIER :
					h.o = new TitaniumToastNotifier(tmm);
					break;
				case MSG_CREATE_BUTTON :
					h.o = new TitaniumButton(getModuleManager());
					break;
				case MSG_CREATE_SWITCH :
					h.o = new TitaniumSwitch(getModuleManager());
					break;
				case MSG_CREATE_SLIDER :
					h.o = new TitaniumSlider(getModuleManager());
					break;
				case MSG_CREATE_TEXTAREA :
					h.o = new TitaniumText(getModuleManager());
					break;
				case MSG_CREATE_TEXTFIELD :
					h.o = new TitaniumTextField(getModuleManager());
					break;
				case MSG_CREATE_PROGRESSDIALOG :
					h.o = new TitaniumProgressDialog(getActivity());
					break;
				case MSG_CREATE_WINDOW :
					h.o = new TitaniumUserWindowBuilder(getActivity());
					break;
				case MSG_CREATE_EMAILDIALOG :
					h.o = new TitaniumEmailDialog(getModuleManager());
					break;
				case MSG_CREATE_WEBVIEW :
					TitaniumModuleManager tmm = new TitaniumModuleManager(getModuleManager().getActivity());
					h.o = new TitaniumUIWebView(tmm);
					break;
				case MSG_CREATE_DATEPICKER :
					h.o = new TitaniumDatePicker(getModuleManager());
					break;
				case MSG_CREATE_MODALDATEPICKER :
					h.o = new TitaniumDatePickerDialog(getModuleManager());
					break;
				case MSG_CREATE_PICKER :
					h.o = new TitaniumPicker(getModuleManager());
					break;
				case MSG_CREATE_MODALPICKER :
					h.o = new TitaniumPickerDialog(getModuleManager());
					break;
				case MSG_CREATE_IMAGEVIEW :
					h.o = new TitaniumImageView(getModuleManager());
					break;
				case MSG_CREATE_SCROLLABLEVIEW :
					h.o = new TitaniumScrollableView(getModuleManager());
					break;
				case MSG_CREATE_COMPOSITEVIEW :
					h.o = new TitaniumCompositeView(getModuleManager());
					break;
				default :
					throw new IllegalStateException("Unimplemented Control Creator: " + msg.what);
			}

			h.release();
			return true;
		} else if (msg.what == MSG_WINDOW_FOCUS_CHANGED) {
			if (userWindow != null) {
				userWindow.onWindowFocusChanged((Boolean)msg.obj);
			}
			return true;
		}

		return false;
	}

	public void addLifecycleListener(ITitaniumLifecycle listener) {
		if (!windowObjects.contains(listener)) {
			windowObjects.add(listener);
		}
	}

	public void removeLifecyleListener(ITitaniumLifecycle listener) {
		windowObjects.remove(listener);
	}

	public ITitaniumUserWindowBuilder createWindow() {
		return (ITitaniumUserWindowBuilder) create(MSG_CREATE_WINDOW);
 	}

	public TitaniumMenuItem getInternalMenu() {
		return menu;
	}

	public ITitaniumMenuItem createMenu()
	{
		return new TitaniumMenuItem(getTitaniumWebView(), new AtomicInteger(0));
	}

	public ITitaniumMenuItem getMenu()
	{
		return menu; //TODO not sure this will work as expected.
	}

	public void setMenu(ITitaniumMenuItem menu)
	{
		if (DBG) {
			Log.d(LCAT, "Setting menu: " + menu);
		}

		this.menu = (TitaniumMenuItem) menu;
	}

	public ITitaniumUserWindow getCurrentWindow() {
		if (DBG) {
			Log.d(LCAT, "returning current window");
		}
		return userWindow;
	}

	public ITitaniumUIWebView getCurrentView() {
		if (DBG) {
			Log.d(LCAT, "returning current view");
		}

		return tmm.getCurrentUIWebView();
	}

	public ITitaniumDialog createAlertDialog() {
		return (ITitaniumDialog) create(MSG_CREATE_ALERTDIALOG);
	}

	public ITitaniumDialog createOptionDialog() {
		return (ITitaniumDialog) create(MSG_CREATE_OPTIONDIALOG);
	}

	public ITitaniumProgressDialog createProgressDialog() {
		return (ITitaniumProgressDialog) create(MSG_CREATE_PROGRESSDIALOG);
	}

	public ITitaniumNotifier createNotification() {
		return (ITitaniumNotifier) create(MSG_CREATE_TOASTNOTIFIER);
	}

	public ITitaniumTableView createTableView() {
		return (ITitaniumTableView) create(MSG_CREATE_TABLEVIEW);
	}

	public ITitaniumButton createButton(String json) {
		TitaniumButton btn =  (TitaniumButton) create(MSG_CREATE_BUTTON);
		btn.setOptions(json);
		return btn;
	}

	public ITitaniumSwitch createSwitch(String json) {
		TitaniumSwitch btn =  (TitaniumSwitch) create(MSG_CREATE_SWITCH);
		btn.setOptions(json);
		return btn;
	}

	public ITitaniumSlider createSlider(String json) {
		TitaniumSlider slider = (TitaniumSlider) create(MSG_CREATE_SLIDER);
		slider.setOptions(json);
		return slider;
	}

	public ITitaniumText createTextArea(String json) {
		TitaniumText text = (TitaniumText) create(MSG_CREATE_TEXTAREA);
		text.setOptions(json);
		return text;
	}

	public ITitaniumText createTextField(String json) {
		TitaniumTextField text = (TitaniumTextField) create(MSG_CREATE_TEXTFIELD);
		text.setOptions(json);
		return text;
	}

	public ITitaniumEmailDialog createEmailDialog() {
		return (ITitaniumEmailDialog) create(MSG_CREATE_EMAILDIALOG);
	}

	public ITitaniumUIWebView createWebView() {
		return (ITitaniumUIWebView) create(MSG_CREATE_WEBVIEW);
	}

	// Added in 0.6.2

	public void setActiveTab(String tabInfo)
	{
		try {
			JSONObject t = new JSONObject(tabInfo);
			if (t.has("index")) {
				TitaniumActivity activity = getActivity();
				if (activity != null) {
					activity.setActiveTab(t.getInt("index"));
				}
			} else {
				Log.e(LCAT, "Malformed tab object, missing attribute 'index'");
			}
		} catch (JSONException e) {
			Log.e(LCAT, "Invalid tab info: " + tabInfo, e);
		}
	}

	public String getTabByName(String tabName)
	{
		JSONObject json = null;
		if (tabName != null) {
			TitaniumActivity activity = getActivity();
			if (activity != null) {
				ArrayList<TitaniumWindowInfo> windows = activity.getAppInfo().getWindows();
				for(int i = 0; i < windows.size(); i++) {
					TitaniumWindowInfo wi = windows.get(i);
					if (wi.getWindowId().equals(tabName)) {
						json = makeTabJSON(wi, i);
						break;
					}
				}
			}
		}

		return json.toString();
	}

	private JSONObject makeTabJSON(TitaniumWindowInfo wi, int index) {
		/*
		StringBuilder sb = new StringBuilder();
		sb.append("{ name : \"").append(wi.getWindowId()).append("\", index : ").append(index).append("}");
		return sb.toString();
		*/
		JSONObject json = new JSONObject();
		try {
			json.put("name", wi.getWindowId());
			json.put("index", index);
		} catch (JSONException e) {
			Log.w(LCAT, "Error building TabJSON", e);
		}

		return json;
	}

	public String getTabs() {
		JSONArray json = new JSONArray();

		TitaniumActivity activity = getActivity();
		if (activity != null) {
			ArrayList<TitaniumWindowInfo> windows = activity.getAppInfo().getWindows();
			for(int i = 0; i < windows.size(); i++) {
				TitaniumWindowInfo wi = windows.get(i);
				json.put(makeTabJSON(wi,i));
			}
		}

		return json.toString();
	}

	public int addEventListener(String eventName, String eventListener) {
		return tmm.getCurrentUIWebView().addWindowEventListener("ui." + eventName, eventListener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		tmm.getCurrentUIWebView().removeWindowEventListener("ui." + eventName, listenerId);
	}

	//Created in 0.7.0

	public ITitaniumDatePicker createDatePicker(String json) {
		TitaniumDatePicker picker = (TitaniumDatePicker) create(MSG_CREATE_DATEPICKER);
		picker.setOptions(json);
		return picker;
	}

	public ITitaniumModalDatePicker createModalDatePicker(String json) {
		TitaniumDatePickerDialog picker = (TitaniumDatePickerDialog) create(MSG_CREATE_MODALDATEPICKER);
		picker.setOptions(json);
		return picker;
	}

	public ITitaniumPicker createPicker(String json) {
		TitaniumPicker picker = (TitaniumPicker) create(MSG_CREATE_PICKER);
		picker.setOptions(json);
		return picker;
	}

	public ITitaniumModalPicker createModalPicker(String json) {
		TitaniumPickerDialog picker = (TitaniumPickerDialog) create(MSG_CREATE_MODALPICKER);
		picker.setOptions(json);
		return picker;
	}

	public ITitaniumImageView createImageView() {
		TitaniumImageView view = (TitaniumImageView) create(MSG_CREATE_IMAGEVIEW);
		return view;
	}

	public ITitaniumCompositeView createCompositeView() {
		TitaniumCompositeView view = (TitaniumCompositeView) create(MSG_CREATE_COMPOSITEVIEW);
		return view;
	}

	public ITitaniumScrollableView createScrollableView() {
		TitaniumScrollableView view = (TitaniumScrollableView) create(MSG_CREATE_SCROLLABLEVIEW);
		return view;
	}

	// Expects the message handler to put the object in h.o and release the holder
	private Object create(int what)
	{
		Holder h = new Holder();
		handler.obtainMessage(what, h).sendToTarget();
		synchronized (h) {
			try {
				h.acquire();
			} catch (InterruptedException e) {
				Log.w(LCAT, "Interrupted while waiting for object construction: ", e);
			}
		}
		return h.o;
	}

	public void onWindowFocusChanged(boolean hasFocus) {
		handler.obtainMessage(MSG_WINDOW_FOCUS_CHANGED, new Boolean(hasFocus)).sendToTarget();
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
		try {
			for(ITitaniumLifecycle listener : windowObjects) {
				try {
					listener.onDestroy();
				} catch (Throwable t) {
					Log.e(LCAT, "Error in onDestroy", t);
				}
			}
		} finally {
			windowObjects.clear();
			windowObjects = null;
		}
	}

	@Override
	public void onPause() {
		for(ITitaniumLifecycle listener : windowObjects) {
			try {
				listener.onPause();
			} catch (Throwable t) {
				Log.e(LCAT, "Error in onPause", t);
			}
		}
		super.onPause();
	}

	@Override
	public void onResume() {
		for(ITitaniumLifecycle listener : windowObjects) {
			try {
				listener.onResume();
			} catch (Throwable t) {
				Log.e(LCAT, "Error in onResume", t);
			}
		}
		super.onResume();
	}
}
