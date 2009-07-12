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
import org.appcelerator.titanium.api.ITitaniumDialog;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumMenuItem;
import org.appcelerator.titanium.api.ITitaniumNotifier;
import org.appcelerator.titanium.api.ITitaniumProgressDialog;
import org.appcelerator.titanium.api.ITitaniumTableView;
import org.appcelerator.titanium.api.ITitaniumUI;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.TitaniumDialog;
import org.appcelerator.titanium.module.ui.TitaniumMenuItem;
import org.appcelerator.titanium.module.ui.TitaniumProgressDialog;
import org.appcelerator.titanium.module.ui.TitaniumTableView;
import org.appcelerator.titanium.module.ui.TitaniumToastNotifier;
import org.appcelerator.titanium.module.ui.TitaniumUserWindow;

import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumUI extends TitaniumBaseModule implements ITitaniumUI, Handler.Callback
{
	private static final String LCAT = "TiUI";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CREATE_TABLEVIEW = 300;

	protected TitaniumMenuItem menu;
	protected TitaniumUserWindow userWindow;

	protected HashSet<ITitaniumLifecycle> windowObjects;

	protected Handler handler;

	class Holder extends Semaphore {
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

		switch (msg.what) {
		case MSG_CREATE_TABLEVIEW:
			TitaniumActivity activity = getActivity();
			int themeId = android.R.style.Theme;

			if (activity.isFullscreen()) {
				themeId = android.R.style.Theme_NoTitleBar;
			}

			Holder h = (Holder) msg.obj;
			h.o = new TitaniumTableView(activity, themeId);
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

	public ITitaniumDialog createAlertDialog()
	{
		return new TitaniumDialog(getHandler(), getActivity());
	}

	public ITitaniumDialog createOptionDialog() {
		return new TitaniumDialog(getHandler(), getActivity());
	}

	public ITitaniumProgressDialog createProgressDialog() {
		return new TitaniumProgressDialog(getActivity());
	}

	public ITitaniumNotifier createNotification()
	{
		return  new TitaniumToastNotifier(getHandler(), getActivity());
	}

	public ITitaniumTableView createTableView() {
		return (ITitaniumTableView) create(MSG_CREATE_TABLEVIEW);
	}

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
