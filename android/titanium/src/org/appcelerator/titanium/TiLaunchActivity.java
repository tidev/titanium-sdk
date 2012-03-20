/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBindingHelper;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiUrl;
import org.appcelerator.titanium.view.TiCompositeLayout;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

/**
 * Titanium launch activities have a single TiContext and launch an associated
 * Javascript URL during onCreate()
 */
public abstract class TiLaunchActivity extends TiBaseActivity
{
	private static final String TAG = "TiLaunchActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiContext tiContext;
	protected TiUrl url;

	// Constants for Kindle fire fix for android 2373 (TIMOB-7843)
	private static final AtomicInteger creationCounter = new AtomicInteger();
	private static final int KINDLE_FIRE_RESTART_FLAGS = (Intent.FLAG_ACTIVITY_NEW_TASK
		| Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
	private static final String KINDLE_MODEL = "kindle";

	// For restarting due to android bug 2373 detection.
	private AlertDialog invalidLaunchAlert;
	private boolean invalidLaunchDetected = false;
	private AlarmManager restartAlarmManager = null;
	private PendingIntent restartPendingIntent = null;
	protected boolean invalidKindleFireRelaunch = false;

	/**
	 * @return The Javascript URL that this Activity should run
	 */
	public abstract String getUrl();

	/**
	 * Subclasses should override to perform custom behavior
	 * when the Launch Activity's script is finished loading
	 */
	protected void scriptLoaded() { }

	/**
	 * Subclasses should override to perform custom behavior
	 * when the TiContext has been created.
	 * This happens before the script is loaded.
	 */
	protected void contextCreated() { }

	public TiContext getTiContext()
	{
		return tiContext;
	}

	protected void loadActivityScript()
	{
		try {
			String fullUrl = url.resolve(tiContext);
			if (DBG) {
				Log.d(TAG, "Eval JS Activity:" + fullUrl);
			}
			tiContext.evalFile(fullUrl);
		} catch (IOException e) {
			e.printStackTrace();
			finish();
		} finally {
			if (DBG) {
				Log.d(TAG, "Signal JS loaded");
			}
			messageQueue.stopBlocking();
		}
	}

	// For kindle fire, we want to prevent subsequent instances of the activity from launching if it's following the
	// restart workaround for android 2373. For whatever reason, the Fire always tries to re-launch the launch activity
	// (i.e., a new instance of it) whenever the user selects the application from the application drawer (or shelf, whatever
	// it is) after the app has been restarted because of 2373 detection. We detect here when that new instance of the launch
	// activity is coming into existence, so that we can kill it off (finish()) right away.
	protected boolean checkInvalidKindleFireRelaunch(Bundle savedInstanceState)
	{
		invalidKindleFireRelaunch = false;
		int count = creationCounter.getAndIncrement();
		if (count > 0 && getIntent().getFlags() == KINDLE_FIRE_RESTART_FLAGS
			&& Build.MODEL.toLowerCase().contains(KINDLE_MODEL) && !isTaskRoot()) {
			invalidKindleFireRelaunch = true;
		}

		if (invalidKindleFireRelaunch) {
			activityOnCreate(savedInstanceState);
			finish();
		}

		return invalidKindleFireRelaunch;
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{

		if (invalidKindleFireRelaunch || checkInvalidKindleFireRelaunch(savedInstanceState)) {
			return;
		}

		if (checkInvalidLaunch(savedInstanceState)) {
			return;
		}

		url = TiUrl.normalizeWindowUrl(getUrl());
		tiContext = TiContext.createTiContext(this, url.baseUrl, url.url);
		tiContext.setLaunchContext(true);
		if (activityProxy == null) {
			setActivityProxy(new ActivityProxy(tiContext, this));
		}

		// we only want to set the current activity for good in the resume state but we need it right now.
		// save off the existing current activity, set ourselves to be the new current activity temporarily 
		// so we don't run into problems when we bind the current activity
		TiApplication tiApp = getTiApp();
		Activity tempCurrentActivity = tiApp.getCurrentActivity();
		tiApp.setCurrentActivity(this, this);

		TiBindingHelper.bindCurrentActivity(tiContext, activityProxy);

		// set the current activity back to what it was originally
		tiApp.setCurrentActivity(this, tempCurrentActivity);

		contextCreated();
		super.onCreate(savedInstanceState);
	}

	@Override
	protected void windowCreated()
	{
		ITiAppInfo appInfo = getTiApp().getAppInfo();
		getIntent().putExtra(TiC.PROPERTY_FULLSCREEN, appInfo.isFullscreen());
		getIntent().putExtra(TiC.PROPERTY_NAV_BAR_HIDDEN, appInfo.isNavBarHidden());
		super.windowCreated();
		loadActivityScript();
		scriptLoaded();
	}

	protected boolean checkInvalidLaunch(Bundle savedInstanceState)
	{
		Intent intent = getIntent();
		if (intent != null) {
			TiProperties systemProperties = getTiApp().getSystemProperties();
			boolean detectionDisabled = systemProperties.getBool("ti.android.bug2373.disableDetection", false);
			if (!detectionDisabled) {
				return checkInvalidLaunch(intent, savedInstanceState);
			}
		}
		return false;
	}

	protected boolean checkInvalidLaunch(Intent intent, Bundle savedInstanceState)
	{
		invalidLaunchDetected = false;
		String action = intent.getAction();
		if (action != null && action.equals(Intent.ACTION_MAIN)) {
			// First check: is the category CATEGORY_LAUNCHER missing?
			invalidLaunchDetected = !(intent.hasCategory(Intent.CATEGORY_LAUNCHER));

			if (!invalidLaunchDetected) {
				// One more check, because Android 3.0+ will put in the launch category but leave out
				// FLAG_ACTIVITY_RESET_TASK_IF_NEEDED from the flags, which still causes the problem.
				// 0x4 is the flag that occurs when we restart because of the missing category/flag, so
				// that one is okay as well.
				if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_HONEYCOMB && intent.getFlags() != 0x4) {
					int desiredFlags = Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED;
					if ((intent.getFlags() & desiredFlags) != desiredFlags) {
						invalidLaunchDetected = true;
					}
				}
			}

			if (invalidLaunchDetected) {
				Log.e(TAG, "Android issue 2373 detected (missing intent CATEGORY_LAUNCHER or FLAG_ACTIVITY_RESET_TASK_IF_NEEDED), restarting app. " + this);
				layout = new TiCompositeLayout(this);
				setContentView(layout);
				activityOnCreate(savedInstanceState);
				return true;
			}
		}

		return false;
	}

	protected void alertMissingLauncher()
	{
		// No context, we have a launch problem.
		TiProperties systemProperties = getTiApp().getSystemProperties();
		String backgroundColor = systemProperties.getString("ti.android.bug2373.backgroundColor", "black");
		layout.setBackgroundColor(TiColorHelper.parseColor(backgroundColor));

		OnClickListener restartListener = new OnClickListener() {	
			@Override
			public void onClick(DialogInterface arg0, int arg1) {
				restartActivity(500);
			}
		};

		String title = systemProperties.getString("ti.android.bug2373.title", "Restart Required");
		String message = systemProperties.getString("ti.android.bug2373.message", "An application restart is required");
		String buttonText = systemProperties.getString("ti.android.bug2373.buttonText", "Continue");
		invalidLaunchAlert = new AlertDialog.Builder(this)
			.setTitle(title)
			.setMessage(message)
			.setPositiveButton(buttonText, restartListener)
			.setCancelable(false).create();
		invalidLaunchAlert.show();
	}

	protected void restartActivity(int delay)
	{
		Intent relaunch = new Intent(getApplicationContext(), getClass());
		relaunch.setAction(Intent.ACTION_MAIN);
		relaunch.addCategory(Intent.CATEGORY_LAUNCHER);

		restartAlarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
		if (restartAlarmManager != null) {
			restartPendingIntent = PendingIntent.getActivity(getApplicationContext(), 0, relaunch, PendingIntent.FLAG_ONE_SHOT);
		}
		doFinishForRestart();
	}

	private void doFinishForRestart()
	{
		if (invalidLaunchAlert != null && invalidLaunchAlert.isShowing()) {
			invalidLaunchAlert.cancel();
		}
		invalidLaunchAlert = null;
		if (!isFinishing()) {
			finish();
		}
	}

	@Override
	protected void onRestart()
	{
		if (invalidKindleFireRelaunch) {
			activityOnRestart();
			return;
		}
		super.onRestart();
		TiProperties systemProperties = getTiApp().getSystemProperties();
		boolean restart = systemProperties.getBool("ti.android.root.reappears.restart", false);
		if (restart) {
			Log.w(TAG, "Tasks may have been destroyed by Android OS for inactivity. Restarting.");
			restartActivity(250);
		}
	}

	@Override
	protected void onStart()
	{
		if (invalidLaunchDetected || invalidKindleFireRelaunch) {
			activityOnStart();
			return;
		}
		super.onStart();
		if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_START);
		}
	}

	@Override
	protected void onResume()
	{
		if (invalidKindleFireRelaunch) {
			activityOnResume();
			return;
		}
		if (invalidLaunchDetected) {
			alertMissingLauncher();
			activityOnResume();
			return;
		} else if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_RESUME);
		}
		super.onResume();
	}

	@Override
	protected void onPause()
	{
		if (invalidKindleFireRelaunch) {
			activityOnPause();
			return;
		}
		if (invalidLaunchDetected) {
			// Not in a good state. Let's get out.
			doFinishForRestart();
			activityOnPause();
			return;
		} else if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_PAUSE);
		}
		super.onPause();
	}

	@Override
	protected void onStop()
	{
		if (invalidLaunchDetected || invalidKindleFireRelaunch) {
			activityOnStop();
			return;
		} else if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_STOP);
		}
		super.onStop();
	}

	@Override
	protected void onDestroy()
	{
		if (invalidKindleFireRelaunch) {
			activityOnDestroy();
			return;
		}
		if (tiContext != null) {
			tiContext.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_DESTROY);
			TiApplication tiApp = tiContext.getTiApp();
			if (tiApp != null) {
				tiApp.postAnalyticsEvent(TiAnalyticsEventFactory.createAppEndEvent());
			}
		}

		if (invalidLaunchDetected) {
			activityOnDestroy();
			if (restartAlarmManager == null) {
				restartActivity(0);
			}
			restartAlarmManager.set(AlarmManager.RTC, System.currentTimeMillis(), restartPendingIntent);
			restartPendingIntent = null;
			restartAlarmManager = null;
			invalidLaunchAlert = null;
			invalidLaunchDetected = false;
			return;
		}

		super.onDestroy();
	}
}
