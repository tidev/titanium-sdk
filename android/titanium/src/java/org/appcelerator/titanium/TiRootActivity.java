/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiRHelper;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Window;

public class TiRootActivity extends TiLaunchActivity implements TiActivitySupport
{
	private static final String TAG = "TiRootActivity";
	private Drawable[] backgroundLayers = { null, null };
	private boolean isDuplicateInstance;

	public void setBackgroundColor(int color)
	{
		Window window = getWindow();
		if (window == null) {
			return;
		}

		Drawable colorDrawable = new ColorDrawable(color);
		backgroundLayers[0] = colorDrawable;

		if (backgroundLayers[1] != null) {
			window.setBackgroundDrawable(new LayerDrawable(backgroundLayers));
		} else {
			window.setBackgroundDrawable(colorDrawable);
		}
	}

	public void setBackgroundImage(Drawable image)
	{
		Window window = getWindow();
		if (window == null) {
			return;
		}

		backgroundLayers[1] = image;
		if (image == null) {
			window.setBackgroundDrawable(backgroundLayers[0]);
			return;
		}

		if (backgroundLayers[0] != null) {
			window.setBackgroundDrawable(new LayerDrawable(backgroundLayers));
		} else {
			window.setBackgroundDrawable(image);
		}
	}

	@Override
	public String getUrl()
	{
		// The Titanium "ti.main.js" script is shared by all platforms.
		// It will run the app developer's "app.js" script after loading all JS extensions.
		// Script Location: titanium_mobile/common/Resources
		return "ti.main.js";
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		final String EXTRA_TI_NEW_INTENT = "ti.intent.extra.NEW_INTENT";

		Log.checkpoint(TAG, "checkpoint, on root activity create, savedInstanceState: " + savedInstanceState);

		// Create the main launcher intent expected to launch this root activity.
		// This is the only intent Titanium supports in order to simulate "singleTask" like resume behavior.
		Intent mainIntent = Intent.makeMainActivity(getComponentName());
		mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		mainIntent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);

		// Fetch the intent this activity was launched with.
		Intent newIntent = getIntent();

		// Determine if a Titanium root activity already exists.
		// Only 1 root activity is allowed at a time to host the one and only Titanium JavaScript runtime.
		// Note: Android will create a new activity instance if intent is different than last activity's intent.
		TiApplication tiApp = getTiApp();
		TiRootActivity rootActivity = tiApp.getRootActivity();
		this.isDuplicateInstance = (rootActivity != null);

		// Determine if this activity was created via startActivityForResult().
		// In this case, this activity needs to respond with setResult() and finish().
		boolean isActivityForResult = (getCallingActivity() != null);

		// Handle the duplicate root activity instance case. (Only 1 is allowed at a time.)
		if (this.isDuplicateInstance) {
			// Call this instance's Activity.onCreate() method, bypassing TiBaseActivity.onCreate() method.
			activityOnCreate(savedInstanceState);

			// Handle the existing Titanium activity instance.
			if (isActivityForResult || (rootActivity.getCallingActivity() != null)) {
				// At least 1 root activity instance was created via the startActiviyForResult() method.
				try {
					// Attempt to tear down the other Titanium activity task.
					// Note: The finish() method won't do anything if it's not the top-most task in the app.
					if (rootActivity.getCallingActivity() != null) {
						rootActivity.setResult(RESULT_CANCELED, null);
					}
					rootActivity.finishAffinity();
					TiApplication.terminateActivityStack();

					// Recreate this activity on the current task.
					if (isActivityForResult) {
						// This activtiy was created via startActiviyForResult().
						// "Forward" the result handling to the next activity we're about to start-up.
						Intent relaunchIntent = newIntent;
						if (relaunchIntent == null) {
							relaunchIntent = Intent.makeMainActivity(getComponentName());
						}
						relaunchIntent.addFlags(Intent.FLAG_ACTIVITY_FORWARD_RESULT);
						startActivity(relaunchIntent);
					} else {
						// Delay recreation of this activity. Need to wait for above finished activity to be destroyed.
						// Note: Only an issue when destroying activities created via startActiviyForResult().
						final Intent relaunchIntent = mainIntent;
						if (newIntent != null) {
							relaunchIntent.putExtra(EXTRA_TI_NEW_INTENT, newIntent);
						}
						Runnable restartRunnable = new Runnable() {
							@Override
							public void run()
							{
								startActivity(relaunchIntent);
							}
						};
						Handler mainHandler = new Handler(Looper.getMainLooper());
						mainHandler.postDelayed(restartRunnable, 100);
					}
				} catch (Exception ex) {
					Log.e(TAG, "Failed to close existing Titanium root activity.", ex);
				}
			} else {
				// Simulate "singleTask" handling by updating existing root activity's intent with received one.
				if (newIntent == null) {
					newIntent = mainIntent;
				}
				rootActivity.onNewIntent(newIntent);

				// Resume the pre-existing Titanium root activity.
				// Note: On Android, you resume a backgrounded activity by using its initial launch intent.
				Intent resumeIntent = rootActivity.getLaunchIntent();
				if (resumeIntent == null) {
					resumeIntent = mainIntent;
				}
				startActivity(resumeIntent);
			}

			// Destroy this activity before it is shown.
			finish();

			// Disable this activity's enter/exit animation. (Looks bad if we keep it.)
			// Note: Must be done after calling finish() above.
			overridePendingTransition(0, 0);
			return;
		}

		// *** This is the only Titanium root activity instance. ***

		// If this is a normal activity (not launched via startActivityForResult() method),
		// then make sure it was launched via main launcher intent. Relaunch it if not.
		if (!isActivityForResult) {
			if ((newIntent == null) || (newIntent.filterEquals(mainIntent) == false)) {
				this.isDuplicateInstance = true;
				activityOnCreate(savedInstanceState);
				finish();
				overridePendingTransition(0, 0);
				if (newIntent != null) {
					mainIntent.putExtra(EXTRA_TI_NEW_INTENT, newIntent);
				}
				startActivity(mainIntent);
				return;
			}
		}

		// Initialize this activity and start up the Titanium JavaScript runtime.
		tiApp.setCurrentActivity(this, this);
		tiApp.setRootActivity(this);
		super.onCreate(savedInstanceState);
		tiApp.verifyCustomModules(this);

		// Invoke activity's onNewIntent() behavior if above code bundled an extra intent into it.
		// This happens if activity was initially created with a non-main launcher intent, such as a URL scheme.
		if ((newIntent != null) && newIntent.hasExtra(EXTRA_TI_NEW_INTENT)) {
			try {
				Object object = newIntent.getParcelableExtra(EXTRA_TI_NEW_INTENT);
				if (object instanceof Intent) {
					onNewIntent((Intent) object);
				}
			} catch (Exception ex) {
				Log.e(TAG, "Failed to parse: " + EXTRA_TI_NEW_INTENT, ex);
			}
		}
	}

	@Override
	protected void windowCreated(Bundle savedInstanceState)
	{
		// Use settings from tiapp.xml
		ITiAppInfo appInfo = getTiApp().getAppInfo();
		getIntent().putExtra(TiC.PROPERTY_FULLSCREEN, appInfo.isFullscreen());
		super.windowCreated(savedInstanceState);
	}

	@Override
	protected void onResume()
	{
		Log.checkpoint(TAG, "checkpoint, on root activity resume. activity = " + this);
		super.onResume();
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);
		try {
			int backgroundId = TiRHelper.getResource("drawable.background");
			if (backgroundId != 0) {
				Drawable d = this.getResources().getDrawable(backgroundId);
				if (d != null) {
					Drawable bg = getWindow().getDecorView().getBackground();
					getWindow().setBackgroundDrawable(d);
					bg.setCallback(null);
				}
			}
		} catch (Exception e) {
			Log.e(TAG, "Resource not found 'drawable.background': " + e.getMessage());
		}
	}

	@Override
	protected void onDestroy()
	{
		Log.d(TAG, "root activity onDestroy, activity = " + this, Log.DEBUG_MODE);

		// If this is a duplicate instance, then we're quickly destroying it via this class' onCreate() method.
		// Only 1 Titanium root activity is allowed at a time.
		// Note: Below method calls Activity.onDestroy() directly, bypassing TiBaseActivity.onDestroy() method.
		if (this.isDuplicateInstance) {
			activityOnDestroy();
			return;
		}

		// This is the 1 and only root activity instance. Destroy it normally.
		super.onDestroy();

		// Null out the global root activity reference assigned via onCreate() method.
		TiApplication tiApp = getTiApp();
		if (tiApp.getRootActivity() == this) {
			tiApp.setRootActivity(null);
		}
	}
}
