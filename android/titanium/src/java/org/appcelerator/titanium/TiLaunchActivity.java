/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.HashMap;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.util.TiUrl;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.SystemClock;

/**
 * Titanium launch activities have a single TiContext and launch an associated
 * Javascript URL during onCreate()
 */
public abstract class TiLaunchActivity extends TiBaseActivity
{
	private static final String TAG = "TiLaunchActivity";

	/**
	 * Hash table of TiJSActivity derived class names and their assigned JavaScript URLs.
	 * <p>
	 * The key is the Java package name and class name of the TiJSActivity derived class.
	 * The value is the JavaScript file URL assigned to it.
	 */
	private static HashMap<String, String> jsActivityClassScriptMap = new HashMap<>();

	/** JavaScript file URL to be loaded by loadScript() method. This URL is assigned in onCreate() method. */
	private TiUrl url;

	/**
	 * @return The Javascript URL that this Activity should run
	 */
	public abstract String getUrl();

	private boolean hasLoadedScript = false;

	/**
	 * The JavaScript URL that should be ran for the given TiJSActivity derived class name.
	 * Will only return a result if given activity class was launched at least once.
	 * @param className Java package and class name of the TiJSActivity query. Can be null.
	 * @return Returns the JSActivity's assigned JavaScript URL if found. Returns null if given unknown class name.
	 */
	protected String getUrlForJSActivitClassName(String className)
	{
		if (className == null) {
			return null;
		}
		return TiLaunchActivity.jsActivityClassScriptMap.get(className);
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

	protected void loadScript()
	{
		TiApplication.launch();
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		TiApplication tiApp = getTiApp();

		// If this is a TiJSActivity derived class created via "tiapp.xml" <activity/> tags,
		// then destroy it now and launch the root activity instead with the JSActivity's intent.
		// Note: This feature used to bypass loading of "ti.main.js" and "app.js" which was problematic.
		//       Titanium 8 resolved all "newintent" resume handling, making this feature obsolete.
		if (isJSActivity()) {
			// First, store the JSActivity class' script URL to hash table.
			// To be retrieved later by root activity so that it knows which script to load when resumed.
			TiLaunchActivity.jsActivityClassScriptMap.put(getClass().getName(), getUrl());

			// Call this instance's Activity.onCreate() method, bypassing TiBaseActivity.onCreate() method.
			activityOnCreate(savedInstanceState);

			// Destroy this activity and launch/resume the root activity.
			boolean isActivityForResult = (getCallingActivity() != null);
			TiRootActivity rootActivity = tiApp.getRootActivity();
			if (!isActivityForResult && (rootActivity != null)) {
				// Copy the JSActivity's intent to the existing root activity and resume it.
				rootActivity.onNewIntent(getIntent());
				Intent resumeIntent = rootActivity.getLaunchIntent();
				if (resumeIntent == null) {
					resumeIntent = Intent.makeMainActivity(rootActivity.getComponentName());
					resumeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
					resumeIntent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
				}
				startActivity(resumeIntent);
				finish();
				overridePendingTransition(android.R.anim.fade_in, 0);
			} else {
				// Launch a new root activity instance with JSActivity's intent embedded within launch intent.
				Intent mainIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
				mainIntent.setPackage(null);
				if (isActivityForResult) {
					mainIntent.addFlags(Intent.FLAG_ACTIVITY_FORWARD_RESULT);
				} else {
					mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
					mainIntent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
				}
				if (getIntent() != null) {
					mainIntent.putExtra(TiC.EXTRA_TI_NEW_INTENT, getIntent());
				}
				finish();
				overridePendingTransition(android.R.anim.fade_in, 0);
				startActivity(mainIntent);
			}
			return;
		}

		this.url = TiUrl.normalizeWindowUrl(getUrl());

		// we only want to set the current activity for good in the resume state but we need it right now.
		// save off the existing current activity, set ourselves to be the new current activity temporarily
		// so we don't run into problems when we bind the current activity
		Activity tempCurrentActivity = tiApp.getCurrentActivity();
		tiApp.setCurrentActivity(this, this);

		// set the current activity back to what it was originally
		tiApp.setCurrentActivity(this, tempCurrentActivity);

		contextCreated();
		super.onCreate(savedInstanceState);
	}

	public boolean isJSActivity()
	{
		return false;
	}

	@Override
	protected void onResume()
	{
		// Prevent script from loading on future resumes
		if (!hasLoadedScript) {
			hasLoadedScript = true;
			loadScript();
			Log.d(TAG, "Launched in " + (SystemClock.uptimeMillis() - TiApplication.START_TIME_MS) + " ms");
		}
		super.onResume();
	}

	@Override
	protected void onDestroy()
	{
		if (isJSActivity()) {
			// Call Activity.onDestroy() directly, bypassing TiBaseActivity.onDestroy() method.
			// All JSActivity instances are destroyed upon onCreate(). It's an obsolete feature now.
			activityOnDestroy();
		} else {
			// Call TiBaseActivity.onDestroy() normally for root activity.
			super.onDestroy();
		}
	}
}
