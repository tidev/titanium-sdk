/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.ArrayList;
import java.util.LinkedList;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollEventCallback;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiRHelper;

import android.app.Activity;
import android.content.ComponentName;
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
	/**
	 * Listener used to detect when the TiRootActivity's onNewIntent() method has been called.
	 * Instances are to be passed to TiRootActivity's addOnNewIntentListener() method.
	 */
	public interface OnNewIntentListener {
		void onNewIntent(TiRootActivity activity, Intent intent);
	}

	private static final String TAG = "TiRootActivity";

	/**
	 * Set true if Titanium "ti.main.js" script is currently loaded and running.
	 * Set false if not loaded yet or if the JS runtime has been terminated after closing all activities.
	 */
	private static boolean isScriptRunning;

	private ArrayList<OnNewIntentListener> newIntentListeners = new ArrayList<>(16);
	private LinkedList<Runnable> pendingRuntimeRunnables = new LinkedList<>();
	private Drawable[] backgroundLayers = { null, null };
	private int runtimeStartedListenerId = KrollProxy.INVALID_EVENT_LISTENER_ID;
	private boolean wasRuntimeStarted;
	private boolean isDuplicateInstance;

	static
	{
		// Set up a listener to be invoked every time the JavaScript runtime is being terminated.
		// We want to hold on to this listener for the lifetime of the application.
		KrollRuntime.addOnDisposingListener(new KrollRuntime.OnDisposingListener() {
			@Override
			public void onDisposing(KrollRuntime runtime)
			{
				TiRootActivity.isScriptRunning = false;
			}
		});
	}

	public void addOnNewIntentListener(TiRootActivity.OnNewIntentListener listener)
	{
		if ((listener != null) && (this.newIntentListeners.contains(listener) == false)) {
			this.newIntentListeners.add(listener);
		}
	}

	public void removeOnNewIntentListener(TiRootActivity.OnNewIntentListener listener)
	{
		if (listener != null) {
			this.newIntentListeners.remove(listener);
		}
	}

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

		// Determine if this activity is being restored. This will happen when:
		// - Developer option "Don't keep activities" is enabled and user navigated back to this activity.
		// - The OS forced-quit this app due to low memory or system's "Background process limit" was exceeded.
		boolean isNotRestoringActivity = (savedInstanceState == null);

		// Determine if this activity was created via startActivityForResult().
		// In this case, this activity needs to respond with setResult() and finish().
		boolean isActivityForResult = (getCallingActivity() != null);

		// Handle the duplicate root activity instance case. (Only 1 is allowed at a time.)
		if (this.isDuplicateInstance) {
			// Call this instance's Activity.onCreate() method, bypassing TiBaseActivity.onCreate() method.
			activityOnCreate(savedInstanceState);

			// Handle the existing Titanium activity instance.
			if (isActivityForResult || (rootActivity.getCallingActivity() != null)) {
				// At least 1 root activity instance was created via the startActivityForResult() method.
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
						// This activtiy was created via startActivityForResult().
						// "Forward" the result handling to the next activity we're about to start-up.
						Intent relaunchIntent = newIntent;
						if (relaunchIntent == null) {
							relaunchIntent = Intent.makeMainActivity(getComponentName());
						}
						relaunchIntent.addFlags(Intent.FLAG_ACTIVITY_FORWARD_RESULT);
						startActivity(relaunchIntent);
					} else {
						// Delay recreation of this activity. Need to wait for above finished activity to be destroyed.
						// Note: Only an issue when destroying activities created via startActivityForResult().
						final Intent relaunchIntent = mainIntent;
						if (newIntent != null) {
							relaunchIntent.putExtra(TiC.EXTRA_TI_NEW_INTENT, newIntent);
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
			} else if (!canResumeActivityUsing(newIntent) || !canResumeActivityUsing(rootActivity.getLaunchIntent())) {
				// It's impossible to resume existing root activity. So, we have to destroy it and restart.
				// Note: This typically happens with ACTION_SEND and ACTION_*_DOCUMENT intents.
				rootActivity.finishAffinity();
				TiApplication.terminateActivityStack();
				if ((newIntent != null) && !newIntent.filterEquals(mainIntent)) {
					mainIntent.putExtra(TiC.EXTRA_TI_NEW_INTENT, newIntent);
				}
				mainIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
				startActivity(mainIntent);
			} else {
				// Simulate "singleTask" handling by updating existing root activity's intent with received one.
				if (newIntent == null) {
					newIntent = mainIntent;
				}
				rootActivity.onNewIntent(newIntent);

				// Resume the pre-existing Titanium root activity.
				// Note: You can resume a backgrounded activity by using its initial launch intent,
				//       but we need to remove flags such as CLEAR_TOP to preserve its child activities.
				Intent resumeIntent = rootActivity.getLaunchIntent();
				if (resumeIntent != null) {
					resumeIntent = new Intent(resumeIntent);
					resumeIntent.setFlags(mainIntent.getFlags());
				} else {
					resumeIntent = mainIntent;
				}
				startActivity(resumeIntent);
			}

			// Destroy this activity before it is shown.
			finish();

			// Disable activity's exit animation. (Looks bad if we keep it on a Pixel XL.)
			// Note: Must be done after calling finish() above.
			overridePendingTransition(android.R.anim.fade_in, 0);
			return;
		}

		// *** This is the only Titanium root activity instance. ***

		// If this is a normal activity (not launched via startActivityForResult() method),
		// then make sure it was launched via main intent and the Titanium runtime is not still active.
		if (!isActivityForResult) {
			KrollRuntime krollRuntime = KrollRuntime.getInstance();
			boolean isRuntimeActive = (krollRuntime != null) && TiRootActivity.isScriptRunning();
			boolean isNotMainIntent = (newIntent == null) || !newIntent.filterEquals(mainIntent);
			if ((isRuntimeActive && isNotRestoringActivity) || isNotMainIntent) {
				// Destroy this activity instance.
				this.isDuplicateInstance = true;
				activityOnCreate(savedInstanceState);
				finish();
				overridePendingTransition(android.R.anim.fade_in, 0);

				// Set up an intent to relaunch this root activity.
				final Intent relaunchIntent = isNotMainIntent ? mainIntent : newIntent;
				if (isNotMainIntent && (newIntent != null)) {
					// Embed this destroyed activity's intent within the new launch intent.
					if (newIntent.hasExtra(TiC.EXTRA_TI_NEW_INTENT)) {
						try {
							Object extraIntent = newIntent.getParcelableExtra(TiC.EXTRA_TI_NEW_INTENT);
							relaunchIntent.putExtra(TiC.EXTRA_TI_NEW_INTENT, (Intent) extraIntent);
						} catch (Exception ex) {
						}
					}
					if (!relaunchIntent.hasExtra(TiC.EXTRA_TI_NEW_INTENT)) {
						relaunchIntent.putExtra(TiC.EXTRA_TI_NEW_INTENT, newIntent);
					}
				}

				// Re-launch this activity.
				if (isRuntimeActive) {
					// Wait for previous Titanium JavaScript runtime to be terminated before relaunching.
					// Note: This happens if previous root activity is missing, but all child activities still exist.
					//       Launching with FLAG_ACTIVITY_CLEAR_TOP while app is backgrounded will always do this.
					KrollRuntime.addOnDisposingListener(new KrollRuntime.OnDisposingListener() {
						@Override
						public void onDisposing(KrollRuntime runtime)
						{
							// Remove this listener.
							KrollRuntime.removeOnDisposingListener(this);

							// Relaunch root activity.
							// Note: If system setting "Don't keep activities" is on, then we need CLEAR_TOP flag
							//       to "finish" any temporarily destroyed activities so that they won't be restored.
							relaunchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
							startActivity(relaunchIntent);
						}
					});
					if (KrollRuntime.getActivityRefCount() > 0) {
						Activity currentActvitiy = getTiApp().getCurrentActivity();
						if (currentActvitiy != null) {
							currentActvitiy.finishAffinity();
						}
						TiApplication.terminateActivityStack();
					} else {
						krollRuntime.dispose();
					}
				} else {
					// Immediately relaunch with main intent.
					startActivity(relaunchIntent);
				}
				return;
			}
		}

		// Initialize this activity and start up the Titanium JavaScript runtime.
		tiApp.setCurrentActivity(this, this);
		tiApp.setRootActivity(this);
		super.onCreate(savedInstanceState);
		if (isNotRestoringActivity) {
			tiApp.verifyCustomModules(this);
		}

		// Invoke activity's onNewIntent() behavior if above code bundled an extra intent into it.
		// This happens if activity was initially created with a non-main launcher intent, such as a URL scheme.
		if (isNotRestoringActivity && (newIntent != null) && newIntent.hasExtra(TiC.EXTRA_TI_NEW_INTENT)) {
			try {
				Object object = newIntent.getParcelableExtra(TiC.EXTRA_TI_NEW_INTENT);
				if (object instanceof Intent) {
					onNewIntent((Intent) object);
				}
			} catch (Exception ex) {
				Log.e(TAG, "Failed to parse: " + TiC.EXTRA_TI_NEW_INTENT, ex);
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
	protected void onNewIntent(Intent intent)
	{
		// Let base class handle the new intent first.
		// Will update activity proxy's "intent" property and fire a Titanium "newintent" event.
		super.onNewIntent(intent);

		// Notify all onNewIntent() listeners.
		// Note: Use a shallow copy of collection since invoked listener can add/remove to main collection.
		ArrayList<OnNewIntentListener> clonedListeners =
			(ArrayList<OnNewIntentListener>) this.newIntentListeners.clone();
		if (clonedListeners != null) {
			for (OnNewIntentListener listener : clonedListeners) {
				if (this.newIntentListeners.contains(listener)) {
					listener.onNewIntent(this, intent);
				}
			}
		}

		// Handle the intent if set.
		if (intent != null) {
			// If this is a shortcut intent, then fire a Titanium App "shortcutitemclick" event.
			String shortcutId = intent.getStringExtra(TiC.EVENT_PROPERTY_SHORTCUT);
			if (shortcutId != null) {
				KrollModule appModule = getTiApp().getModuleByName("App");
				if (appModule != null) {
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_ID, shortcutId);
					appModule.fireEvent(TiC.EVENT_SHORTCUT_ITEM_CLICK, data);
				}
			}

			// If this is a JSActivity intent, then execute its JavaScript file after "app.js" has been executed.
			try {
				ComponentName componentName = intent.getComponent();
				String className = (componentName != null) ? componentName.getClassName() : null;
				if ((className != null) && !className.equals(getClass().getName())) {
					if (TiLaunchActivity.class.isAssignableFrom(Class.forName(className))) {
						// The intent's class name is a TiJSActivity derived class. Fetch its script URL.
						String url = getUrlForJSActivitClassName(className);
						if (url != null) {
							url = resolveUrl(url);
						}
						final String scriptUrl = url;
						if (scriptUrl != null) {
							// JavaScript file URL was found. Execute it, but only after "app.js" has been execute.
							// Needed for Alloy apps which add their Alloy globals via generated "app.js".
							Runnable runnable = new Runnable() {
								@Override
								public void run()
								{
									if (activityProxy == null) {
										return;
									}
									byte[] scriptSource = KrollAssetHelper.readAssetBytes(scriptUrl);
									KrollRuntime.getInstance().runModuleBytes(scriptSource, scriptUrl, activityProxy);
								}
							};
							if (this.wasRuntimeStarted) {
								runnable.run();
							} else {
								this.pendingRuntimeRunnables.add(runnable);
							}
						}
					}
				}
			} catch (Exception ex) {
				Log.e(TAG, "Error in onNewIntent() scanning for JSActivity.", ex);
			}
		}
	}

	protected void loadScript()
	{
		// Do not continue if this activity's script has already been loaded.
		if (TiRootActivity.isScriptRunning) {
			return;
		}

		// Add a Titanium App module "started" event listener. Will be fired after "app.js" has been executed.
		KrollModule appModule = getTiApp().getModuleByName("App");
		if (appModule != null) {
			this.runtimeStartedListenerId = appModule.addEventListener(TiC.EVENT_STARTED, new KrollEventCallback() {
				@Override
				public void call(Object data)
				{
					// Flag that the Titanium runtime was started.
					TiRootActivity.this.wasRuntimeStarted = true;

					// Remove this listener from the "Ti.App" module.
					KrollModule appModule = getTiApp().getModuleByName("App");
					if (appModule != null) {
						appModule.removeEventListener(TiC.EVENT_STARTED, runtimeStartedListenerId);
					}
					runtimeStartedListenerId = KrollProxy.INVALID_EVENT_LISTENER_ID;

					// Execute any pending runnables that are waiting for the runtime to be ready.
					// Note: A runnable can destroy the root activity and terminate runtime.
					Runnable nextRunnable;
					while ((nextRunnable = pendingRuntimeRunnables.poll()) != null) {
						if (getTiApp().isRootActivityAvailable() == false) {
							pendingRuntimeRunnables.clear();
							break;
						}
						nextRunnable.run();
					}
				}
			});
		}

		// Add a listener to be invoked just before the Titanium runtime has been disposed/terminated.
		KrollRuntime.addOnDisposingListener(new KrollRuntime.OnDisposingListener() {
			@Override
			public void onDisposing(KrollRuntime runtime)
			{
				// Remove this listener.
				KrollRuntime.removeOnDisposingListener(this);

				// Remove any queued runnables since their assigned runtime is about to be terminated.
				pendingRuntimeRunnables.clear();

				// Remove the Ti.App "started" event listener in case it was not fired.
				if (runtimeStartedListenerId != KrollProxy.INVALID_EVENT_LISTENER_ID) {
					KrollModule appModule = getTiApp().getModuleByName("App");
					if (appModule != null) {
						appModule.removeEventListener(TiC.EVENT_STARTED, runtimeStartedListenerId);
					}
					runtimeStartedListenerId = KrollProxy.INVALID_EVENT_LISTENER_ID;
				}
			}
		});

		// Load the main Titanium script.
		super.loadScript();
		TiRootActivity.isScriptRunning = true;
	}

	@Override
	protected void onResume()
	{
		Log.checkpoint(TAG, "checkpoint, on root activity resume. activity = " + this);

		// Fire a Titanium "onIntent" event the first time the root activity was brought to the foreground.
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

	/**
	 * Determines if Titanium's main script has been loaded and currently running by this activity.
	 * <p>
	 * Note that this can be true after this root activity has been destroyed.
	 * This can happen if we're in the middle of destroying the entire activity stack, which is the typical case.
	 * Can also happen if Android developer option "Don't keep activities" is enabled which temporarily destroys
	 * parent activities, but they'll be restored by the OS when back navigating.
	 * @return
	 * Returns true if Titanium's main script has been loaded by this activity and is actively running.
	 * <p>
	 * Returns false if script has never been loaded or has been terminated after all activities have been destroyed.
	 */
	public static boolean isScriptRunning()
	{
		return TiRootActivity.isScriptRunning;
	}

	/**
	 * Determine if an existing activity can be resumed with the given intent via startActivity() method.
	 * <p>
	 * For example, an intent flag such as "FLAG_ACTIVITY_MULTIPLE_TASK" always creates a new activity instance
	 * even if an existing activity with a matching intent already exists. This makes resumes impossible.
	 * @param intent The intent to be checked. Can be null.
	 * @return
	 * Returns true if an activity can be resumed based on given intent's flags.
	 * <p>
	 * Returns false if impossible to resume or if given a null argument.
	 */
	private static boolean canResumeActivityUsing(Intent intent)
	{
		if (intent != null) {
			final int BAD_FLAGS = (Intent.FLAG_ACTIVITY_MULTIPLE_TASK | Intent.FLAG_ACTIVITY_NEW_DOCUMENT);
			if ((intent.getFlags() & BAD_FLAGS) == 0) {
				return true;
			}
		}
		return false;
	}
}
