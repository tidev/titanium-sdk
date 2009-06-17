/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.util.HashSet;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumDialog;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumMenuItem;
import org.appcelerator.titanium.api.ITitaniumNotifier;
import org.appcelerator.titanium.api.ITitaniumProgressDialog;
import org.appcelerator.titanium.api.ITitaniumUI;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.module.ui.TitaniumDialog;
import org.appcelerator.titanium.module.ui.TitaniumMenuItem;
import org.appcelerator.titanium.module.ui.TitaniumProgressDialog;
import org.appcelerator.titanium.module.ui.TitaniumToastNotifier;
import org.appcelerator.titanium.module.ui.TitaniumUserWindow;

import android.util.Config;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumUI extends TitaniumBaseModule implements ITitaniumUI
{
	private static final String LCAT = "TiUI";
	private static final boolean DBG = Config.LOGD;

	protected TitaniumMenuItem menu;
	protected TitaniumUserWindow userWindow;

	protected HashSet<ITitaniumLifecycle> windowObjects;

	public TitaniumUI(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);

		windowObjects = new HashSet<ITitaniumLifecycle>();
		this.userWindow = new TitaniumUserWindow(this, false);
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumUI as " + name);
		}
		webView.addJavascriptInterface((ITitaniumUI) this, name);
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
		return new TitaniumDialog(getHandler(), getWebView());
	}

	public ITitaniumDialog createOptionDialog() {
		return new TitaniumDialog(getHandler(), getWebView());
	}

	public ITitaniumProgressDialog createProgressDialog() {
		return new TitaniumProgressDialog(getActivity());
	}

	public ITitaniumNotifier createNotification()
	{
		return  new TitaniumToastNotifier(getHandler(), getWebView());
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
