/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.ref.WeakReference;
import java.util.Iterator;
import java.util.Stack;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.TiLifecycle.OnWindowFocusChangedEvent;
import org.appcelerator.titanium.TiLifecycle.interceptOnBackPressedEvent;
import org.appcelerator.titanium.TiLifecycle.OnActivityResultEvent;
import org.appcelerator.titanium.TiLifecycle.OnInstanceStateEvent;
import org.appcelerator.titanium.TiLifecycle.OnCreateOptionsMenuEvent;
import org.appcelerator.titanium.TiLifecycle.OnPrepareOptionsMenuEvent;
import org.appcelerator.titanium.proxy.ActionBarProxy;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.proxy.TiToolbarProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMenuSupport;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiWeakList;
import org.appcelerator.titanium.view.TiActionBarStyleHandler;
import org.appcelerator.titanium.view.TiActivitySafeAreaMonitor;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;

import android.app.Activity;
import android.support.v7.app.AppCompatActivity;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.os.Messenger;
import android.os.PowerManager;
import android.os.RemoteException;
import android.support.v7.widget.Toolbar;
import android.util.DisplayMetrics;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.Surface;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.ViewGroup.LayoutParams;

/**
 * The base class for all non tab Titanium activities. To learn more about Activities, see the
 * <a href="http://developer.android.com/reference/android/app/Activity.html">Android Activity documentation</a>.
 */
public abstract class TiBaseActivity extends AppCompatActivity implements TiActivitySupport /*, ITiWindowHandler*/
{
	private static final String TAG = "TiBaseActivity";

	private boolean onDestroyFired = false;
	private int originalOrientationMode = -1;
	private boolean inForeground = false; // Indicates whether this activity is in foreground or not.
	private TiWeakList<OnLifecycleEvent> lifecycleListeners = new TiWeakList<OnLifecycleEvent>();
	private TiWeakList<OnWindowFocusChangedEvent> windowFocusChangedListeners =
		new TiWeakList<OnWindowFocusChangedEvent>();
	private TiWeakList<interceptOnBackPressedEvent> interceptOnBackPressedListeners =
		new TiWeakList<interceptOnBackPressedEvent>();
	private TiWeakList<OnInstanceStateEvent> instanceStateListeners = new TiWeakList<OnInstanceStateEvent>();
	private TiWeakList<OnActivityResultEvent> onActivityResultListeners = new TiWeakList<OnActivityResultEvent>();
	private TiWeakList<OnCreateOptionsMenuEvent> onCreateOptionsMenuListeners =
		new TiWeakList<OnCreateOptionsMenuEvent>();
	private TiWeakList<OnPrepareOptionsMenuEvent> onPrepareOptionsMenuListeners =
		new TiWeakList<OnPrepareOptionsMenuEvent>();
	private boolean sustainMode = false;
	private TiActionBarStyleHandler actionBarStyleHandler;
	private TiActivitySafeAreaMonitor safeAreaMonitor;

	public static class PermissionContextData
	{
		private final Integer requestCode;
		private final KrollObject context;
		private final KrollFunction callback;

		public PermissionContextData(Integer requestCode, KrollFunction callback, KrollObject context)
		{
			this.requestCode = requestCode;
			this.callback = callback;
			this.context = context;
		}

		public Integer getRequestCode()
		{
			return requestCode;
		}

		public KrollFunction getCallback()
		{
			return callback;
		}

		public KrollObject getContext()
		{
			return context;
		}
	}

	private static ConcurrentHashMap<Integer, PermissionContextData> callbackDataByPermission =
		new ConcurrentHashMap<Integer, PermissionContextData>();

	protected View layout;
	protected TiActivitySupportHelper supportHelper;
	protected int supportHelperId = -1;
	protected TiWindowProxy window;
	protected TiViewProxy view;
	protected ActivityProxy activityProxy;
	protected TiWeakList<ConfigurationChangedListener> configChangedListeners =
		new TiWeakList<ConfigurationChangedListener>();
	protected TiMenuSupport menuHelper;
	protected Messenger messenger;
	protected int msgActivityCreatedId = -1;
	protected int msgId = -1;
	//Storing the activity's dialogs and their persistence
	private CopyOnWriteArrayList<DialogWrapper> dialogs = new CopyOnWriteArrayList<DialogWrapper>();
	private Stack<TiWindowProxy> windowStack = new Stack<TiWindowProxy>();
	private static int totalWindowStack = 0;

	public TiWindowProxy lwWindow;
	public boolean isResumed = false;

	public static boolean canFinishRoot = true;

	private boolean overridenLayout;

	public class DialogWrapper
	{
		boolean isPersistent;
		Dialog dialog;

		WeakReference<TiBaseActivity> dialogActivity;

		public DialogWrapper(Dialog d, boolean persistent, WeakReference<TiBaseActivity> activity)
		{
			isPersistent = persistent;
			dialog = d;
			dialogActivity = activity;
		}

		public TiBaseActivity getActivity()
		{
			if (dialogActivity == null) {
				return null;
			} else {
				return dialogActivity.get();
			}
		}

		public void setActivity(WeakReference<TiBaseActivity> da)
		{
			dialogActivity = da;
		}

		public Dialog getDialog()
		{
			return dialog;
		}

		public void setDialog(Dialog d)
		{
			dialog = d;
		}

		public void release()
		{
			dialog = null;
			dialogActivity = null;
		}

		public boolean getPersistent()
		{
			return isPersistent;
		}

		public void setPersistent(boolean p)
		{
			isPersistent = p;
		}
	}

	public void addWindowToStack(TiWindowProxy proxy)
	{
		if (windowStack.contains(proxy)) {
			Log.e(TAG, "Window already exists in stack", Log.DEBUG_MODE);
			return;
		}
		boolean isEmpty = windowStack.empty();
		if (!isEmpty) {
			windowStack.peek().onWindowFocusChange(false);
		}
		windowStack.add(proxy);
		totalWindowStack++;
		if (!isEmpty) {
			proxy.onWindowFocusChange(true);
		}
	}

	public void removeWindowFromStack(TiWindowProxy proxy)
	{
		proxy.onWindowFocusChange(false);

		boolean isTopWindow = ((!windowStack.isEmpty()) && (windowStack.peek() == proxy)) ? true : false;
		windowStack.remove(proxy);
		totalWindowStack--;

		//Fire focus only if activity is not paused and the removed window was topWindow
		if (!windowStack.empty() && isResumed && isTopWindow) {
			TiWindowProxy nextWindow = windowStack.peek();
			nextWindow.onWindowFocusChange(true);
		}
	}

	public void resetTotalWindowStack()
	{
		totalWindowStack = 0;
	}

	/**
	 * Returns the window at the top of the stack.
	 * @return the top window or null if the stack is empty.
	 */
	public TiWindowProxy topWindowOnStack()
	{
		return (windowStack.isEmpty()) ? null : windowStack.peek();
	}

	public static interface ConfigurationChangedListener {
		public void onConfigurationChanged(TiBaseActivity activity, Configuration newConfig);
	}

	/**
	 * @return the instance of TiApplication.
	 */
	public TiApplication getTiApp()
	{
		return (TiApplication) getApplication();
	}

	/**
	 * @return the window proxy associated with this activity.
	 */
	public TiWindowProxy getWindowProxy()
	{
		return this.window;
	}

	/**
	 * Sets the window proxy.
	 * @param proxy
	 */
	public void setWindowProxy(TiWindowProxy proxy)
	{
		this.window = proxy;
	}

	/**
	 * Sets the proxy for our layout (used for post layout event)
	 *
	 * @param proxy
	 */
	public void setLayoutProxy(TiViewProxy proxy)
	{
		if (layout instanceof TiCompositeLayout) {
			((TiCompositeLayout) layout).setProxy(proxy);
		}
	}

	/**
	 * Sets the view proxy.
	 * @param proxy
	 */
	public void setViewProxy(TiViewProxy proxy)
	{
		this.view = proxy;
	}

	/**
	 * @return activity proxy associated with this activity.
	 */
	public ActivityProxy getActivityProxy()
	{
		return activityProxy;
	}

	public void addDialog(DialogWrapper d)
	{
		if (!dialogs.contains(d)) {
			dialogs.add(d);
		}
	}

	public void removeDialog(Dialog d)
	{
		for (int i = 0; i < dialogs.size(); i++) {
			DialogWrapper p = dialogs.get(i);
			if (p.getDialog().equals(d)) {
				p.release();
				dialogs.remove(i);
				return;
			}
		}
	}
	public void setActivityProxy(ActivityProxy proxy)
	{
		this.activityProxy = proxy;
	}

	/**
	 * @return the activity's current layout.
	 */
	public View getLayout()
	{
		return layout;
	}

	public void setLayout(View layout)
	{
		this.layout = layout;
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

	protected void updateTitle()
	{
		if (window == null)
			return;

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
				runOnUiThread(new Runnable() {
					public void run()
					{
						setTitle(fnewTitle);
					}
				});
			}
		}
	}

	// Subclasses can override to provide a custom layout
	protected View createLayout()
	{
		// Set up the view's layout.
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		String layoutFromIntent = getIntentString(TiC.INTENT_PROPERTY_LAYOUT, "");
		if (layoutFromIntent.equals(TiC.LAYOUT_HORIZONTAL)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		} else if (layoutFromIntent.equals(TiC.LAYOUT_VERTICAL)) {
			arrangement = LayoutArrangement.VERTICAL;
		}

		// Create the root view to be used by the activity.
		// - Set the layout's proxy to null for now. Will be set later via setWindowProxy().
		// - Make it focusable so Android won't auto-focus on the first focusable child view in the window.
		//   This makes it match iOS' behavior where no child view has the focus when a window is opened.
		TiCompositeLayout compositeLayout = new TiCompositeLayout(this, arrangement, null);
		compositeLayout.setFocusable(true);
		compositeLayout.setFocusableInTouchMode(true);
		compositeLayout.setDescendantFocusability(TiCompositeLayout.FOCUS_BEFORE_DESCENDANTS);
		return compositeLayout;
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults)
	{
		if (!callbackDataByPermission.isEmpty()) {
			handlePermissionRequestResult(requestCode, permissions, grantResults);
		}
	}

	private void handlePermissionRequestResult(Integer requestCode, String[] permissions, int[] grantResults)
	{
		PermissionContextData cbd = callbackDataByPermission.get(requestCode);
		if (cbd == null) {
			return;
		}

		String deniedPermissions = "";
		for (int i = 0; i < grantResults.length; ++i) {
			if (grantResults[i] == PackageManager.PERMISSION_DENIED) {
				if (deniedPermissions.isEmpty()) {
					deniedPermissions = permissions[i];
				} else {
					deniedPermissions = deniedPermissions + ", " + permissions[i];
				}
			}
		}

		KrollDict response = new KrollDict();

		if (deniedPermissions.isEmpty()) {
			response.putCodeAndMessage(0, null);
		} else {
			response.putCodeAndMessage(-1, "Permission(s) denied: " + deniedPermissions);
		}

		KrollFunction callback = cbd.getCallback();
		if (callback != null) {
			KrollObject context = cbd.getContext();
			if (context == null) {
				Log.w(TAG, "Permission callback context object is null");
			}
			callback.callAsync(context, response);
		} else {
			Log.w(TAG, "Permission callback function has not been set");
		}
	}

	/**
	 * register permission request result callback for activity
	 *
	 * @param requestCode request code (8 Bit) to associate callback with request
	 * @param callback callback function which receives a KrollDict with success,
	 *                 code, optional message and requestCode
	 * @param context KrollObject as required by async callback pattern
	 */
	public static void registerPermissionRequestCallback(Integer requestCode, KrollFunction callback,
														 KrollObject context)
	{
		if (callback != null && context != null) {
			callbackDataByPermission.put(requestCode, new PermissionContextData(requestCode, callback, context));
		}
	}

	protected void setFullscreen(boolean fullscreen)
	{
		if (fullscreen) {
			//getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
			View decorView = getWindow().getDecorView();
			// Hide both the navigation bar and the status bar.
			// SYSTEM_UI_FLAG_FULLSCREEN is only available on Android 4.1 and higher, but as
			// a general rule, you should design your app to hide the status bar whenever you
			// hide the navigation bar.
			int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN;
			decorView.setSystemUiVisibility(uiOptions);
		}
	}

	// Subclasses can override to handle post-creation (but pre-message fire) logic
	@SuppressWarnings("deprecation")
	protected void windowCreated(Bundle savedInstanceState)
	{
		boolean fullscreen = getIntentBoolean(TiC.PROPERTY_FULLSCREEN, false);
		boolean modal = getIntentBoolean(TiC.PROPERTY_MODAL, false);
		int softInputMode = getIntentInt(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, -1);
		int windowFlags = getIntentInt(TiC.PROPERTY_WINDOW_FLAGS, 0);
		boolean hasSoftInputMode = softInputMode != -1;

		setFullscreen(fullscreen);

		// Add additional window flags to better handle fullscreen support on devices with notches.
		{
			// Fetch flags.
			int uiFlags = getWindow().getDecorView().getSystemUiVisibility();
			int allWindowFlags = windowFlags | getWindow().getAttributes().flags;

			// If status bar is to be hidden, then we must also set the translucent status bar flag
			// or else devices with a notch will show a black bar where the status bar used to be.
			boolean isHidingStatusBar = (allWindowFlags & WindowManager.LayoutParams.FLAG_FULLSCREEN) != 0;
			isHidingStatusBar |= (uiFlags & View.SYSTEM_UI_FLAG_FULLSCREEN) != 0;
			isHidingStatusBar |= (uiFlags & View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN) != 0;
			if (isHidingStatusBar) {
				windowFlags |= WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS;
			}

			// If navigation bar is to be hidden, then we must also set its translucent flag
			// or else devices with a notch will show a black bar where the navigation bar used to be.
			if ((uiFlags & View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) != 0) {
				windowFlags |= WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION;
			}
		}

		// Always allow screen cutouts/notches (such as the camera) to overlap window.
		// Note: This won't overlap window's inner contents unless we call setFitsSystemWindows(true) down below,
		//       which is only enabled when Titanium's "extendSafeArea" property is set true.
		if (Build.VERSION.SDK_INT >= 28) {
			WindowManager.LayoutParams params = getWindow().getAttributes();
			params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
			getWindow().setAttributes(params);
		}

		// Add the flags provided via property 'windowFlags'.
		if (windowFlags > 0) {
			getWindow().addFlags(windowFlags);
		}

		// Remove translucent StatusBar/NavigationBar flags if window is not set up to extend beneath them.
		// Not doing so will cause window to stretch beneath them anyways, but will fail to render there.
		if (this.layout.getFitsSystemWindows()) {
			int mask = WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS;
			mask |= WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION;
			if ((getWindow().getAttributes().flags & mask) != 0) {
				String message = "You cannot use a translucent status bar or navigation bar unless you "
								 + "set the window's '" + TiC.PROPERTY_EXTEND_SAFE_AREA + "' property to true.";
				Log.w(TAG, message);
				getWindow().clearFlags(mask);
			}
		}

		// Update system UI flags with based on currently assigned translucency flags.
		{
			int systemUIFlags = 0;
			int allWindowFlags = getWindow().getAttributes().flags;
			if ((allWindowFlags & WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS) != 0) {
				systemUIFlags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
			}
			if ((allWindowFlags & WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION) != 0) {
				systemUIFlags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
			}
			if (systemUIFlags != 0) {
				systemUIFlags |= getWindow().getDecorView().getSystemUiVisibility();
				getWindow().getDecorView().setSystemUiVisibility(systemUIFlags);
			}
		}

		if (modal) {
			if (Build.VERSION.SDK_INT < TiC.API_LEVEL_ICE_CREAM_SANDWICH) {
				// This flag is deprecated in API 14. On ICS, the background is not blurred but straight black.
				getWindow().addFlags(WindowManager.LayoutParams.FLAG_BLUR_BEHIND);
			}
		}

		if (hasSoftInputMode) {
			Log.d(TAG, "windowSoftInputMode: " + softInputMode, Log.DEBUG_MODE);
			getWindow().setSoftInputMode(softInputMode);
		}

		boolean useActivityWindow = getIntentBoolean(TiC.INTENT_PROPERTY_USE_ACTIVITY_WINDOW, false);
		if (useActivityWindow) {
			int windowId = getIntentInt(TiC.INTENT_PROPERTY_WINDOW_ID, -1);
			TiActivityWindows.windowCreated(this, windowId, savedInstanceState);
		}
	}

	// Record if user has set a content view manually from hyperloop code during require of app.js!
	@Override
	public void setContentView(View view)
	{
		overridenLayout = true;
		super.setContentView(view);
	}

	@Override
	public void setContentView(int layoutResID)
	{
		overridenLayout = true;
		super.setContentView(layoutResID);
	}

	@Override
	public void setContentView(View view, LayoutParams params)
	{
		overridenLayout = true;
		super.setContentView(view, params);
	}

	@Override
	/**
	 * When the activity is created, this method adds it to the activity stack and
	 * fires a javascript 'create' event.
	 * @param savedInstanceState Bundle of saved data.
	 */
	protected void onCreate(Bundle savedInstanceState)
	{
		Log.d(TAG, "Activity " + this + " onCreate", Log.DEBUG_MODE);

		inForeground = true;
		TiApplication tiApp = getTiApp();
		this.safeAreaMonitor = new TiActivitySafeAreaMonitor(this);

		if (tiApp.isRestartPending()) {
			super.onCreate(savedInstanceState);
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		// If all the activities has been killed and the runtime has been disposed or the app's hosting process has
		// been killed, we cannot recover one specific activity because the info of the top-most view proxy has been
		// lost (TiActivityWindows.dispose()). In this case, we have to restart the app.
		if (TiBaseActivity.isUnsupportedReLaunch(this, savedInstanceState)) {
			Log.w(TAG, "Runtime has been disposed or app has been killed. Finishing.");
			activityOnCreate(savedInstanceState);
			TiApplication.terminateActivityStack();
			if (Build.VERSION.SDK_INT < 23) {
				finish();
				tiApp.scheduleRestart(300);
				return;
			}
			KrollRuntime.incrementActivityRefCount();
			finishAndRemoveTask();
			return;
		}

		TiApplication.addToActivityStack(this);

		// create the activity proxy here so that it is accessible from the activity in all cases
		activityProxy = new ActivityProxy(this);

		// Increment the reference count so we correctly clean up when all of our activities have been destroyed
		KrollRuntime.incrementActivityRefCount();

		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(TiC.INTENT_PROPERTY_MESSENGER)) {
				messenger = (Messenger) intent.getParcelableExtra(TiC.INTENT_PROPERTY_MESSENGER);
				msgActivityCreatedId = intent.getIntExtra(TiC.INTENT_PROPERTY_MSG_ACTIVITY_CREATED_ID, -1);
				msgId = intent.getIntExtra(TiC.INTENT_PROPERTY_MSG_ID, -1);
			}

			if (intent.hasExtra(TiC.PROPERTY_WINDOW_PIXEL_FORMAT)) {
				getWindow().setFormat(intent.getIntExtra(TiC.PROPERTY_WINDOW_PIXEL_FORMAT, PixelFormat.UNKNOWN));
			}
		}

		// Doing this on every create in case the activity is externally created.
		TiPlatformHelper.getInstance().intializeDisplayMetrics(this);

		// Create the root content layout, if not done already.
		if (layout == null) {
			layout = createLayout();
		}

		// Extend window's view under screen insets, if requested.
		boolean extendSafeArea = false;
		if (intent != null) {
			extendSafeArea = intent.getBooleanExtra(TiC.PROPERTY_EXTEND_SAFE_AREA, false);
		}
		layout.setFitsSystemWindows(!extendSafeArea);

		// Enable/disable timer used to turn off the screen if idle.
		if ((intent != null) && intent.hasExtra(TiC.PROPERTY_KEEP_SCREEN_ON)) {
			boolean keepScreenOn = intent.getBooleanExtra(TiC.PROPERTY_KEEP_SCREEN_ON, layout.getKeepScreenOn());
			layout.setKeepScreenOn(keepScreenOn);
		}

		// Set the theme of the activity before calling super.onCreate().
		// On 2.3 devices, it does not work if the theme is set after super.onCreate.
		int theme = getIntentInt(TiC.PROPERTY_THEME, -1);
		if (theme != -1) {
			this.setTheme(theme);
		}

		// Set ActionBar into split mode must be done before the decor view has been created
		// we need to do this before calling super.onCreate()
		if (intent != null && intent.hasExtra(TiC.PROPERTY_SPLIT_ACTIONBAR)) {
			getWindow().setUiOptions(ActivityInfo.UIOPTION_SPLIT_ACTION_BAR_WHEN_NARROW);
		}

		// we only want to set the current activity for good in the resume state but we need it right now.
		// save off the existing current activity, set ourselves to be the new current activity temporarily
		// so we don't run into problems when we give the proxy the event
		Activity tempCurrentActivity = tiApp.getCurrentActivity();
		tiApp.setCurrentActivity(this, this);

		// we need to set window features before calling onCreate
		this.requestWindowFeature(Window.FEATURE_PROGRESS);
		this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			this.requestWindowFeature(Window.FEATURE_ACTIVITY_TRANSITIONS);
		}
		super.onCreate(savedInstanceState);

		// If activity is using Google's default ActionBar, then the below will return an ActionBar style handler
		// intended to be called by onConfigurationChanged() which will resize its title bar and font.
		// Note: We need to do this since we override "configChanges" in the "AndroidManifest.xml".
		//       Default ActionBar height is typically 56dp for portrait and 48dp for landscape.
		this.actionBarStyleHandler = TiActionBarStyleHandler.from(this);

		// If Google's ActionBar is being used, then add it to the top inset height. (Exclude from safe-area.)
		// Note: If a toolbar is passed to AppCompatActivity.setSupportActionBar(), then ActionBar is a wrapper
		//       around that toolbar under our content view and is included in the safe-area.
		this.safeAreaMonitor.setActionBarAddedAsInset(this.actionBarStyleHandler != null);

		// Start handling safe-area inset changes.
		this.safeAreaMonitor.setOnChangedListener(new TiActivitySafeAreaMonitor.OnChangedListener() {
			@Override
			public void onChanged(TiActivitySafeAreaMonitor monitor)
			{
				TiWindowProxy windowProxy = TiBaseActivity.this.window;
				if (windowProxy != null) {
					windowProxy.fireSafeAreaChangedEvent();
				}
			}
		});
		this.safeAreaMonitor.start();

		try {
			windowCreated(savedInstanceState);
		} catch (Throwable t) {
			Thread.getDefaultUncaughtExceptionHandler().uncaughtException(null, t);
		}

		if (activityProxy != null) {
			dispatchCallback(TiC.PROPERTY_ON_CREATE, null);
			activityProxy.fireEvent(TiC.EVENT_CREATE, null);
		}

		// set the current activity back to what it was originally
		tiApp.setCurrentActivity(this, tempCurrentActivity);

		// If user changed the layout during app.js load, keep that
		if (!overridenLayout) {
			super.setContentView(layout);
		}

		// Set the title of the activity after setContentView.
		// On 2.3 devices, if the title is set before setContentView, the app will crash when a NoTitleBar theme is used.
		updateTitle();

		sendMessage(msgActivityCreatedId);
		// for backwards compatibility
		sendMessage(msgId);

		// store off the original orientation for the activity set in the AndroidManifest.xml
		// for later use
		originalOrientationMode = getRequestedOrientation();

		if (window != null) {
			window.onWindowActivityCreated();
		}
		synchronized (lifecycleListeners.synchronizedList())
		{
			for (OnLifecycleEvent listener : lifecycleListeners.nonNull()) {
				try {
					TiLifecycle.fireLifecycleEvent(this, listener, savedInstanceState, TiLifecycle.LIFECYCLE_ON_CREATE);

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching lifecycle event: " + t.getMessage(), t);
				}
			}
		}
		setCustomActionBar();
	}

	private void setCustomActionBar()
	{
		if (activityProxy.hasProperty(TiC.PROPERTY_SUPPORT_TOOLBAR)) {
			try {
				this.setSupportActionBar(
					((Toolbar) ((TiToolbarProxy) activityProxy.getProperty(TiC.PROPERTY_SUPPORT_TOOLBAR))
						 .getToolbarInstance()));
			} catch (RuntimeException e) {
				Log.e(
					TAG,
					"Attempting to use Toolbar as ActionBar without disabling the default ActionBar in the current theme.\n"
						+ "You must set 'windowActionBar' to false in your current theme. Or use one of the following themes:\n"
						+ " - Theme.Titanium\n - Theme.AppCompat.Translucent.NoTitleBar\n - Theme.AppCompat.NoTitleBar\n"
						+ "Which have ActionBar disabled by default.");
				TiApplication.terminateActivityStack();
				finish();
			}
		}
	}

	public int getOriginalOrientationMode()
	{
		return originalOrientationMode;
	}

	public boolean isInForeground()
	{
		return inForeground;
	}

	public boolean isDestroyed()
	{
		return onDestroyFired;
	}

	protected void sendMessage(final int msgId)
	{
		if (messenger == null || msgId == -1) {
			return;
		}

		// fire an async message on this thread's queue
		// so we don't block onCreate() from returning
		TiMessenger.postOnMain(new Runnable() {
			public void run()
			{
				handleSendMessage(msgId);
			}
		});
	}

	protected void handleSendMessage(int messageId)
	{
		try {
			Message message = TiMessenger.getMainMessenger().getHandler().obtainMessage(messageId, this);
			messenger.send(message);

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
			// Register the supportHelper so we can get it back when the activity is recovered from force-quitting.
			supportHelperId = TiActivitySupportHelpers.addSupportHelper(supportHelper);
		}

		return supportHelper;
	}

	// Activity Support
	public int getUniqueResultCode()
	{
		return getSupportHelper().getUniqueResultCode();
	}

	/**
	 * See TiActivitySupport.launchActivityForResult for more details.
	 */
	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler resultHandler)
	{
		getSupportHelper().launchActivityForResult(intent, code, resultHandler);
	}

	/**
	 * See TiActivitySupport.launchIntentSenderForResult for more details.
	 */
	public void launchIntentSenderForResult(IntentSender intent, int requestCode, Intent fillInIntent, int flagsMask,
											int flagsValues, int extraFlags, Bundle options,
											TiActivityResultHandler resultHandler)
	{
		getSupportHelper().launchIntentSenderForResult(intent, requestCode, fillInIntent, flagsMask, flagsValues,
													   extraFlags, options, resultHandler);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data)
	{
		super.onActivityResult(requestCode, resultCode, data);
		synchronized (onActivityResultListeners.synchronizedList())
		{
			for (OnActivityResultEvent listener : onActivityResultListeners.nonNull()) {
				try {
					TiLifecycle.fireOnActivityResultEvent(this, listener, requestCode, resultCode, data);
				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching onActivityResult event: " + t.getMessage(), t);
				}
			}
		}
		getSupportHelper().onActivityResult(requestCode, resultCode, data);
	}

	@Override
	public void onBackPressed()
	{
		synchronized (interceptOnBackPressedListeners.synchronizedList())
		{
			for (interceptOnBackPressedEvent listener : interceptOnBackPressedListeners.nonNull()) {
				try {
					if (listener.interceptOnBackPressed()) {
						return;
					}

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching interceptOnBackPressed event: " + t.getMessage(), t);
				}
			}
		}

		TiWindowProxy topWindow = topWindowOnStack();

		if (topWindow != null && topWindow.hasListeners(TiC.EVENT_ANDROID_BACK)) {
			topWindow.fireEvent(TiC.EVENT_ANDROID_BACK, null);
		}
		// Override default Android behavior for "back" press
		// if the top window has a callback to handle the event.
		if (topWindow != null && topWindow.hasProperty(TiC.PROPERTY_ON_BACK)) {
			KrollFunction onBackCallback = (KrollFunction) topWindow.getProperty(TiC.PROPERTY_ON_BACK);
			onBackCallback.callAsync(activityProxy.getKrollObject(), new Object[] {});
		}
		if (topWindow == null
			|| (topWindow != null && !topWindow.hasProperty(TiC.PROPERTY_ON_BACK)
				&& !topWindow.hasListeners(TiC.EVENT_ANDROID_BACK))) {
			// check Ti.UI.Window.exitOnClose and either
			// exit the application or send to background
			if (topWindow != null) {
				boolean exitOnClose = TiConvert.toBoolean(topWindow.getProperty(TiC.PROPERTY_EXIT_ON_CLOSE), false);

				// root window should exitOnClose by default
				if (totalWindowStack <= 1 && !topWindow.hasProperty(TiC.PROPERTY_EXIT_ON_CLOSE)) {
					exitOnClose = true;
				}
				if (exitOnClose) {
					Log.d(TAG, "onBackPressed: exit");
					if (Build.VERSION.SDK_INT >= 16) {
						finishAffinity();
					} else {
						TiApplication.terminateActivityStack();
					}
					return;

					// root window has exitOnClose set as false, send to background
				} else if (totalWindowStack <= 1) {
					Log.d(TAG, "onBackPressed: suspend to background");
					this.moveTaskToBack(true);
					return;
				}
				removeWindowFromStack(topWindow);
			}

			// If event is not handled by custom callback allow default behavior.
			super.onBackPressed();
		}
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event)
	{
		boolean handled = false;

		TiViewProxy window;
		if (this.window != null) {
			window = this.window;
		} else {
			window = this.view;
		}

		if (window == null) {
			return super.dispatchKeyEvent(event);
		}

		switch (event.getKeyCode()) {
			case KeyEvent.KEYCODE_BACK: {

				if (event.getAction() == KeyEvent.ACTION_UP) {
					String backEvent = "android:back";
					KrollProxy proxy = null;
					//android:back could be fired from a tabGroup window (activityProxy)
					//or hw window (window).This event is added specifically to the activity
					//proxy of a tab group in window.js
					if (activityProxy.hasListeners(backEvent)) {
						proxy = activityProxy;
					} else if (window.hasListeners(backEvent)) {
						proxy = window;
					}

					if (proxy != null) {
						proxy.fireEvent(backEvent, null);
						handled = true;
					}
				}
				break;
			}
			case KeyEvent.KEYCODE_CAMERA: {
				if (window.hasListeners(TiC.EVENT_ANDROID_CAMERA)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_CAMERA, null);
					}
					handled = true;
				}
				// TODO: Deprecate old event
				if (window.hasListeners("android:camera")) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent("android:camera", null);
					}
					handled = true;
				}

				break;
			}
			case KeyEvent.KEYCODE_FOCUS: {
				if (window.hasListeners(TiC.EVENT_ANDROID_FOCUS)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_FOCUS, null);
					}
					handled = true;
				}
				// TODO: Deprecate old event
				if (window.hasListeners("android:focus")) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent("android:focus", null);
					}
					handled = true;
				}

				break;
			}
			case KeyEvent.KEYCODE_SEARCH: {
				if (window.hasListeners(TiC.EVENT_ANDROID_SEARCH)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_SEARCH, null);
					}
					handled = true;
				}
				// TODO: Deprecate old event
				if (window.hasListeners("android:search")) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent("android:search", null);
					}
					handled = true;
				}

				break;
			}
			case KeyEvent.KEYCODE_VOLUME_UP: {
				if (window.hasListeners(TiC.EVENT_ANDROID_VOLUP)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_VOLUP, null);
					}
					handled = true;
				}
				// TODO: Deprecate old event
				if (window.hasListeners("android:volup")) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent("android:volup", null);
					}
					handled = true;
				}

				break;
			}
			case KeyEvent.KEYCODE_VOLUME_DOWN: {
				if (window.hasListeners(TiC.EVENT_ANDROID_VOLDOWN)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_VOLDOWN, null);
					}
					handled = true;
				}
				// TODO: Deprecate old event
				if (window.hasListeners("android:voldown")) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent("android:voldown", null);
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
		// If targetSdkVersion is set to 11+, Android will invoke this function
		// to initialize the menu (since it's part of the action bar). Due
		// to the fix for Android bug 2373, activityProxy won't be initialized b/c the
		// activity is expected to restart, so we will ignore it.
		if (activityProxy == null) {
			return false;
		}

		boolean listenerExists = false;
		synchronized (onCreateOptionsMenuListeners.synchronizedList())
		{
			for (OnCreateOptionsMenuEvent listener : onCreateOptionsMenuListeners.nonNull()) {
				try {
					listenerExists = true;
					TiLifecycle.fireOnCreateOptionsMenuEvent(this, listener, menu);
				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching OnCreateOptionsMenuEvent: " + t.getMessage(), t);
				}
			}
		}

		if (menuHelper == null) {
			menuHelper = new TiMenuSupport(activityProxy);
		}

		return menuHelper.onCreateOptionsMenu(super.onCreateOptionsMenu(menu) || listenerExists, menu);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item)
	{
		switch (item.getItemId()) {
			case android.R.id.home:
				if (activityProxy != null) {
					ActionBarProxy actionBarProxy = activityProxy.getActionBar();
					if (actionBarProxy != null) {
						KrollFunction onHomeIconItemSelected =
							(KrollFunction) actionBarProxy.getProperty(TiC.PROPERTY_ON_HOME_ICON_ITEM_SELECTED);
						KrollDict event = new KrollDict();
						event.put(TiC.EVENT_PROPERTY_SOURCE, actionBarProxy);
						if (onHomeIconItemSelected != null) {
							onHomeIconItemSelected.call(activityProxy.getKrollObject(), new Object[] { event });
						}
					}
				}
				return true;
			default:
				return menuHelper.onOptionsItemSelected(item);
		}
	}

	@Override
	public boolean onPrepareOptionsMenu(Menu menu)
	{
		boolean listenerExists = false;
		synchronized (onPrepareOptionsMenuListeners.synchronizedList())
		{
			for (OnPrepareOptionsMenuEvent listener : onPrepareOptionsMenuListeners.nonNull()) {
				try {
					listenerExists = true;
					TiLifecycle.fireOnPrepareOptionsMenuEvent(this, listener, menu);
				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching OnPrepareOptionsMenuEvent: " + t.getMessage(), t);
				}
			}
		}
		return menuHelper.onPrepareOptionsMenu(super.onPrepareOptionsMenu(menu) || listenerExists, menu);
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);

		// Update ActionBar height and font size, if needed.
		// Handler will only be null if activity was set up without a title bar.
		if (this.actionBarStyleHandler != null) {
			this.actionBarStyleHandler.onConfigurationChanged(newConfig);
		}

		// Notify all listener of this configuration change.
		for (WeakReference<ConfigurationChangedListener> listener : configChangedListeners) {
			if (listener.get() != null) {
				listener.get().onConfigurationChanged(this, newConfig);
			}
		}
	}

	@Override
	protected void onNewIntent(Intent intent)
	{
		super.onNewIntent(intent);

		Log.d(TAG, "Activity " + this + " onNewIntent", Log.DEBUG_MODE);

		if (activityProxy != null) {
			IntentProxy ip = new IntentProxy(intent);
			KrollDict data = new KrollDict();
			data.put(TiC.PROPERTY_INTENT, ip);
			activityProxy.fireSyncEvent(TiC.EVENT_NEW_INTENT, data);
			// TODO: Deprecate old event
			activityProxy.fireSyncEvent("newIntent", data);
		}
	}

	public void addOnLifecycleEventListener(OnLifecycleEvent listener)
	{
		lifecycleListeners.add(new WeakReference<OnLifecycleEvent>(listener));
	}

	public void addOnInstanceStateEventListener(OnInstanceStateEvent listener)
	{
		instanceStateListeners.add(new WeakReference<OnInstanceStateEvent>(listener));
	}

	public void addOnWindowFocusChangedEventListener(OnWindowFocusChangedEvent listener)
	{
		windowFocusChangedListeners.add(new WeakReference<OnWindowFocusChangedEvent>(listener));
	}

	public void addInterceptOnBackPressedEventListener(interceptOnBackPressedEvent listener)
	{
		interceptOnBackPressedListeners.add(new WeakReference<interceptOnBackPressedEvent>(listener));
	}

	public void addOnActivityResultListener(OnActivityResultEvent listener)
	{
		onActivityResultListeners.add(new WeakReference<OnActivityResultEvent>(listener));
	}

	public void addOnCreateOptionsMenuEventListener(OnCreateOptionsMenuEvent listener)
	{
		onCreateOptionsMenuListeners.add(new WeakReference<OnCreateOptionsMenuEvent>(listener));
	}

	public void addOnPrepareOptionsMenuEventListener(OnPrepareOptionsMenuEvent listener)
	{
		onPrepareOptionsMenuListeners.add(new WeakReference<OnPrepareOptionsMenuEvent>(listener));
	}

	public void removeOnLifecycleEventListener(OnLifecycleEvent listener)
	{
		// TODO stub
	}

	private void dispatchCallback(final String name, KrollDict data)
	{
		if (data == null) {
			data = new KrollDict();
		}
		data.put("source", activityProxy);

		final KrollDict d = data;
		if (TiApplication.isUIThread()) {
			activityProxy.callPropertyAsync(name, new Object[] { d });
		} else {
			runOnUiThread(new Runnable() {
				@Override
				public void run()
				{
					activityProxy.callPropertySync(name, new Object[] { d });
				}
			});
		}
	}

	private void releaseDialogs(boolean finish)
	{
		//clean up dialogs when activity is pausing or finishing
		for (Iterator<DialogWrapper> iter = dialogs.iterator(); iter.hasNext();) {
			DialogWrapper p = iter.next();
			Dialog dialog = p.getDialog();
			boolean persistent = p.getPersistent();
			//if the activity is pausing but not finishing, clean up dialogs only if
			//they are non-persistent
			if (finish || !persistent) {
				if (dialog != null && dialog.isShowing()) {
					dialog.dismiss();
				}
				dialogs.remove(p);
			}
		}
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus)
	{
		synchronized (windowFocusChangedListeners.synchronizedList())
		{
			for (OnWindowFocusChangedEvent listener : windowFocusChangedListeners.nonNull()) {
				try {
					listener.onWindowFocusChanged(hasFocus);

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching onWindowFocusChanged event: " + t.getMessage(), t);
				}
			}
		}
		super.onWindowFocusChanged(hasFocus);
	}

	@Override
	/**
	 * When this activity pauses, this method sets the current activity to null, fires a javascript 'pause' event,
	 * and if the activity is finishing, remove all dialogs associated with it.
	 */
	protected void onPause()
	{
		inForeground = false;
		if (activityProxy != null) {
			dispatchCallback(TiC.PROPERTY_ON_PAUSE, null);
		}
		super.onPause();
		isResumed = false;

		Log.d(TAG, "Activity " + this + " onPause", Log.DEBUG_MODE);

		TiApplication tiApp = getTiApp();
		if (tiApp.isRestartPending()) {
			releaseDialogs(true);
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		if (!windowStack.empty()) {
			windowStack.peek().onWindowFocusChange(false);
		}

		TiApplication.updateActivityTransitionState(true);
		tiApp.setCurrentActivity(this, null);
		TiUIHelper.showSoftKeyboard(getWindow().getDecorView(), false);

		if (this.isFinishing()) {
			releaseDialogs(true);
		} else {
			//release non-persistent dialogs when activity hides
			releaseDialogs(false);
		}

		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_PAUSE, null);
		}
		KrollModule appModule = tiApp.getModuleByName("App");
		if (appModule != null) {
			appModule.fireEvent(TiC.EVENT_PAUSE, null);
			appModule.fireEvent(TiC.EVENT_PAUSED, null);
		}

		synchronized (lifecycleListeners.synchronizedList())
		{
			for (OnLifecycleEvent listener : lifecycleListeners.nonNull()) {
				try {
					TiLifecycle.fireLifecycleEvent(this, listener, TiLifecycle.LIFECYCLE_ON_PAUSE);

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching lifecycle event: " + t.getMessage(), t);
				}
			}
		}
	}

	@Override
	/**
	 * When the activity resumes, this method updates the current activity to this and fires a javascript
	 * 'resume' event.
	 */
	protected void onResume()
	{
		inForeground = true;
		if (activityProxy != null) {
			dispatchCallback(TiC.PROPERTY_ON_RESUME, null);
		}
		super.onResume();
		if (isFinishing()) {
			return;
		}

		Log.d(TAG, "Activity " + this + " onResume", Log.DEBUG_MODE);

		TiApplication tiApp = getTiApp();
		if (tiApp.isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		if (!windowStack.empty()) {
			windowStack.peek().onWindowFocusChange(true);
		}

		tiApp.setCurrentActivity(this, this);
		TiApplication.updateActivityTransitionState(false);

		// handle shortcut intents
		Intent intent = getIntent();
		String shortcutId =
			intent.hasExtra(TiC.EVENT_PROPERTY_SHORTCUT) ? intent.getStringExtra(TiC.EVENT_PROPERTY_SHORTCUT) : null;
		if (shortcutId != null) {
			KrollModule appModule = TiApplication.getInstance().getModuleByName("App");
			if (appModule != null) {
				KrollDict data = new KrollDict();
				data.put(TiC.PROPERTY_ID, shortcutId);
				appModule.fireEvent(TiC.EVENT_SHORTCUT_ITEM_CLICK, data);
			}
		}

		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_RESUME, null);
		}
		KrollModule appModule = tiApp.getModuleByName("App");
		if (appModule != null) {
			appModule.fireEvent(TiC.EVENT_RESUME, null);
			appModule.fireEvent(TiC.EVENT_RESUMED, null);
		}

		synchronized (lifecycleListeners.synchronizedList())
		{
			for (OnLifecycleEvent listener : lifecycleListeners.nonNull()) {
				try {
					TiLifecycle.fireLifecycleEvent(this, listener, TiLifecycle.LIFECYCLE_ON_RESUME);

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching lifecycle event: " + t.getMessage(), t);
				}
			}
		}

		isResumed = true;
	}

	@Override
	/**
	 * When this activity starts, this method updates the current activity to this if necessary and
	 * fire javascript 'start' and 'focus' events. Focus events will only fire if
	 * the activity is not a tab activity.
	 */
	protected void onStart()
	{
		inForeground = true;
		if (activityProxy != null) {
			dispatchCallback(TiC.PROPERTY_ON_START, null);
		}
		super.onStart();
		if (isFinishing()) {
			return;
		}

		// Newer versions of Android appear to turn this on by default.
		// Turn if off until an activity indicator is shown.
		setProgressBarIndeterminateVisibility(false);

		Log.d(TAG, "Activity " + this + " onStart", Log.DEBUG_MODE);

		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		updateTitle();

		if (activityProxy != null) {
			// we only want to set the current activity for good in the resume state but we need it right now.
			// save off the existing current activity, set ourselves to be the new current activity temporarily
			// so we don't run into problems when we give the proxy the event
			Activity tempCurrentActivity = tiApp.getCurrentActivity();
			tiApp.setCurrentActivity(this, this);

			activityProxy.fireEvent(TiC.EVENT_START, null);

			// set the current activity back to what it was originally
			tiApp.setCurrentActivity(this, tempCurrentActivity);
		}

		synchronized (lifecycleListeners.synchronizedList())
		{
			for (OnLifecycleEvent listener : lifecycleListeners.nonNull()) {
				try {
					TiLifecycle.fireLifecycleEvent(this, listener, TiLifecycle.LIFECYCLE_ON_START);

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching lifecycle event: " + t.getMessage(), t);
				}
			}
		}
	}

	@Override
	/**
	 * When this activity stops, this method fires the javascript 'blur' and 'stop' events. Blur events will only fire
	 * if the activity is not a tab activity.
	 */
	protected void onStop()
	{
		inForeground = false;
		if (activityProxy != null) {
			dispatchCallback(TiC.PROPERTY_ON_STOP, null);
		}
		super.onStop();

		Log.d(TAG, "Activity " + this + " onStop", Log.DEBUG_MODE);

		if (getTiApp().isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_STOP, null);
		}

		synchronized (lifecycleListeners.synchronizedList())
		{
			for (OnLifecycleEvent listener : lifecycleListeners.nonNull()) {
				try {
					TiLifecycle.fireLifecycleEvent(this, listener, TiLifecycle.LIFECYCLE_ON_STOP);

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching lifecycle event: " + t.getMessage(), t);
				}
			}
		}
	}

	@Override
	/**
	 * When this activity restarts, this method updates the current activity to this and fires javascript 'restart'
	 * event.
	 */
	protected void onRestart()
	{
		inForeground = true;
		if (activityProxy != null) {
			dispatchCallback(TiC.PROPERTY_ON_RESTART, null);
		}
		super.onRestart();

		Log.d(TAG, "Activity " + this + " onRestart", Log.DEBUG_MODE);

		TiApplication tiApp = getTiApp();
		if (tiApp.isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}

			return;
		}

		if (activityProxy != null) {
			// we only want to set the current activity for good in the resume state but we need it right now.
			// save off the existing current activity, set ourselves to be the new current activity temporarily
			// so we don't run into problems when we give the proxy the event
			Activity tempCurrentActivity = tiApp.getCurrentActivity();
			tiApp.setCurrentActivity(this, this);

			activityProxy.fireEvent(TiC.EVENT_RESTART, null);

			// set the current activity back to what it was originally
			tiApp.setCurrentActivity(this, tempCurrentActivity);
		}
	}

	@Override
	/**
	 * When a key, touch, or trackball event is dispatched to the activity, this method fires the
	 * javascript 'userinteraction' event.
	 */
	public void onUserInteraction()
	{
		TiApplication.getInstance().fireAppEvent(TiC.EVENT_USER_INTERACTION, null);

		super.onUserInteraction();
	}

	@Override
	/**
	 * When the activity is about to go into the background as a result of user choice, this method fires the
	 * javascript 'userleavehint' event.
	 */
	protected void onUserLeaveHint()
	{
		Log.d(TAG, "Activity " + this + " onUserLeaveHint", Log.DEBUG_MODE);

		if (getTiApp().isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_USER_LEAVE_HINT, null);
		}

		super.onUserLeaveHint();
	}

	@Override
	/**
	 * When this activity is destroyed, this method removes it from the activity stack, performs
	 * clean up, and fires javascript 'destroy' event.
	 */
	protected void onDestroy()
	{
		Log.d(TAG, "Activity " + this + " onDestroy", Log.DEBUG_MODE);
		if (activityProxy != null) {
			dispatchCallback(TiC.PROPERTY_ON_DESTROY, null);
		}

		inForeground = false;
		TiApplication tiApp = getTiApp();
		//Clean up dialogs when activity is destroyed.
		releaseDialogs(true);

		// Stop listening for safe-area inset changes.
		this.safeAreaMonitor.stop();

		if (tiApp.isRestartPending()) {
			super.onDestroy();
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		synchronized (lifecycleListeners.synchronizedList())
		{
			for (OnLifecycleEvent listener : lifecycleListeners.nonNull()) {
				try {
					TiLifecycle.fireLifecycleEvent(this, listener, TiLifecycle.LIFECYCLE_ON_DESTROY);

				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching lifecycle event: " + t.getMessage(), t);
				}
			}
		}

		super.onDestroy();

		boolean isFinishing = isFinishing();

		// If the activity is finishing, remove the windowId and supportHelperId so the window and supportHelper can be released.
		// If the activity is forced to destroy by Android OS, keep the windowId and supportHelperId so the activity can be recovered.
		if (isFinishing) {
			int windowId = getIntentInt(TiC.INTENT_PROPERTY_WINDOW_ID, -1);
			TiActivityWindows.removeWindow(windowId);
			TiActivitySupportHelpers.removeSupportHelper(supportHelperId);
		}

		fireOnDestroy();

		if (layout instanceof TiCompositeLayout) {
			Log.d(TAG, "Layout cleanup.", Log.DEBUG_MODE);
			((TiCompositeLayout) layout).removeAllViews();
		}
		layout = null;

		//LW windows
		if (window == null && view != null) {
			view.release();
			view = null;
		}
		if (view != null) {
			view.releaseViews();
			view = null;
		}

		if (window != null) {
			if (windowStack.contains(window)) {
				removeWindowFromStack(window);
			}
			window.closeFromActivity(isFinishing);
			window.releaseViews();
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

		// Don't dispose the runtime if the activity is forced to destroy by Android,
		// so we can recover the activity later.
		KrollRuntime.decrementActivityRefCount(isFinishing);
	}

	@Override
	protected void onSaveInstanceState(Bundle outState)
	{
		super.onSaveInstanceState(outState);

		// If the activity is forced to destroy by Android, save the supportHelperId so
		// we can get it back when the activity is recovered.
		if (!isFinishing() && supportHelper != null) {
			outState.putInt("supportHelperId", supportHelperId);
		}

		synchronized (instanceStateListeners.synchronizedList())
		{
			for (OnInstanceStateEvent listener : instanceStateListeners.nonNull()) {
				try {
					TiLifecycle.fireInstanceStateEvent(outState, listener, TiLifecycle.ON_SAVE_INSTANCE_STATE);
				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching OnInstanceStateEvent: " + t.getMessage(), t);
				}
			}
		}
	}

	@Override
	protected void onRestoreInstanceState(Bundle savedInstanceState)
	{
		super.onRestoreInstanceState(savedInstanceState);

		if (savedInstanceState.containsKey("supportHelperId")) {
			supportHelperId = savedInstanceState.getInt("supportHelperId");
			supportHelper = TiActivitySupportHelpers.retrieveSupportHelper(this, supportHelperId);
			if (supportHelper == null) {
				Log.e(TAG, "Unable to retrieve the activity support helper.");
			}
		}
		synchronized (instanceStateListeners.synchronizedList())
		{
			for (OnInstanceStateEvent listener : instanceStateListeners.nonNull()) {
				try {
					TiLifecycle.fireInstanceStateEvent(savedInstanceState, listener,
													   TiLifecycle.ON_RESTORE_INSTANCE_STATE);
				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching OnInstanceStateEvent: " + t.getMessage(), t);
				}
			}
		}
	}

	// called in order to ensure that the onDestroy call is only acted upon once.
	// should be called by any subclass
	protected void fireOnDestroy()
	{
		if (!onDestroyFired) {
			if (activityProxy != null) {
				activityProxy.fireEvent(TiC.EVENT_DESTROY, null);
			}
			onDestroyFired = true;
		}
	}

	protected boolean shouldFinishRootActivity()
	{
		return canFinishRoot && getIntentBoolean(TiC.INTENT_PROPERTY_FINISH_ROOT, false);
	}

	@Override
	public void finish()
	{
		super.finish();

		if (shouldFinishRootActivity()) {
			TiApplication app = getTiApp();
			if (app != null) {
				TiRootActivity rootActivity = app.getRootActivity();
				if (rootActivity != null && !(rootActivity.equals(this)) && !rootActivity.isFinishing()) {
					rootActivity.finish();
				} else if (rootActivity == null && !app.isRestartPending()) {
					// When the root activity has been killed and garbage collected and the app is not scheduled to restart,
					// we need to force finish the root activity while this activity has an intent to finish root.
					// This happens when the "Don't keep activities" option is enabled and the user stays in some activity
					// (eg. heavyweight window, tabgroup) other than the root activity for a while and then he wants to back
					// out the app.
					app.setForceFinishRootActivity(true);
				}
			}
		}
	}

	// These activityOnXxxx are all used by TiLaunchActivity when
	// the android bug 2373 is detected and the app is being re-started.
	// By calling these from inside its on onXxxx handlers, TiLaunchActivity
	// can avoid calling super.onXxxx (super being TiBaseActivity), which would
	// result in a bunch of Titanium-specific code running when we don't need it
	// since we are restarting the app as fast as possible. Calling these methods
	// allows TiLaunchActivity to fulfill the requirement that the Android built-in
	// Activity's onXxxx must be called. (Think of these as something like super.super.onXxxx
	// from inside TiLaunchActivity.)
	protected void activityOnPause()
	{
		super.onPause();
	}
	protected void activityOnRestart()
	{
		super.onRestart();
	}
	protected void activityOnResume()
	{
		super.onResume();
	}
	protected void activityOnStop()
	{
		super.onStop();
	}
	protected void activityOnStart()
	{
		super.onStart();
	}
	protected void activityOnDestroy()
	{
		super.onDestroy();
	}

	public void activityOnCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
	}

	/**
	 * Called by the onCreate methods of TiBaseActivity to determine if an unsupported application
	 * re-launch appears to be occurring.
	 * @param activity The Activity getting the onCreate
	 * @param savedInstanceState The argument passed to the onCreate. A non-null value is a "tell"
	 * that the system is re-starting a killed application.
	 */
	public static boolean isUnsupportedReLaunch(Activity activity, Bundle savedInstanceState)
	{
		// We have to relaunch the app if
		// 1. all the activities have been killed and the runtime has been disposed or
		// 2. the app's hosting process has been killed. In this case, onDestroy or any other method
		// is not called. We can check the status of the root activity to detect this situation.
		if (savedInstanceState != null && !(activity instanceof TiLaunchActivity)
			&& (KrollRuntime.isDisposed() || TiApplication.getInstance().rootActivityLatch.getCount() != 0)) {
			return true;
		}
		return false;
	}

	public boolean hasSustainMode()
	{
		PowerManager manager = (PowerManager) getSystemService(Context.POWER_SERVICE);
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
			return manager.isSustainedPerformanceModeSupported();
		}
		return false;
	}

	public void setSustainMode(boolean sustainMode)
	{
		if (hasSustainMode() && this.sustainMode != sustainMode) {
			getWindow().setSustainedPerformanceMode(sustainMode);
			this.sustainMode = sustainMode;
		} else {
			Log.w(TAG, "sustainedPerformanceMode is not supported on this device");
		}
	}

	/**
	 * Gets the safe area in pixels, relative to the root decor view. This is the region between
	 * the top/bottom/left/right insets that overlap the view's content such as a translucent
	 * status bar, translucent navigation bar, or screen notches.
	 * @return
	 * Returns the safe area region in pixels relative to the root decor view.
	 * <p>
	 * Returns null if activity's root view is not available, such as after it's been destroyed.
	 */
	public Rect getSafeAreaRect()
	{
		if (this.safeAreaMonitor == null) {
			return null;
		}
		return this.safeAreaMonitor.getSafeAreaRect();
	}
}
