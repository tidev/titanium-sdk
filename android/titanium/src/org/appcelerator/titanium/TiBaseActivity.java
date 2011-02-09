/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMenuSupport;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiWeakList;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

public abstract class TiBaseActivity extends Activity 
	implements TiActivitySupport, ITiWindowHandler
{
	private static final String TAG = "TiBaseActivity";
	private static final boolean DBG = TiConfig.LOGD;

	private boolean onDestroyFired = false;

	protected TiCompositeLayout layout;
	protected TiActivitySupportHelper supportHelper;
	protected TiWindowProxy window;
	protected ActivityProxy activityProxy;
	protected boolean mustFireInitialFocus;
	protected TiWeakList<ConfigurationChangedListener> configChangedListeners = new TiWeakList<ConfigurationChangedListener>();
	protected OrientationEventListener orientationListener;
	protected int orientationDegrees;
	protected int orientationOverride = -1;
	protected TiMenuSupport menuHelper;
	protected TiMessageQueue messageQueue;
	protected Messenger messenger;
	protected int msgActivityCreatedId = -1;
	protected int msgId = -1;

	public static interface ConfigurationChangedListener
	{
		public void onConfigurationChanged(TiBaseActivity activity, Configuration newConfig);
	}

	public TiApplication getTiApp()
	{
		return (TiApplication) getApplication();
	}

	public void setWindowProxy(TiWindowProxy proxy)
	{
		this.window = proxy;
		updateTitle();
		updateOrientation();
	}

	public void updateOrientation()
	{
		if (window == null) return;
		// This forces orientation so that it won't change unless it's allowed
		// when using the "orientationModes" property
		if (window.getOrientationModes().length > 0) {
			int orientation = getResources().getConfiguration().orientation;
			if (window.isOrientationMode(orientation)) {
				setRequestedOrientation(orientation);
			} else {
				setRequestedOrientation(TiUIHelper.convertToAndroidOrientation(window.getOrientationModes()[0]));
			}
		}
	}

	public ActivityProxy getActivityProxy()
	{
		return activityProxy;
	}

	public void setActivityProxy(ActivityProxy proxy)
	{
		this.activityProxy = proxy;
	}

	public TiCompositeLayout getLayout()
	{
		return layout;
	}

	public void addConfigurationChangedListener(ConfigurationChangedListener listener)
	{
		configChangedListeners.add(new WeakReference<ConfigurationChangedListener>(listener));
	}

	public void removeConfigurationChangedListener(ConfigurationChangedListener listener)
	{
		configChangedListeners.remove(listener);
	}

	protected boolean getIntentBoolean(String property, boolean defaultValue)
	{
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(property)) {
				return intent.getBooleanExtra(property, defaultValue);
			}
		}
		return defaultValue;
	}

	protected int getIntentInt(String property, int defaultValue)
	{
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(property)) {
				return intent.getIntExtra(property, defaultValue);
			}
		}
		return defaultValue;
	}

	protected String getIntentString(String property, String defaultValue)
	{
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(property)) {
				return intent.getStringExtra(property);
			}
		}
		return defaultValue;
	}

	public void fireInitialFocus()
	{
		if (mustFireInitialFocus && window != null) {
			mustFireInitialFocus = false;
			window.fireEvent(TiC.EVENT_FOCUS, null);
		}
	}

	protected void updateTitle()
	{
		if (window == null) return;

		if (window.hasProperty(TiC.PROPERTY_TITLE)) {
			String oldTitle = (String) getTitle();
			String newTitle = TiConvert.toString(window.getProperty(TiC.PROPERTY_TITLE));
			if (oldTitle == null) {
				oldTitle = "";
			}
			if (newTitle == null) {
				newTitle = "";
			}
			if (!newTitle.equals(oldTitle)) {
				final String fnewTitle = newTitle;
				runOnUiThread(new Runnable(){
					@Override
					public void run() {
						setTitle(fnewTitle);
					}
				});
			}
		}
	}

	// Subclasses can override to provide a custom layout
	protected TiCompositeLayout createLayout()
	{
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		String layoutFromIntent = getIntentString(TiC.INTENT_PROPERTY_LAYOUT, "");
		if (layoutFromIntent.equals(TiC.LAYOUT_HORIZONTAL)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		} else if (layoutFromIntent.equals(TiC.LAYOUT_VERTICAL)) {
			arrangement = LayoutArrangement.VERTICAL;
		}
		return new TiCompositeLayout(this, arrangement);
	}

	protected void setFullscreen(boolean fullscreen)
	{
		if (fullscreen) {
			getWindow().setFlags(
				WindowManager.LayoutParams.FLAG_FULLSCREEN,
				WindowManager.LayoutParams.FLAG_FULLSCREEN);
		}
	}

	protected void setNavBarHidden(boolean hidden)
	{
		if (!hidden) {
			this.requestWindowFeature(Window.FEATURE_LEFT_ICON); // TODO Keep?
			this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
			this.requestWindowFeature(Window.FEATURE_PROGRESS);
			this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
		} else {
			this.requestWindowFeature(Window.FEATURE_NO_TITLE);
		}
	}

	// Subclasses can override to handle post-creation (but pre-message fire) logic
	protected void windowCreated()
	{
		boolean fullscreen = getIntentBoolean(TiC.PROPERTY_FULLSCREEN, false);
		boolean navBarHidden = getIntentBoolean(TiC.PROPERTY_NAV_BAR_HIDDEN, false);
		boolean modal = getIntentBoolean(TiC.PROPERTY_MODAL, false);
		int softInputMode = getIntentInt(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, -1);
		boolean hasSoftInputMode = softInputMode != -1;
		
		if (!modal) {
			setFullscreen(fullscreen);
			setNavBarHidden(navBarHidden);
		} else {
			int flags = WindowManager.LayoutParams.FLAG_BLUR_BEHIND;
			getWindow().setFlags(flags, flags);
		}

		if (hasSoftInputMode) {
			if (DBG) {
				Log.d(TAG, "windowSoftInputMode: " + softInputMode);
			}
			getWindow().setSoftInputMode(softInputMode);
		}

		boolean useActivityWindow = getIntentBoolean(TiC.INTENT_PROPERTY_USE_ACTIVITY_WINDOW, false);
		if (useActivityWindow) {
			int windowId = getIntentInt(TiC.INTENT_PROPERTY_WINDOW_ID, -1);
			TiActivityWindows.windowCreated(this, windowId);
		}
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		messageQueue = TiMessageQueue.getMessageQueue();
		if (DBG) {
			Log.d(TAG, "Activity " + this + " onCreate");
		}

		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(TiC.INTENT_PROPERTY_MESSENGER)) {
				messenger = (Messenger) intent.getParcelableExtra(TiC.INTENT_PROPERTY_MESSENGER);
				msgActivityCreatedId = intent.getIntExtra(TiC.INTENT_PROPERTY_MSG_ACTIVITY_CREATED_ID, -1);
				msgId = intent.getIntExtra(TiC.INTENT_PROPERTY_MSG_ID, -1);
			}
		}

		// Doing this on every create in case the activity is externally created.
		TiPlatformHelper.intializeDisplayMetrics(this);
		orientationListener = new OrientationEventListener(this) {
			@Override
			public void onOrientationChanged(int orientation) {
				TiBaseActivity.this.onOrientationChanged(orientation);
			}
		};

		layout = createLayout();
		super.onCreate(savedInstanceState);
		getTiApp().setWindowHandler(this);
		getTiApp().setCurrentActivity(this, this);
		windowCreated();

		if (activityProxy != null) {
			activityProxy.fireSyncEvent(TiC.EVENT_CREATE, null);
		}

		setContentView(layout);

		sendMessage(msgActivityCreatedId);
		// for backwards compatibility
		sendMessage(msgId);
	}

	protected void sendMessage(final int msgId)
	{
		if (messenger == null || msgId == -1) return;
		// fire an async message on this thread's queue
		// so we don't block onCreate() from returning
		messageQueue.post(new Runnable() {
			@Override
			public void run() {
				handleSendMessage(msgId);
			}
		});
	}

	protected void handleSendMessage(int msgId)
	{
		try {
			Message msg = messageQueue.getHandler().obtainMessage(msgId, this);
			messenger.send(msg);
		} catch (RemoteException e) {
			Log.e(TAG, "Unable to message creator. finishing.", e);
			finish();
		} catch (RuntimeException e) {
			Log.e(TAG, "Unable to message creator. finishing.", e);
			finish();
		}
	}

	protected TiActivitySupportHelper getSupportHelper()
	{
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		return supportHelper;
	}

	// Activity Support
	public int getUniqueResultCode()
	{
		return getSupportHelper().getUniqueResultCode();
	}

	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler resultHandler)
	{
		getSupportHelper().launchActivityForResult(intent, code, resultHandler);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data)
	{
		super.onActivityResult(requestCode, resultCode, data);
		getSupportHelper().onActivityResult(requestCode, resultCode, data);
	}

	@Override
	public void addWindow(View v, TiCompositeLayout.LayoutParams params)
	{
		layout.addView(v, params);
	}

	@Override
	public void removeWindow(View v)
	{
		layout.removeView(v);
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event) 
	{
		boolean handled = false;
		if (window == null) {
			return super.dispatchKeyEvent(event);
		}
		switch(event.getKeyCode()) {
			case KeyEvent.KEYCODE_BACK : {
				if (window.hasListeners(TiC.EVENT_ANDROID_BACK)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_BACK, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_CAMERA : {
				if (window.hasListeners(TiC.EVENT_ANDROID_CAMERA)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_CAMERA, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_FOCUS : {
				if (window.hasListeners(TiC.EVENT_ANDROID_FOCUS)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_FOCUS, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_SEARCH : {
				if (window.hasListeners(TiC.EVENT_ANDROID_SEARCH)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_SEARCH, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_VOLUME_UP : {
				if (window.hasListeners(TiC.EVENT_ANDROID_VOLUP)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_VOLUP, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_VOLUME_DOWN : {
				if (window.hasListeners(TiC.EVENT_ANDROID_VOLDOWN)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_VOLDOWN, null);
					}
					handled = true;
				}
				break;
			}
		}
			
		if (!handled) {
			handled = super.dispatchKeyEvent(event);
		}
		return handled;
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu)
	{
		if (menuHelper == null) {
			menuHelper = new TiMenuSupport(activityProxy);
		}
		return menuHelper.onCreateOptionsMenu(super.onCreateOptionsMenu(menu), menu);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item)
	{
		return menuHelper.onOptionsItemSelected(item);
	}

	@Override
	public boolean onPrepareOptionsMenu(Menu menu)
	{
		return menuHelper.onPrepareOptionsMenu(super.onPrepareOptionsMenu(menu), menu);
	}

	public int getOrientationDegrees()
	{
		return orientationDegrees;
	}

	public void overrideOrientation(int orientation)
	{
		// override the orientation until it's matched, then go back to detecting
		// this matches iPhone's behavior (hoop -> jump)
		orientationOverride = orientation;
		setRequestedOrientation(orientation);
	}

	public void enableOrientationListener()
	{
		orientationListener.enable();
	}

	public void disableOrientationListener()
	{
		orientationListener.disable();
	}

	protected void onOrientationChanged(int degrees)
	{
		// once setRequestedOrientation is called, onConfigurationChanged is no longer called
		// with new orientation changes from the OS. OrientationEventListener goes through
		// the SensorManager directly, and allows us to reset correctly
		orientationDegrees = degrees;
		if (degrees != OrientationEventListener.ORIENTATION_UNKNOWN) {
			if (window != null) {
				if (window.getOrientationModes().length > 0) {
					int currentOrientation;
					if (degrees >= 225 && degrees < 315) {
						// disable "landscape left", there's no way to forcefully set it
						//|| (degrees >= 45 && degrees < 135)) {
						currentOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
					} else {
						currentOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
					}
					if (window.isOrientationMode(currentOrientation)) {
						// Orientation fits with allowed -- setting it
						setRequestedOrientation(currentOrientation);
						if (orientationOverride != -1) {
							// And now that we're in an allowable orientation, we can clear the override.
							orientationOverride = -1;
						}
					} else {
						// The current orientation is not one of the allowable ones.  If it's also not
						// the override orientation, need to set to one of the allowables.
						if (currentOrientation == orientationOverride) {
							setRequestedOrientation(currentOrientation);
						} else {
							// current orientation is neither allowable nor the override.  Set
							// to first allowable.
							setRequestedOrientation(TiUIHelper.convertToAndroidOrientation(window.getOrientationModes()[0]));
							if (orientationOverride != -1) {
								// And again we can clear the override since we're now in an allowable
								orientationOverride = -1;
							}
						}
					}
				}
			}
		}
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);
		for (WeakReference<ConfigurationChangedListener> listener : configChangedListeners) {
			if (listener.get() != null) {
				listener.get().onConfigurationChanged(this, newConfig);
			}
		}
	}

	@Override
	protected void onPause() 
	{
		super.onPause();
		if (DBG) {
			Log.d(TAG, "Activity " + this + " onPause");
		}

		getTiApp().setWindowHandler(null);
		getTiApp().setCurrentActivity(this, null);
		if (activityProxy != null) {
			activityProxy.fireSyncEvent(TiC.EVENT_PAUSE, null);
		}
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		if (DBG) {
			Log.d(TAG, "Activity " + this + " onResume");
		}
		getTiApp().setWindowHandler(this);
		getTiApp().setCurrentActivity(this, this);
		if (activityProxy != null) {
			activityProxy.fireSyncEvent(TiC.EVENT_RESUME, null);
		}
	}

	@Override
	protected void onStart()
	{
		super.onStart();
		if (DBG) {
			Log.d(TAG, "Activity " + this + " onStart");
		}
		updateTitle();
		
		if (window != null) {
			window.fireEvent(TiC.EVENT_FOCUS, null);
		} else {
			mustFireInitialFocus = true;
		}
		if (activityProxy != null) {
			activityProxy.fireSyncEvent(TiC.EVENT_START, null);
		}
	}

	@Override
	protected void onStop()
	{
		super.onStop();
		if (DBG) {
			Log.d(TAG, "Activity " + this + " onStop");
		}
		if (window != null) {
			window.fireEvent(TiC.EVENT_BLUR, null);
		}
		if (activityProxy != null) {
			activityProxy.fireSyncEvent(TiC.EVENT_STOP, null);
		}
	}

	@Override
	protected void onRestart()
	{
		super.onRestart();
		if (DBG) {
			Log.d(TAG, "Activity " + this + " onRestart");
		}
		if (activityProxy != null) {
			activityProxy.fireSyncEvent(TiC.EVENT_RESTART, null);
		}
	}

	@Override
	protected void onDestroy()
	{
		if (DBG) {
			Log.d(TAG, "Activity " + this + " onDestroy");
		}
		super.onDestroy();
		fireOnDestroy();

		if (orientationListener != null) {
			orientationListener.disable();
		}
		if (layout != null) {
			Log.e(TAG, "Layout cleanup.");
			layout.removeAllViews();
			layout = null;
		}
		if (window != null) {
			window.closeFromActivity();
			window = null;
		}
		if (menuHelper != null) {
			menuHelper.destroy();
			menuHelper = null;
		}
		if (activityProxy != null) {
			activityProxy.release();
			activityProxy = null;
		}
	}

	// called in order to ensure that the onDestroy call is only acted upon once.
	// should be called by any subclass
	protected void fireOnDestroy()
	{
		if (!onDestroyFired) {
			if (activityProxy != null) {
				activityProxy.fireSyncEvent(TiC.EVENT_DESTROY, null);
			}
			onDestroyFired = true;
		}
	}

	protected boolean shouldFinishRootActivity()
	{
		return getIntentBoolean(TiC.INTENT_PROPERTY_FINISH_ROOT, false);
	}

	@Override
	public void finish()
	{
		if (window != null) {
			KrollDict data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_SOURCE, window);
			window.fireEvent(TiC.EVENT_CLOSE, data);
		}

		boolean animate = getIntentBoolean(TiC.PROPERTY_ANIMATE, true);
		if (shouldFinishRootActivity()) {
			TiApplication app = getTiApp();
			if (app != null) {
				TiRootActivity rootActivity = app.getRootActivity();
				if (rootActivity != null) {
					rootActivity.finish();
				}
			}
		}

		super.finish();
		if (!animate) {
			TiUIHelper.overridePendingTransition(this);
		}
	}
}
