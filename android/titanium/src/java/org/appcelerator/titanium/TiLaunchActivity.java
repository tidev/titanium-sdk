/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;
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
import android.os.Handler;
import android.os.Message;
import android.widget.Toast;

/**
 * Titanium launch activities have a single TiContext and launch an associated
 * Javascript URL during onCreate()
 */
public abstract class TiLaunchActivity extends TiBaseActivity
{
	private static final String TAG = "TiLaunchActivity";
	private static final boolean DBG = TiConfig.LOGD;
	
	private static final int MSG_FINISH = 100;
	private static final int RESTART_DELAY = 500;
	private static final int FINISH_DELAY = 500;

	// Constants for Kindle fire fix for android 2373 (TIMOB-7843)
	private static final AtomicInteger creationCounter = new AtomicInteger();
	private static final int KINDLE_FIRE_RESTART_FLAGS = (Intent.FLAG_ACTIVITY_NEW_TASK
		| Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
	private static final String KINDLE_MODEL = "kindle";

	protected TiUrl url;

	// For restarting due to android bug 2373 detection.
	private boolean invalidLaunchDetected = false;
	private AlertDialog invalidLaunchAlert;
	private PendingIntent restartPendingIntent = null;
	private AlarmManager restartAlarmManager = null;
	private int restartDelay = 0;
	// finishing2373 is a flag indicating we've elected
	// to finish this instance of the activity because
	// it's not the task root (i.e., it has come to life
	// via android bug 2373, while there is another instance
	// of this same activity "behind it".)
	protected boolean finishing2373 = false;

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

	protected void loadActivityScript()
	{
		try {
			String fullUrl = url.resolve();

			if (DBG) {
				Log.d(TAG, "Eval JS Activity:" + fullUrl);
			}

			if (fullUrl.startsWith(TiC.URL_APP_PREFIX)) {
				fullUrl = fullUrl.replaceAll("app:/", "Resources");

			} else if (fullUrl.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
				fullUrl = fullUrl.replaceAll("file:///android_asset/", "");
			}

			KrollRuntime.getInstance().runModule(KrollAssetHelper.readAsset(fullUrl), fullUrl, activityProxy);

		} finally {
			if (DBG) {
				Log.d(TAG, "Signal JS loaded");
			}
		}
	}

	// For kindle fire, we want to prevent subsequent instances of the activity from launching if it's following the
	// restart workaround for android 2373. For whatever reason, the Fire always tries to re-launch the launch activity
	// (i.e., a new instance of it) whenever the user selects the application from the application drawer (or shelf, whatever
	// it is) after the app has been restarted because of 2373 detection. We detect here when that new instance of the launch
	// activity is coming into existence, so that we can kill it off (finish()) right away.
	protected boolean checkInvalidKindleFireRelaunch(Bundle savedInstanceState)
	{
		finishing2373 = false;
		int count = creationCounter.getAndIncrement();
		if (count > 0 && getIntent().getFlags() == KINDLE_FIRE_RESTART_FLAGS
			&& Build.MODEL.toLowerCase().contains(KINDLE_MODEL) && !isTaskRoot()) {
			finishing2373 = true;
		}

		if (finishing2373) {
			activityOnCreate(savedInstanceState);
			finish();
		}

		return finishing2373;
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		TiApplication tiApp = getTiApp();

		// If not the task root, then this "launch" activity instance is
		// likely a manifestation of Android bug 2373, and we give
		// developers an option to simply finish it off right away so that
		// the running activity stack remains unchanged. We do something similar
		// below for Kindle Fire, but in that case we do it no matter what if
		// we detect the condition.
		if (!isTaskRoot()) {
			if (tiApp.getSystemProperties().getBool("ti.android.bug2373.finishfalseroot", false)) {
				finishing2373 = true;
				activityOnCreate(savedInstanceState);
				finish();
				return;
			}
		}

		if (finishing2373 || checkInvalidKindleFireRelaunch(savedInstanceState)) {
			return;
		}

		if (!tiApp.isRestartPending()) {
			// Check for a system application restart that we can't support.
			if (TiBaseActivity.isUnsupportedReLaunch(this, savedInstanceState)) {
				super.onCreate(savedInstanceState); // Will take care of scheduling restart and finishing.
				return;
			}

			// Check for android bug 2373.
			if (checkInvalidLaunch(savedInstanceState)) {
				return;
			}
		}

		url = TiUrl.normalizeWindowUrl(getUrl());

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

	@Override
	protected void windowCreated()
	{
		super.windowCreated();
		loadActivityScript();
		scriptLoaded();
	}

	protected boolean checkInvalidLaunch(Bundle savedInstanceState)
	{
		Intent intent = getIntent();
		if (intent != null) {
			TiProperties systemProperties = getTiApp().getSystemProperties();
			boolean detectionDisabled = systemProperties.getBool("ti.android.bug2373.disableDetection", false) ||
					systemProperties.getBool("ti.android.bug2373.finishfalseroot", false);
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
				// (addendum re timob-9285) Launching from history (FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)
				// also appears to be okay, so if that flag is there then don't consider this an invalid
				// launch.
				if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_HONEYCOMB && intent.getFlags() != 0x4) {
					int flags = intent.getFlags();
					invalidLaunchDetected = (
						((flags & Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED) != Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
						&&
						((flags & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)
						);
				}
			}

			if (invalidLaunchDetected) {
				Log.e(TAG, "Android issue 2373 detected (missing intent CATEGORY_LAUNCHER or FLAG_ACTIVITY_RESET_TASK_IF_NEEDED), restarting app. " + this);
				layout = new TiCompositeLayout(this, window);
				setContentView(layout);
				TiProperties systemProperties = getTiApp().getSystemProperties();
				int backgroundColor = TiColorHelper.parseColor(systemProperties.getString("ti.android.bug2373.backgroundColor", "black"));
				getWindow().getDecorView().setBackgroundColor(backgroundColor);
				layout.setBackgroundColor(backgroundColor);

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
		String message = systemProperties.getString("ti.android.bug2373.message", "An application restart is required");
		final int restartDelay = systemProperties.getInt("ti.android.bug2373.restartDelay", RESTART_DELAY);
		final int finishDelay = systemProperties.getInt("ti.android.bug2373.finishDelay", FINISH_DELAY);

		if (systemProperties.getBool("ti.android.bug2373.skipAlert", false)) {
			if (message != null && message.length() > 0) {
				Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
			}
			restartActivity(restartDelay, finishDelay);
		} else {
			OnClickListener restartListener = new OnClickListener() 
			{
				public void onClick(DialogInterface arg0, int arg1) {
					restartActivity(restartDelay, finishDelay);
				}
			};
	
			String title = systemProperties.getString("ti.android.bug2373.title", "Restart Required");
			String buttonText = systemProperties.getString("ti.android.bug2373.buttonText", "Continue");
			invalidLaunchAlert = new AlertDialog.Builder(this)
				.setTitle(title)
				.setMessage(message)
				.setPositiveButton(buttonText, restartListener)
				.setCancelable(false).create();
			invalidLaunchAlert.show();
		}
	}

	protected void restartActivity(int delay)
	{
		restartActivity(delay, 0);
	}

	protected void restartActivity(int delay, int finishDelay)
	{
		Intent relaunch = new Intent(getApplicationContext(), getClass());
		relaunch.setAction(Intent.ACTION_MAIN);
		relaunch.addCategory(Intent.CATEGORY_LAUNCHER);

		restartAlarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
		if (restartAlarmManager != null) {
			restartPendingIntent = PendingIntent.getActivity(getApplicationContext(), 0, relaunch, PendingIntent.FLAG_ONE_SHOT);
			restartDelay = delay;
		}

		if (finishDelay > 0) {
			Handler handler = new Handler() 
			{
				@Override
				public void handleMessage(Message msg) 
				{
					if (msg.what == MSG_FINISH) {
						doFinishForRestart();
					} else {
						super.handleMessage(msg);
					}
				}
			};

			handler.sendEmptyMessageDelayed(MSG_FINISH, finishDelay);
		} else {
			doFinishForRestart();
		}
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

	public boolean isJSActivity()
	{
		return false;
	}

	@Override
	protected void onRestart()
	{
		if (finishing2373) {
			activityOnRestart();
			return;
		}
		super.onRestart();

		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending()) {
			return;
		}

		TiProperties systemProperties = tiApp.getSystemProperties();

		boolean restart = systemProperties.getBool("ti.android.root.reappears.restart", false);
		if (restart) {
			Log.w(TAG, "Tasks may have been destroyed by Android OS for inactivity. Restarting.");
			tiApp.scheduleRestart(250);
		}
	}

	@Override
	protected void onPause()
	{
		if (finishing2373) {
			activityOnPause();
			return;
		}
		if (getTiApp().isRestartPending()) {
			super.onPause(); // Will take care of finish() if needed.
			return;
		}

		if (invalidLaunchDetected) {
			doFinishForRestart();
			activityOnPause();
			return;
		}

		super.onPause();
	}

	@Override
	protected void onStop()
	{
		if (getTiApp().isRestartPending()) {
			super.onStop();
			return;
		}

		if (invalidLaunchDetected || finishing2373) {
			activityOnStop();
			return;
		}
		super.onStop();
	}

	@Override
	protected void onStart()
	{
		if (getTiApp().isRestartPending()) {
			super.onStart();
			return;
		}

		if (invalidLaunchDetected || finishing2373) {
			activityOnStart();
			return;
		}
		super.onStart();
	}

	@Override
	protected void onResume()
	{
		if (finishing2373) {
			activityOnResume();
			return;
		}
		if (getTiApp().isRestartPending() || isFinishing()) {
			super.onResume();
			return;
		}

		if (invalidLaunchDetected) {
			alertMissingLauncher(); // This also kicks off the finish() and restart.
			activityOnResume();
			return;
		}

		super.onResume();
	}

	@Override
	protected void onDestroy()
	{
		if (finishing2373) {
			activityOnDestroy();
			return;
		}

		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending() || invalidLaunchDetected) {
			activityOnDestroy();
			if (restartAlarmManager == null) {
				restartActivity(0);
			}
			tiApp.beforeForcedRestart();
			restartAlarmManager.set(AlarmManager.RTC, System.currentTimeMillis() + restartDelay, restartPendingIntent);
			restartPendingIntent = null;
			restartAlarmManager = null;
			invalidLaunchAlert = null;
			invalidLaunchDetected = false;
			return;
		}

		if (tiApp != null) {
			tiApp.postAnalyticsEvent(TiAnalyticsEventFactory.createAppEndEvent());
		}

		// Create a new session ID for next session
		TiPlatformHelper.resetSid();

		super.onDestroy();
	}

}