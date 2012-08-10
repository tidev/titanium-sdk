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

	// Constants for Kindle fire fix for android bug 2373 (TIMOB-7843)
	private static final AtomicInteger creationCounter = new AtomicInteger();
	private static final int KINDLE_FIRE_RESTART_FLAGS = (Intent.FLAG_ACTIVITY_NEW_TASK
		| Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
	private static final String KINDLE_MODEL = "kindle";

	// For general android bug 2373 condition checking.
	private static final int VALID_LAUNCH_FLAGS = Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
			| Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY;


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

	protected TiUrl url;

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

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		if (willFinishFalseRootActivity(savedInstanceState)) {
			return;
		}

		TiApplication tiApp = getTiApp();

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
				// launch. VALID_LAUNCH_FLAGS contains both of these valid flags.
				if (Build.VERSION.SDK_INT >= TiC.API_LEVEL_HONEYCOMB && intent.getFlags() != 0x4) {
					invalidLaunchDetected = (intent.getFlags() & VALID_LAUNCH_FLAGS) == 0;
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

	/**
	 * Determines whether to immediately kill of (i.e., finish()) this instance
	 * of the activity because it is not really the task root activity, and thus
	 * is likely a byproduct of Android bug 2373. There are two conditions when
	 * we'll finish it:
	 *
	 * <p>(1) The Titanium developer has explicitly said she wants it shut down,
	 * by setting the "finishfalseroot" property; or
	 *
	 * <p>(2) We recognize a specific condition we've seen on Kindle Fires. For whatever
	 * reason, the Fire always tries to re-launch the launch activity
	 * (i.e., a new instance of it) whenever the user selects the application
	 * from the application drawer/shelf after the app has been restarted because
	 * of our 2373 detection. We detect here when that new instance of the launch
	 * activity is coming into existence, so that we can finish it immediately.
	 *
	 * @param savedInstanceStateThe Bundle passed to onCreate, which we will pass
	 * on to a superclass onCreate if we decide to finish right away.
	 *
	 * @return true if we have detected one of the two conditions and are thus finishing
	 * the Activity right away.
	 */
	protected boolean willFinishFalseRootActivity(Bundle savedInstanceState)
	{
		finishing2373 = false;

		if (isTaskRoot()) {
			// Not a "false root" activity. This activity
			// instance truly is the root of the task, so
			// nothing needs to be done.
			return finishing2373;
		}

		Intent intent = getIntent();
		if (intent == null) {
			// We need it. No other checks to make.
			return finishing2373;
		}

		String action = intent.getAction();
		if (action == null || !action.equals(Intent.ACTION_MAIN)) {
			// No ACTION_MAIN, which means this activity wasn't started
			// as a launch activity anyway, so there is no reason to shut
			// it down.  For example, it could be that the app developer
			// has designated (using intent filters) that this activity
			// can be used for more things beyond being the launch activity,
			// and we should allow that.
			return finishing2373;
		}

		TiApplication tiApp = TiApplication.getInstance();
		TiProperties systemProperties = null;

		if (tiApp != null) {
			systemProperties = tiApp.getSystemProperties();
		}

		if (systemProperties != null
				&& systemProperties.getBool("ti.android.bug2373.finishfalseroot", false)) {
			finishing2373 = true;
		} else if (Build.MODEL.toLowerCase().contains(KINDLE_MODEL)
				&& creationCounter.getAndIncrement() > 0
				&& intent.getFlags() == KINDLE_FIRE_RESTART_FLAGS) {
			finishing2373 = true;
		}

		if (finishing2373) {
			// Jumps over TiBaseActivity's onCreate to fulfill directly
			// the requirement that all Activity-derived classes must
			// call Activity.onCreate.
			activityOnCreate(savedInstanceState);
			finish();
		}

		return finishing2373;
	}

}