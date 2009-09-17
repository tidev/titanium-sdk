/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumApp;
import org.appcelerator.titanium.api.ITitaniumProperties;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.app.TitaniumProperties;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumUrlHelper;

import android.webkit.WebView;

public class TitaniumApp extends TitaniumBaseModule implements ITitaniumApp
{
	private static final String LCAT = "TiApp";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private final TitaniumAppInfo appInfo;
	private final TitaniumProperties appProperties; // commits on each set
	private final ITitaniumProperties systemProperties; // allows save, but never committed.

	public TitaniumApp(TitaniumModuleManager moduleMgr, String name, TitaniumAppInfo appInfo) {
		super(moduleMgr, name);
		this.appInfo = appInfo;
		this.appProperties = new TitaniumProperties(moduleMgr.getActivity(), "titanium", false);
		systemProperties = appInfo.getSystemProperties();
	}

	@Override
	public void register(WebView webView) {
		String name = super.getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumApp as " + name);
		}
		webView.addJavascriptInterface((ITitaniumApp) this, name);
	}

	public String getID()
	{
		return appInfo.getAppId();
	}
	public String getModuleName()
	{
		return appInfo.getAppName();
	}
	public String getVersion()
	{
		return appInfo.getAppVersion();
	}
	public String getPublisher()
	{
		return appInfo.getAppPublisher();
	}
	public String getURL()
	{
		return appInfo.getAppURL();
	}
	public String getDescription()
	{
		return appInfo.getAppDescription();
	}
	public String getCopyright()
	{
		return appInfo.getAppCopyright();
	}
	public String getGUID()
	{
		return appInfo.getAppGUID();
	}
	public String getStreamURL(String stream)
	{
		String part = "p";
		if (stream == "dev")
		{
			part = "d";
		}
		else if (stream == "test")
		{
			part = "t";
		}
		return "https://api.appcelerator.net/"+part+"/v1/";
	}
	public String appURLToPath(String url)
	{
		return TitaniumUrlHelper.joinUrls("file:///android_asset", url);
	}
	public void triggerLoad()
	{
		if (DBG) {
			Log.d(LCAT,"++++++++++++ TRIGGER LOAD IN APP");
		}
		//getActivity().triggerLoad(); // Activity takes care of thread.
	}
	public void setLoadOnPageEnd(final boolean load)
	{
		getActivity().setLoadOnPageEnd(load);
	}

	public ITitaniumProperties getAppProperties() {
		return appProperties;
	}

	public ITitaniumProperties getSystemProperties() {
		return systemProperties;
	}
}