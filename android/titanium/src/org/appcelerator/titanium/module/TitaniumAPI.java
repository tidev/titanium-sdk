/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumAPI;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;

import android.webkit.WebView;

public class TitaniumAPI extends TitaniumBaseModule implements ITitaniumAPI
{
	private static final String LCAT = "TiAPI";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public TitaniumAPI(TitaniumModuleManager manager, String name) {
		super(manager, name);
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumAPI as " + name);
		}
		webView.addJavascriptInterface((ITitaniumAPI) this, name);
	}

	public void log(int severity, String msg)
	{
		/*
		TRACE: 1,
		DEBUG: 2,
		INFO: 3,
		NOTICE: 4,
		WARN: 5,
		ERROR: 6,
		CRITICAL: 7,
		FATAL: 8*/
		if (severity == 1)
		{
			Log.v(LCAT,msg);
		}
		else if (severity < 3)
		{
			Log.d(LCAT,msg);
		}
		else if (severity < 5)
		{
			Log.i(LCAT,msg);
		}
		else if (severity == 5)
		{
			Log.w(LCAT,msg);
		}
		else
		{
			Log.e(LCAT,msg);
		}
	}

	public void updateNativeControls(String json) {
		getModuleManager().getWebView().updateNativeControls(json);
	}

	public void signal(String syncId) {
		getModuleManager().getWebView().signal(syncId);
	}
}