/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.util.HashSet;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumButton;
import org.appcelerator.titanium.api.ITitaniumDialog;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumMenuItem;
import org.appcelerator.titanium.api.ITitaniumNotifier;
import org.appcelerator.titanium.api.ITitaniumProgressDialog;
import org.appcelerator.titanium.api.ITitaniumSlider;
import org.appcelerator.titanium.api.ITitaniumSwitch;
import org.appcelerator.titanium.api.ITitaniumTableView;
import org.appcelerator.titanium.api.ITitaniumUI;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.TitaniumButton;
import org.appcelerator.titanium.module.ui.TitaniumDialog;
import org.appcelerator.titanium.module.ui.TitaniumMenuItem;
import org.appcelerator.titanium.module.ui.TitaniumProgressDialog;
import org.appcelerator.titanium.module.ui.TitaniumSlider;
import org.appcelerator.titanium.module.ui.TitaniumSwitch;
import org.appcelerator.titanium.module.ui.TitaniumTableView;
import org.appcelerator.titanium.module.ui.TitaniumToastNotifier;
import org.appcelerator.titanium.module.ui.TitaniumUserWindow;

import android.os.Handler;
import android.os.Message;
import org.appcelerator.titanium.util.Log;
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

	private static final int MSG_END_CREATE_SECTION = 330;

	protected TitaniumMenuItem menu;
	protected TitaniumUserWindow userWindow;

	protected HashSet<ITitaniumLifecycle> windowObjects;

	protected Handler handler;

	class Holder extends Semaphore {
		private static final long serialVersionUID = 1L;
		public Holder() {
			super(0);
		}
		public Object o;
	}

	public TitaniumUI(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);

		handler = new Handler(this);

		windowObjects = new HashSet<ITitaniumLifecycle>();
		this.userWindow = new TitaniumUserWindow(this, false);
		Log.e(LCAT, "UIMThreadName: " + Thread.currentThread().getName());

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
					activity = getActivity();
					int themeId = android.R.style.Theme;

					if (activity.isFullscreen()) {
						themeId = android.R.style.Theme_NoTitleBar;
					}

					h.o = new TitaniumTableView(activity, themeId);
					break;
				case MSG_CREATE_ALERTDIALOG:
					h.o = new TitaniumDialog(getActivity());
					break;
				case MSG_CREATE_OPTIONDIALOG:
					h.o = new TitaniumDialog(getActivity());
					break;
				case MSG_CREATE_TOASTNOTIFIER :
					h.o = new TitaniumToastNotifier(getActivity());
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
				default :
					throw new IllegalStateException("Unimplemented Control Creator: " + msg.what);
			}

			h.release();
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

	public ITitaniumUserWindow createWindow() {
		return new TitaniumUserWindow(this, true);
	}
	public TitaniumMenuItem getInternalMenu() {
		return menu;
	}

	public ITitaniumMenuItem createMenu()
	{
		return new TitaniumMenuItem(getWebView(), new AtomicInteger(0));
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

	public ITitaniumDialog createAlertDialog() {
		return (ITitaniumDialog) create(MSG_CREATE_ALERTDIALOG);
	}

	public ITitaniumDialog createOptionDialog() {
		return (ITitaniumDialog) create(MSG_CREATE_OPTIONDIALOG);
	}

	public ITitaniumProgressDialog createProgressDialog() {
		return new TitaniumProgressDialog(getActivity());
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
