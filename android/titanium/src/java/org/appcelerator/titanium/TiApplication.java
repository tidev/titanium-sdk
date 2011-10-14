/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.Thread.UncaughtExceptionHandler;
import java.lang.ref.SoftReference;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Properties;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.analytics.TiAnalyticsEvent;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.analytics.TiAnalyticsModel;
import org.appcelerator.titanium.analytics.TiAnalyticsService;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiResponseCache;
import org.appcelerator.titanium.util.TiTempFileHelper;
import org.appcelerator.titanium.view.ITiWindowHandler;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.DisplayMetrics;

public class TiApplication extends Application implements Handler.Callback
{
	private static final String LCAT = "TiApplication";
	private static final boolean DBG = TiConfig.LOGD;
	private static final long STATS_WAIT = 300000;
	private static final int MSG_SEND_ANALYTICS = 100;
	private static final long SEND_ANALYTICS_DELAY = 30000; // Time analytics send request sits in queue before starting service.
	private static final String PROPERTY_DEPLOY_TYPE = "ti.deploytype";
	private static final String PROPERTY_THREAD_STACK_SIZE = "ti.android.threadstacksize";
	private static final String PROPERTY_COMPILE_JS = "ti.android.compilejs";
	private static final String PROPERTY_ENABLE_COVERAGE = "ti.android.enablecoverage";

	public static final String DEPLOY_TYPE_DEVELOPMENT = "development";
	public static final String DEPLOY_TYPE_TEST = "test";
	public static final String DEPLOY_TYPE_PRODUCTION = "production";
	public static final int DEFAULT_THREAD_STACK_SIZE = 16 * 1024; // 16K as a "sane" default
	public static final String APPLICATION_PREFERENCES_NAME = "titanium";
	public static final String PROPERTY_FASTDEV = "ti.android.fastdev";

	private static long lastAnalyticsTriggered = 0;
	private static long mainThreadId = 0;

	protected static TiApplication tiApp = null;

	private String baseUrl;
	private String startUrl;
	private HashMap<Class<?>, HashMap<String, Method>> methodMap;
	private HashMap<String, SoftReference<KrollProxy>> proxyMap;
	private TiRootActivity rootActivity;
	private TiProperties appProperties;
	private TiProperties systemProperties;
	private ITiWindowHandler windowHandler;
	private Activity currentActivity;
	private String density;
	private boolean needsStartEvent;
	private boolean needsEnrollEvent;
	private String buildVersion = "", buildTimestamp = "", buildHash = "";
	private HashMap<String, KrollModule> modules;

	protected TiAnalyticsModel analyticsModel;
	protected Intent analyticsIntent;
	protected Handler analyticsHandler;
	protected TiDeployData deployData;
	protected TiTempFileHelper tempFileHelper;
	protected ITiAppInfo appInfo;
	protected TiStylesheet stylesheet;

	public TiApplication()
	{
		Log.checkpoint(LCAT, "checkpoint, app created.");

		analyticsHandler = new Handler(this);
		needsEnrollEvent = false; // test is after DB is available
		needsStartEvent = true;
		loadBuildProperties();

		mainThreadId = Looper.getMainLooper().getThread().getId();
		tiApp = this;

		modules = new HashMap<String, KrollModule>();

		Log.i(LCAT, "Titanium " + buildVersion + " (" + buildTimestamp + " " + buildHash + ")");
	}

	public static TiApplication getInstance()
	{
		return tiApp;
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
		if (DBG) {
			Log.d(LCAT, "Application onCreate");
		}

		final UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
		Thread.setDefaultUncaughtExceptionHandler(new UncaughtExceptionHandler() {
			public void uncaughtException(Thread t, Throwable e) {
				String tiVer = buildVersion + "," + buildTimestamp + "," + buildHash ;
				Log.e(LCAT, "Sending event: exception on thread: " + t.getName() + " msg:" + e.toString() + "; Titanium " + tiVer, e);
				postAnalyticsEvent(TiAnalyticsEventFactory.createErrorEvent(t, e, tiVer));
				defaultHandler.uncaughtException(t, e);
			}
		});

		baseUrl = TiC.URL_ANDROID_ASSET_RESOURCES;

		File fullPath = new File(baseUrl, getStartFilename("app.js"));
		baseUrl = fullPath.getParent();

		methodMap = new HashMap<Class<?>, HashMap<String,Method>>(25);
		proxyMap = new HashMap<String, SoftReference<KrollProxy>>(5);

		appProperties = new TiProperties(getApplicationContext(), APPLICATION_PREFERENCES_NAME, false);
		systemProperties = new TiProperties(getApplicationContext(), "system", true);

		if (getDeployType().equals(DEPLOY_TYPE_DEVELOPMENT)) {
			deployData = new TiDeployData();
		}
		tempFileHelper = new TiTempFileHelper(this);
	}

	public void postAppInfo() {
		TiPlatformHelper.initialize();
	}

	public void postOnCreate() {
		TiConfig.LOGD = systemProperties.getBool("ti.android.debug", false);

		// Register the default cache handler
		File cacheDir = new File(new TiFileHelper(this).getDataDirectory(false), "remote-image-cache");
		if (!cacheDir.exists()) {
			cacheDir.mkdirs();
		}
		TiResponseCache.setDefault(new TiResponseCache(cacheDir.getAbsoluteFile(), this));
	}

	public void setRootActivity(TiRootActivity rootActivity)
	{
		//TODO consider weakRef
		this.rootActivity = rootActivity;
		//this.windowHandler = rootActivity;

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
			Log.i(LCAT, "Analytics have been disabled");
		}
		tempFileHelper.scheduleCleanTempDir();
	}

	public TiRootActivity getRootActivity() {
		return rootActivity;
	}

	public ITiWindowHandler getWindowHandler() {
		return windowHandler;
	}

	public Activity getCurrentActivity() {
		return currentActivity;
	}

	public void setCurrentActivity(Activity callingActivity, Activity newValue)
	{
		synchronized (this) {
			if (currentActivity == null || (callingActivity == currentActivity && newValue == null)) {
				currentActivity = newValue;
			}
		}
	}

	public void setWindowHandler(ITiWindowHandler windowHandler) {
		if (windowHandler == null) {
			//this.windowHandler = rootActivity;
		} else {
			this.windowHandler = windowHandler; //TODO weakRef?
		}
	}

	public String getBaseUrl() {
		return baseUrl;
	}

	public String getStartUrl() {
		return startUrl;
	}

	private String getStartFilename(String defaultStartFile) {
		return defaultStartFile;
	}

	private ArrayList<KrollProxy> appEventProxies = new ArrayList<KrollProxy>();
	public void addAppEventProxy(KrollProxy appEventProxy)
	{
		Log.e(LCAT, "APP PROXY: " + appEventProxy);
		if (appEventProxy != null && !appEventProxies.contains(appEventProxy)) {
			appEventProxies.add(appEventProxy);
		}
	}

	public void removeAppEventProxy(KrollProxy appEventProxy)
	{
		appEventProxies.remove(appEventProxy);
	}

	public boolean fireAppEvent(String eventName, KrollDict data)
	{
		// TODO boolean handled = false;
		for (KrollProxy appEventProxy : appEventProxies)
		{
			/*TODO boolean proxyHandled = */appEventProxy.fireEvent(eventName, data);
			//handled = handled || proxyHandled;
		}
		//TODO return handled;
		return true;
	}

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

	public synchronized void postAnalyticsEvent(TiAnalyticsEvent event)
	{
		if (!collectAnalytics()) {
			if (DBG) {
				Log.i(LCAT, "Analytics are disabled, ignoring postAnalyticsEvent");
			}
			return;
		}

		if (DBG) {
			StringBuilder sb = new StringBuilder();
			sb.append("Analytics Event: type=").append(event.getEventType())
				.append("\n event=").append(event.getEventEvent())
				.append("\n timestamp=").append(event.getEventTimestamp())
				.append("\n mid=").append(event.getEventMid())
				.append("\n sid=").append(event.getEventSid())
				.append("\n aguid=").append(event.getEventAppGuid())
				.append("\n isJSON=").append(event.mustExpandPayload())
				.append("\n payload=").append(event.getEventPayload())
				;
			Log.d(LCAT, sb.toString());
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
				Log.w(LCAT, "Analytics service not found.");
			}
			return true;
		}
		return false;
	}

	public void sendAnalytics() {
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
		Log.w(LCAT, "Scheduling application restart");
		if (DBG) {
			Log.d(LCAT, "Here is call stack leading to restart. (NOTE: this is not a real exception, just a stack trace.) :");
			(new Exception()).printStackTrace();
		}
		if (getRootActivity() != null) {
			getRootActivity().restartActivity(delay);
		}
	}

	public TiTempFileHelper getTempFileHelper()
	{
		return tempFileHelper;
	}

	public static boolean isUIThread()
	{
		if (mainThreadId == Looper.getMainLooper().getThread().getId()) {
			return true;
		}

		return false;
	}

	public KrollModule getModuleByName(String name) {
		return modules.get(name);
	}

	public void registerModuleInstance(String name, KrollModule module) {
		if (modules.containsKey(name)) {
			Log.w(LCAT, "Registering module with name already in use.");
		}
		modules.put(name, module);
	}
}

