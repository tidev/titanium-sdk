/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiRHelper;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Bundle;
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
		if (isActivityForResult) {
// TODO: Re-add support for this feature later. (Below code doesn't fully support it yet.)
			this.isDuplicateInstance = true;
			finish();
			return;
		}

		// Do not continue if this is the only root activity instance, but previous JS runtime is still running.
		// This happens if previously destroyed root activity hasn't finished terminating its JS runtime yet.
		if ((this.isDuplicateInstance == false) && (KrollRuntime.isDisposed() == false)) {
			this.isDuplicateInstance = true;
			activityOnCreate(savedInstanceState);
			finish();
			overridePendingTransition(0, 0);
			if (newIntent == null) {
				newIntent = mainIntent;
			}
			if (isActivityForResult) {
				newIntent.addFlags(Intent.FLAG_ACTIVITY_FORWARD_RESULT);
			}
			startActivity(newIntent);
			return;
		}

		// Handle the duplicate root activity instance case. (Only 1 is allowed at a time.)
		if (this.isDuplicateInstance) {
			// Call this instance's Activity.onCreate() method, bypassing TiBaseActivity.onCreate() method.
			activityOnCreate(savedInstanceState);

			// Handle the existing Titanium activity instance.
			if (isActivityForResult) {
				// We need to tear down the existing Titanium activity task first.
				// Afterwards, receate a new Titanium activity on the same task as the parent that wants a response.
				rootActivity.finish();
				if (newIntent == null) {
					newIntent = Intent.makeMainActivity(getComponentName());
				}
				newIntent.addFlags(Intent.FLAG_ACTIVITY_FORWARD_RESULT);
				startActivity(newIntent);
			} else if (rootActivity.getCallingActivity() != null) {
				// The other Titanium activity instance was created via startActivityForResult().
				// We need to terminate the existing instance first then recreate a new root activity.
				rootActivity.finish();
				if (newIntent != null) {
					mainIntent.putExtra(EXTRA_TI_NEW_INTENT, newIntent);
				}
				startActivity(mainIntent);
			} else {
				// Simulate "singleTask" handling by updating root activity's intent with received one.
				if (newIntent == null) {
					newIntent = mainIntent;
				}
				rootActivity.onNewIntent(newIntent);

				// Resume the pre-existing Titanium activity task stack.
				// Note: On Android, you resume an existing activity by using its initial launch intent.
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
		// then make sure it was launched via main intent. Relaunch it if not.
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

		// No Titanium activities are currently shown.
		// Initialize this activity and start up the Titanium JavaScript runtime.
		tiApp.setCurrentActivity(this, this);
		tiApp.setRootActivity(this);
		super.onCreate(savedInstanceState);
		tiApp.verifyCustomModules(this);

		// Invoke activity's onNewIntent() behavior if above code bundled an extra intent into it.
		// This happens if activity was created with a non-main launcher intent, such as a URL scheme.
		if ((newIntent != null) && newIntent.hasExtra(EXTRA_TI_NEW_INTENT)) {
			try {
				Object object = newIntent.getParcelableExtra(EXTRA_TI_NEW_INTENT);
				if (object instanceof Intent) {
					onNewIntent((Intent) object);
				}
			} catch (Exception ex) {
				Log.e(TAG, "Failed to parse intent extra: " + EXTRA_TI_NEW_INTENT, ex);
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
