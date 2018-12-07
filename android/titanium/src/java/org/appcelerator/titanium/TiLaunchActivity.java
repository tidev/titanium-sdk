/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.util.TiUrl;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

/**
 * Titanium launch activities have a single TiContext and launch an associated
 * Javascript URL during onCreate()
 */
public abstract class TiLaunchActivity extends TiBaseActivity
{
	private static final String TAG = "TiLaunchActivity";

	protected TiUrl url;
	protected boolean alloyIntent = false;

	/**
	 * @return The Javascript URL that this Activity should run
	 */
	public abstract String getUrl();

	/**
	 * @return is this an alloy activity that has been launched from an intent
	 */
	public boolean isAlloyIntent()
	{
		return this.alloyIntent;
	}

	/**
	 * Subclasses should override to perform custom behavior
	 * when the Launch Activity's script is finished loading
	 */
	protected void scriptLoaded()
	{
	}

	/**
	 * Subclasses should override to perform custom behavior
	 * when the TiContext has been created.
	 * This happens before the script is loaded.
	 */
	protected void contextCreated()
	{
	}

	protected String resolveUrl(String url)
	{
		String fullUrl = TiUrl.normalizeWindowUrl(url).resolve();

		if (fullUrl.startsWith(TiC.URL_APP_PREFIX)) {
			fullUrl = fullUrl.replaceAll("app:/", "Resources");
		} else if (fullUrl.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			fullUrl = fullUrl.replaceAll("file:///android_asset/", "");
		}

		return fullUrl;
	}

	protected String resolveUrl(TiUrl url)
	{
		return resolveUrl(url.url);
	}

	protected void loadActivityScript()
	{
		try {
			String fullUrl = resolveUrl(url);

			// TIMOB-20502: if Alloy app and root activity is not available then
			// run root activity first to initialize Alloy global variables etc...
			// NOTE: this will only occur when launching from an intent or shortcut
			this.alloyIntent = isJSActivity() && KrollAssetHelper.assetExists("Resources/alloy.js");
			if (this.alloyIntent && !getTiApp().isRootActivityAvailable()) {
				String rootUrl = resolveUrl("app.js");
				KrollRuntime.getInstance().runModule(KrollAssetHelper.readAsset(rootUrl), rootUrl, activityProxy);
				KrollRuntime.getInstance().evalString(KrollAssetHelper.readAsset(fullUrl), fullUrl);
			} else {
				KrollRuntime.getInstance().runModule(KrollAssetHelper.readAsset(fullUrl), fullUrl, activityProxy);
			}
		} finally {
			Log.d(TAG, "Signal JS loaded", Log.DEBUG_MODE);
		}
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		url = TiUrl.normalizeWindowUrl(getUrl());

		// we only want to set the current activity for good in the resume state but we need it right now.
		// save off the existing current activity, set ourselves to be the new current activity temporarily
		// so we don't run into problems when we bind the current activity
		TiApplication tiApp = getTiApp();
		Activity tempCurrentActivity = tiApp.getCurrentActivity();
		tiApp.setCurrentActivity(this, this);

		// set the current activity back to what it was originally
		tiApp.setCurrentActivity(this, tempCurrentActivity);

		contextCreated();
		super.onCreate(savedInstanceState);
	}

	@Override
	protected void windowCreated(Bundle savedInstanceState)
	{
		super.windowCreated(savedInstanceState);
		loadActivityScript();
		scriptLoaded();
		TiApplication.getInstance().postAppInfo();
	}

	public boolean isJSActivity()
	{
		return false;
	}

	@Override
	protected void onResume()
	{
		// handle 'onIntent' event for both TiRootActivity and TiJSActivity
		if ((this.activityProxy != null) && (getTiApp().isRootActivityAvailable() == false)) {
			Intent intent = getIntent();
			if (intent != null) {
				KrollDict data = new KrollDict();
				data.put(TiC.EVENT_PROPERTY_INTENT, new IntentProxy(intent));
				activityProxy.fireEvent(TiC.PROPERTY_ON_INTENT, data);
			}
		}

		super.onResume();
	}
}
