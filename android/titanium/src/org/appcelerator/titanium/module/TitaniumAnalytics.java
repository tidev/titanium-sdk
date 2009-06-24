/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumAnalytics;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEventFactory;

import org.appcelerator.titanium.config.TitaniumConfig;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumAnalytics extends TitaniumBaseModule implements ITitaniumAnalytics
{
	private static final String LCAT = "TiAnalytics";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private TitaniumApplication app;

	public TitaniumAnalytics(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);

		this.app = (TitaniumApplication) moduleMgr.getActivity().getApplication();
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumAnalytics as " + name);
		}
		webView.addJavascriptInterface((ITitaniumAnalytics) this, name);
	}

	public void addEvent (String eventName, String data)
	{
		app.postAnalyticsEvent(TitaniumAnalyticsEventFactory.createEvent(eventName, data));
	}
}