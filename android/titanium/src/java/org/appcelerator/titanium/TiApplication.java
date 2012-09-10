/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.Thread.UncaughtExceptionHandler;
import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.kroll.KrollApplication;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.CurrentActivityListener;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.kroll.common.TiDeployData;
import org.appcelerator.kroll.common.TiFastDev;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.kroll.util.TiTempFileHelper;
import org.appcelerator.titanium.analytics.TiAnalyticsEvent;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.analytics.TiAnalyticsModel;
import org.appcelerator.titanium.analytics.TiAnalyticsService;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiResponseCache;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiWeakList;

import ti.modules.titanium.TitaniumModule;
import android.app.Activity;
import android.app.Application;
import android.app.TabActivity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.DisplayMetrics;

/**
 * The main application entry point for all Titanium applications and services.
 */
public abstract class TiApplication extends Application implements Handler.Callback, KrollApplication
{
	private static final String SYSTEM_UNIT = "system";
	private static final String TAG = "TiApplication";
	private static final long STATS_WAIT = 300000;
	private static final int MSG_SEND_ANALYTICS = 100;
	private static final long SEND_ANALYTICS_DELAY = 30000; // Time analytics send request sits in queue before starting service.
	private static final String PROPERTY_DEPLOY_TYPE = "ti.deploytype";
	private static final String PROPERTY_THREAD_STACK_SIZE = "ti.android.threadstacksize";
	private static final String PROPERTY_COMPILE_JS = "ti.android.compilejs";
	private static final String PROPERTY_ENABLE_COVERAGE = "ti.android.enablecoverage";
	private static final String PROPERTY_DEFAULT_UNIT = "ti.ui.defaultunit";
	private static long lastAnalyticsTriggered = 0;
	private static long mainThreadId = 0;

	protected static WeakReference<TiApplication> tiApp = null;

	public static final String DEPLOY_TYPE_DEVELOPMENT = "development";
	public static final String DEPLOY_TYPE_TEST = "test";
	public static final String DEPLOY_TYPE_PRODUCTION = "production";
	public static final int DEFAULT_THREAD_STACK_SIZE = 16 * 1024; // 16K as a "sane" default
	public static final String APPLICATION_PREFERENCES_NAME = "titanium";
	public static final String PROPERTY_FASTDEV = "ti.android.fastdev";

	private boolean restartPending = false;
	private String baseUrl;
	private String startUrl;
	private HashMap<String, SoftReference<KrollProxy>> proxyMap;
	private TiWeakList<KrollProxy> appEventProxies = new TiWeakList<KrollProxy>();
	private WeakReference<TiRootActivity> rootActivity;
	private TiProperties appProperties;
	private TiProperties systemProperties;
	private WeakReference<Activity> currentActivity;
	private String density;
	private boolean needsStartEvent;
	private boolean needsEnrollEvent;
	private String buildVersion = "", buildTimestamp = "", buildHash = "";
	private String defaultUnit;
	private TiResponseCache responseCache;
	private BroadcastReceiver externalStorageReceiver;

	protected TiAnalyticsModel analyticsModel;
	protected Intent analyticsIntent;
	protected Handler analyticsHandler;
	protected TiDeployData deployData;
	protected TiTempFileHelper tempFileHelper;
	protected ITiAppInfo appInfo;
	protected TiStylesheet stylesheet;
	protected HashMap<String, WeakReference<KrollModule>> modules;
	
	public static AtomicBoolean isActivityTransition = new AtomicBoolean(false);
	protected static ArrayList<ActivityTransitionListener> activityTransitionListeners = new ArrayList<ActivityTransitionListener>();
	protected static TiWeakList<Activity> activityStack = new TiWeakList<Activity>();

	public static interface ActivityTransitionListener
	{
		public void onActivityTransition(boolean state);
	}

	public static void addActivityTransitionListener(ActivityTransitionListener a)
	{
		activityTransitionListeners.add(a);
	}
	
	public static void removeActivityTransitionListener(ActivityTransitionListener a)
	{
		activityTransitionListeners.remove(a);
	}
	
	public static void updateActivityTransitionState(boolean state)
	{
		isActivityTransition.set(state);
		for (int i = 0; i < activityTransitionListeners.size(); ++i) {
			activityTransitionListeners.get(i).onActivityTransition(state);
		}
		
	}
	public CountDownLatch rootActivityLatch = new CountDownLatch(1);


	public TiApplication()
	{
		Log.checkpoint(TAG, "checkpoint, app created.");

		analyticsHandler = new Handler(this);
		needsEnrollEvent = false; // test is after DB is available
		needsStartEvent = true;
		loadBuildProperties();

		mainThreadId = Looper.getMainLooper().getThread().getId();
		tiApp = new WeakReference<TiApplication>(this);

		modules = new HashMap<String, WeakReference<KrollModule>>();
		TiMessenger.getMessenger(); // initialize message queue for main thread

		Log.i(TAG, "Titanium " + buildVersion + " (" + buildTimestamp + " " + buildHash + ")");
	}

	/**
	 * Retrieves the instance of TiApplication. There is one instance per Android application.
	 * @return the instance of TiApplication.
	 * @module.api
	 */
	public static TiApplication getInstance()
	{
		if (tiApp != null) {
			TiApplication tiAppRef = tiApp.get();
			if (tiAppRef != null) {
				return tiAppRef;
			}
		}

		Log.e(TAG, "Unable to get the TiApplication instance");
		return null;
	}

	public static void addToActivityStack(Activity activity)
	{
		activityStack.add(new WeakReference<Activity>(activity));
	}

	public static void removeFromActivityStack(Activity activity)
	{
		activityStack.remove(activity);
	}

	// Calls finish on the list of activities in the stack. This should only be called when we want to terminate the
	// application (typically when the root activity is destroyed)
	public static void terminateActivityStack()
	{
		if (activityStack == null || activityStack.size() == 0) {
			return;
		}

		WeakReference<Activity> activityRef;
		Activity currentActivity;

		for (int i = activityStack.size() - 1; i >= 0; i--) {
			activityRef = activityStack.get(i);
			if (activityRef != null) {
				currentActivity = activityRef.get();
				if (currentActivity != null && !currentActivity.isFinishing()) {
					currentActivity.finish();
				}
			}
		}
		activityStack.clear();
	}

	public boolean activityStackHasLaunchActivity()
	{
		if (activityStack == null || activityStack.size() == 0) {
			return false;
		}
		for (WeakReference<Activity> activityRef : activityStack) {
			if (activityRef != null && activityRef.get() instanceof TiLaunchActivity) {
				return true;
			}
		}
		return false;
	}

	
	/**
	 * This is a convenience method to avoid having to check TiApplication.getInstance() is not null every 
	 * time we need to grab the current activity.
	 * @return the current activity
	 * @module.api
	 */
	public static Activity getAppCurrentActivity()
	{
		TiApplication tiApp = getInstance();
		if (tiApp == null) {
			return null;
		}

		return tiApp.getCurrentActivity();
	}

	/**
	 * This is a convenience method to avoid having to check TiApplication.getInstance() is not null every 
	 * time we need to grab the root or current activity.
	 * @return root activity if exists. If root activity doesn't exist, returns current activity if exists. Otherwise returns null.
	 * @module.api
	 */
	public static Activity getAppRootOrCurrentActivity()
	{
		TiApplication tiApp = getInstance();
		if (tiApp == null) {
			return null;
		}

		return tiApp.getRootOrCurrentActivity();
	}

	/**
	 * @return the current activity if exists. Otherwise, the thread will wait for a valid activity to be visible.
	 * @module.api
	 */
	public Activity getCurrentActivity()
	{
		int activityStackSize;

		while ((activityStackSize = activityStack.size()) > 0) {
			Activity activity = (activityStack.get(activityStackSize - 1)).get();

			// Skip and remove any activities which are dead or in the process of finishing.
			if (activity == null || activity.isFinishing()) {
				activityStack.remove(activityStackSize -1);
				continue;
			}

			return activity;
		}

		Log.d(TAG, "activity stack is empty, unable to get current activity", Log.DEBUG_MODE);
		return null;
	}
	
	/**
	 * @return root activity if exists. If root activity doesn't exist, returns current activity if exists. Otherwise returns null.
	 */
	public Activity getRootOrCurrentActivity()
	{
		Activity activity;
		if (rootActivity != null) {
			activity = rootActivity.get();
			if (activity != null) {
				return activity;
			}
		}
		
		if (currentActivity != null) {
			activity = currentActivity.get();
			if (activity != null) {
				return activity;
			}
		}

		Log.e(TAG, "No valid root or current activity found for application instance");
		return null;
	}

	protected void loadBuildProperties()
	{
		buildVersion = "1.0";
		buildTimestamp = "N/A";
		buildHash = "N/A";
		InputStream versionStream = getClass().getClassLoader().getResourceAsStream("org/appcelerator/titanium/build.properties");
		if (versionStream != null) {
			Properties properties = new Properties();
			try {
				properties.load(versionStream);
				if (properties.containsKey("build.version")) {
					buildVersion = properties.getProperty("build.version");
				}
				if (properties.containsKey("build.timestamp")) {
					buildTimestamp = properties.getProperty("build.timestamp");
				}
				if (properties.containsKey("build.githash")) {
					buildHash = properties.getProperty("build.githash");
				}
			} catch (IOException e) {}
		}
	}

	@Override
	public void onCreate()
	{
		super.onCreate();
		Log.d(TAG, "Application onCreate", Log.DEBUG_MODE);

		final UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
		Thread.setDefaultUncaughtExceptionHandler(new UncaughtExceptionHandler() {
			public void uncaughtException(Thread t, Throwable e) {
				String tiVer = buildVersion + "," + buildTimestamp + "," + buildHash ;
				Log.e(TAG, "Sending event: exception on thread: " + t.getName() + " msg:" + e.toString() + "; Titanium " + tiVer, e);
				postAnalyticsEvent(TiAnalyticsEventFactory.createErrorEvent(t, e, tiVer));
				defaultHandler.uncaughtException(t, e);
			}
		});

		baseUrl = TiC.URL_ANDROID_ASSET_RESOURCES;

		File fullPath = new File(baseUrl, getStartFilename("app.js"));
		baseUrl = fullPath.getParent();

		proxyMap = new HashMap<String, SoftReference<KrollProxy>>(5);

		appProperties = new TiProperties(getApplicationContext(), APPLICATION_PREFERENCES_NAME, false);
		systemProperties = new TiProperties(getApplicationContext(), SYSTEM_UNIT, true);

		if (getDeployType().equals(DEPLOY_TYPE_DEVELOPMENT)) {
			deployData = new TiDeployData(this);
		}
		tempFileHelper = new TiTempFileHelper(this);
	}

	@Override
	public void onTerminate()
	{
		stopExternalStorageMonitor();
		super.onTerminate();
	}

	public void postAppInfo()
	{
		TiPlatformHelper.initialize();
		TiFastDev.initFastDev(this);
	}

	public void postOnCreate()
	{
		KrollRuntime runtime = KrollRuntime.getInstance();
		if (runtime != null) {
			Log.i(TAG, "Titanium Javascript runtime: " + runtime.getRuntimeName());
		} else {
			// This ought not to be possible.
			Log.w(TAG, "Titanium Javascript runtime: unknown");
		}

		TiConfig.DEBUG = TiConfig.LOGD = systemProperties.getBool("ti.android.debug", false);

		startExternalStorageMonitor();
		
		// Register the default cache handler
		responseCache = new TiResponseCache(getRemoteCacheDir(), this);
		TiResponseCache.setDefault(responseCache);
		KrollRuntime.setPrimaryExceptionHandler(new TiExceptionHandler());
	}

	private File getRemoteCacheDir()
	{
		File cacheDir = new File(tempFileHelper.getTempDirectory(), "remote-cache");
		if (!cacheDir.exists())
		{
			cacheDir.mkdirs();
			tempFileHelper.excludeFileOnCleanup(cacheDir);
		}
		return cacheDir.getAbsoluteFile();
	}

	public void setRootActivity(TiRootActivity rootActivity)
	{
		this.rootActivity = new WeakReference<TiRootActivity>(rootActivity);
		rootActivityLatch.countDown();

		// calculate the display density
		DisplayMetrics dm = new DisplayMetrics();
		rootActivity.getWindowManager().getDefaultDisplay().getMetrics(dm);
		switch(dm.densityDpi)
		{
			case DisplayMetrics.DENSITY_HIGH: {
				density = "high";
				break;
			}
			case DisplayMetrics.DENSITY_MEDIUM: {
				density = "medium";
				break;
			}
			case DisplayMetrics.DENSITY_LOW: {
				density = "low";
				break;
			}
		}

		if (collectAnalytics()) {
			analyticsIntent = new Intent(this, TiAnalyticsService.class);
			analyticsModel = new TiAnalyticsModel(this);
			needsEnrollEvent = analyticsModel.needsEnrollEvent();

			if (needsEnrollEvent()) {
				String deployType = systemProperties.getString("ti.deploytype", "unknown");
				postAnalyticsEvent(TiAnalyticsEventFactory.createAppEnrollEvent(this,deployType));
			}

			if (needsStartEvent()) {
				String deployType = systemProperties.getString("ti.deploytype", "unknown");

				postAnalyticsEvent(TiAnalyticsEventFactory.createAppStartEvent(this, deployType));
			}

		} else {
			needsEnrollEvent = false;
			needsStartEvent = false;
			Log.i(TAG, "Analytics have been disabled");
		}
		tempFileHelper.scheduleCleanTempDir();
	}

	/**
	 * @return the app's root activity if exists, null otherwise.
	 */
	public TiRootActivity getRootActivity()
	{
		if (rootActivity == null) {
			return null;
		}

		return rootActivity.get();
	}

	/**
	 * @return whether the root activity is available
	 */
	public boolean isRootActivityAvailable()
	{
		if (rootActivity != null) {
			Activity activity = rootActivity.get();
			if (activity != null) {
				return !activity.isFinishing();
			}
		}

		return false;
	}

	public void setCurrentActivity(Activity callingActivity, Activity newValue)
	{
		synchronized (this) {
			// TabActivity (the container for tab activities) doesn't pause itself while it's
			// children tabs are being paused and resumed (while switching tabs), so this
			// covers that special case
			Activity currentActivity = getCurrentActivity();
			if (currentActivity instanceof TabActivity && newValue instanceof TiActivity) {
				TiActivity tiActivity = (TiActivity)newValue;
				if (tiActivity.isTab()) {
					this.currentActivity = new WeakReference<Activity>(newValue);

					return;
				}
			}

			if (currentActivity == null || (callingActivity == currentActivity && newValue == null)) {
				this.currentActivity = new WeakReference<Activity>(newValue);
			}
		}
	}

	public String getBaseUrl()
	{
		return baseUrl;
	}

	public String getStartUrl()
	{
		return startUrl;
	}

	private String getStartFilename(String defaultStartFile)
	{
		return defaultStartFile;
	}

	public void addAppEventProxy(KrollProxy appEventProxy)
	{
		Log.e(TAG, "APP PROXY: " + appEventProxy);
		if (appEventProxy != null && !appEventProxies.contains(appEventProxy)) {
			appEventProxies.add(new WeakReference<KrollProxy>(appEventProxy));
		}
	}

	public void removeAppEventProxy(KrollProxy appEventProxy)
	{
		appEventProxies.remove(appEventProxy);
	}

	public boolean fireAppEvent(String eventName, KrollDict data)
	{
		boolean handled = false;
		for (WeakReference<KrollProxy> weakProxy : appEventProxies) {
			KrollProxy appEventProxy = weakProxy.get();
			if (appEventProxy == null) {
				continue;
			}

			boolean proxyHandled = appEventProxy.fireEvent(eventName, data);
			handled = handled || proxyHandled;
		}

		return handled;
	}

	/**
	 * @return the app's properties, which are listed in tiapp.xml.
	 * App properties can also be set at runtime by the application in Javascript.
	 * @module.api
	 */
	public TiProperties getAppProperties()
	{
		return appProperties;
	}

	public TiProperties getSystemProperties()
	{
		return systemProperties;
	}

	public ITiAppInfo getAppInfo()
	{
		return appInfo;
	}

	/**
	 * @return the app's GUID. Each application has a unique GUID.
	 */
	public String getAppGUID()
	{
		return getAppInfo().getGUID();
	}

	public KrollDict getStylesheet(String basename, Collection<String> classes, String objectId)
	{
		if (stylesheet != null) {
			return stylesheet.getStylesheet(objectId, classes, density, basename);
		}
		return new KrollDict();
	}

	public void registerProxy(KrollProxy proxy)
	{
		String proxyId = proxy.getProxyId();
		if (!proxyMap.containsKey(proxyId)) {
			proxyMap.put(proxyId, new SoftReference<KrollProxy>(proxy));
		}
	}

	public KrollProxy unregisterProxy(String proxyId)
	{
		KrollProxy proxy = null;

		SoftReference<KrollProxy> ref = proxyMap.remove(proxyId);
		if (ref != null) {
			proxy = ref.get();
		}

		return proxy;
	}

	public synchronized boolean needsStartEvent()
	{
		return needsStartEvent;
	}

	public synchronized boolean needsEnrollEvent()
	{
		return needsEnrollEvent;
	}

	private boolean collectAnalytics()
	{
		return getAppInfo().isAnalyticsEnabled();
	}

	/**
	 * Posts analytic event to the server if the application is collecting analytic information.
	 * @param event the analytic event to be posted.
	 */
	public synchronized void postAnalyticsEvent(TiAnalyticsEvent event)
	{
		if (!collectAnalytics()) {
			Log.i(TAG, "Analytics are disabled, ignoring postAnalyticsEvent", Log.DEBUG_MODE);
			return;
		}

		if (Log.isDebugModeEnabled()) {
			StringBuilder sb = new StringBuilder();
			sb.append("Analytics Event: type=").append(event.getEventType())
				.append("\n event=").append(event.getEventEvent())
				.append("\n timestamp=").append(event.getEventTimestamp())
				.append("\n mid=").append(event.getEventMid())
				.append("\n sid=").append(event.getEventSid())
				.append("\n aguid=").append(event.getEventAppGuid())
				.append("\n isJSON=").append(event.mustExpandPayload())
				.append("\n payload=").append(event.getEventPayload());
			Log.d(TAG, sb.toString());
		}

		if (event.getEventType() == TiAnalyticsEventFactory.EVENT_APP_ENROLL) {
			if (needsEnrollEvent) {
				analyticsModel.addEvent(event);
				needsEnrollEvent = false;
				sendAnalytics();
				analyticsModel.markEnrolled();
			}

		} else if (event.getEventType() == TiAnalyticsEventFactory.EVENT_APP_START) {
			if (needsStartEvent) {
				analyticsModel.addEvent(event);
				needsStartEvent = false;
				sendAnalytics();
				lastAnalyticsTriggered = System.currentTimeMillis();
			}
			return;

		} else if (event.getEventType() == TiAnalyticsEventFactory.EVENT_APP_END) {
			needsStartEvent = true;
			analyticsModel.addEvent(event);
			sendAnalytics();

		} else {
			analyticsModel.addEvent(event);
			long now = System.currentTimeMillis();
			if (now - lastAnalyticsTriggered >= STATS_WAIT) {
				sendAnalytics();
				lastAnalyticsTriggered = now;
			}
		}
	}

	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_SEND_ANALYTICS) {
			if (startService(analyticsIntent) == null) {
				Log.w(TAG, "Analytics service not found.");
			}
			return true;
		}
		return false;
	}

	public void sendAnalytics()
	{
		if (analyticsIntent != null) {
			synchronized(this) {
				analyticsHandler.removeMessages(MSG_SEND_ANALYTICS);
				analyticsHandler.sendEmptyMessageDelayed(MSG_SEND_ANALYTICS, SEND_ANALYTICS_DELAY);
			}
		}
	}

	public String getDeployType()
	{
		return getSystemProperties().getString(PROPERTY_DEPLOY_TYPE, DEPLOY_TYPE_DEVELOPMENT);
	}

	/**
	 * @return the build version, which is built in as part of the SDK.
	 */
	public String getTiBuildVersion()
	{
		return buildVersion;
	}

	public String getTiBuildTimestamp()
	{
		return buildTimestamp;
	}

	public String getTiBuildHash()
	{
		return buildHash;
	}

	public String getDefaultUnit()
	{
		if (defaultUnit == null) {
			defaultUnit = getSystemProperties().getString(PROPERTY_DEFAULT_UNIT, SYSTEM_UNIT);
			// Check to make sure default unit is valid, otherwise use system
			Pattern unitPattern = Pattern.compile("system|px|dp|dip|mm|cm|in");
			Matcher m = unitPattern.matcher(defaultUnit);
			if (!m.matches()) {
				defaultUnit = SYSTEM_UNIT;
			}
		}
		return defaultUnit;
	}

	public int getThreadStackSize()
	{
		return getSystemProperties().getInt(PROPERTY_THREAD_STACK_SIZE, DEFAULT_THREAD_STACK_SIZE);
	}

	public boolean forceCompileJS()
	{
		return getSystemProperties().getBool(PROPERTY_COMPILE_JS, false);
	}

	public TiDeployData getDeployData()
	{
		return deployData;
	}

	public boolean isFastDevMode()
	{
		// Fast dev is enabled by default in development mode, and disabled otherwise
		// When the property is set, it overrides the default behavior
		return getSystemProperties().getBool(TiApplication.PROPERTY_FASTDEV,
			getDeployType().equals(TiApplication.DEPLOY_TYPE_DEVELOPMENT));
	}

	public boolean isCoverageEnabled()
	{
		if (!getDeployType().equals(TiApplication.DEPLOY_TYPE_PRODUCTION))
		{
			return getSystemProperties().getBool(TiApplication.PROPERTY_ENABLE_COVERAGE, false);
		}
		return false;
	}

	public void scheduleRestart(int delay)
	{
		Log.w(TAG, "Scheduling application restart");
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Here is call stack leading to restart. (NOTE: this is not a real exception, just a stack trace.) :");
			(new Exception()).printStackTrace();
		}
		this.restartPending = true;
		TiRootActivity rootActivity = getRootActivity();
		if (rootActivity != null) {
			rootActivity.restartActivity(delay);
		}
	}

	public boolean isRestartPending()
	{
		return restartPending;
	}

	public TiTempFileHelper getTempFileHelper()
	{
		return tempFileHelper;
	}

	/**
	 * @return true if the current thread is the main thread, false otherwise.
	 * @module.api
	 */
	public static boolean isUIThread()
	{
		if (mainThreadId == Thread.currentThread().getId()) {
			return true;
		}

		return false;
	}

	public KrollModule getModuleByName(String name)
	{
		WeakReference<KrollModule> module = modules.get(name);
		if (module == null) {
			return null;
		}

		return module.get();
	}

	public void registerModuleInstance(String name, KrollModule module)
	{
		if (modules.containsKey(name)) {
			Log.w(TAG, "Registering module with name already in use.");
		}

		modules.put(name, new WeakReference<KrollModule>(module));
	}

	public void waitForCurrentActivity(CurrentActivityListener l)
	{
		TiUIHelper.waitForCurrentActivity(l);
	}

	public boolean isDebuggerEnabled()
	{
		return getDeployData().isDebuggerEnabled();
	}

	private void startExternalStorageMonitor()
	{
		externalStorageReceiver = new BroadcastReceiver()
		{
			@Override
			public void onReceive(Context context, Intent intent)
			{
				if (Intent.ACTION_MEDIA_MOUNTED.equals(intent.getAction())) {
					responseCache.setCacheDir(getRemoteCacheDir());
					TiResponseCache.setDefault(responseCache);
					Log.i(TAG, "SD card has been mounted. Enabling cache for http responses.", Log.DEBUG_MODE);
					
				} else {
					// if the sd card is removed, we don't cache http responses
					TiResponseCache.setDefault(null);
					Log.i(TAG, "SD card has been unmounted. Disabling cache for http responses.", Log.DEBUG_MODE);
				}
			}
		};

		IntentFilter filter = new IntentFilter();

		filter.addAction(Intent.ACTION_MEDIA_MOUNTED);
		filter.addAction(Intent.ACTION_MEDIA_REMOVED);
		filter.addAction(Intent.ACTION_MEDIA_UNMOUNTED);
		filter.addAction(Intent.ACTION_MEDIA_BAD_REMOVAL);
		filter.addDataScheme("file");

		registerReceiver(externalStorageReceiver, filter);
	}

	private void stopExternalStorageMonitor()
	{
		unregisterReceiver(externalStorageReceiver);
	}

	public void dispose()
	{
		TiActivityWindows.dispose();
		TiFileHelper.getInstance().destroyTempFiles();
	}

	public void cancelTimers()
	{
		TitaniumModule.cancelTimers();
	}

	/**
	 * Our forced restarts (for conditions such as android bug 2373, TIMOB-1911 and TIMOB-7293)
	 * don't create new processes or pass through TiApplication() (the ctor). We need to reset
	 * some state to better mimic a complete application restart.
	 */
	public void beforeForcedRestart()
	{
		restartPending = false;
		currentActivity = null;
		TiApplication.isActivityTransition.set(false);
		if (TiApplication.activityTransitionListeners != null) {
			TiApplication.activityTransitionListeners.clear();
		}
		if (TiApplication.activityStack != null) {
			TiApplication.activityTransitionListeners.clear();
		}
	}

	public abstract void verifyCustomModules(TiRootActivity rootActivity);
}

