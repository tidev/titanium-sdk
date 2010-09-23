/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Properties;

import org.appcelerator.titanium.ITiStylesheet;
import org.appcelerator.titanium.analytics.TiAnalyticsEvent;
import org.appcelerator.titanium.analytics.TiAnalyticsEventFactory;
import org.appcelerator.titanium.analytics.TiAnalyticsModel;
import org.appcelerator.titanium.analytics.TiAnalyticsService;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiResourceHelper;
import org.appcelerator.titanium.view.ITiWindowHandler;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;
import android.util.DisplayMetrics;

// Naming TiHost to more closely match other implementations
public class TiApplication extends Application
{
	public static final String DEPLOY_TYPE_DEVELOPMENT = "development";
	public static final String DEPLOY_TYPE_TEST = "test";
	public static final String DEPLOY_TYPE_PRODUCTION = "production";
	public static final int DEFAULT_THREAD_STACK_SIZE = 16 * 1024; // 16K as a "sane" default
	
	private static final String PROPERTY_DEPLOY_TYPE = "ti.deploytype";
	private static final String PROPERTY_THREAD_STACK_SIZE = "ti.android.threadstacksize";
	private static final String PROPERTY_COMPILE_JS = "ti.android.compilejs";
	
	private static final String LCAT = "TiApplication";
	private static final boolean DBG = TiConfig.LOGD;
	private static final long STATS_WAIT = 300000;

	private String baseUrl;
	private String startUrl;
	private HashMap<Class<?>, HashMap<String, Method>> methodMap;
	private HashMap<String, SoftReference<TiProxy>> proxyMap;
	private TiRootActivity rootActivity;
	private TiProperties appProperties;
	private TiProperties systemProperties;
	private ITiWindowHandler windowHandler;
	private Activity currentActivity;
	protected ITiAppInfo appInfo;
	protected ITiStylesheet stylesheet;
	private String density;

	private boolean needsStartEvent;
	private boolean needsEnrollEvent;
	protected TiAnalyticsModel analyticsModel;
	protected Intent analyticsIntent;
	private static long lastAnalyticsTriggered = 0;
	private String buildVersion, buildTimestamp, buildHash;

	public TiApplication() {
		Log.checkpoint("checkpoint, app created.");

		needsEnrollEvent = false; // test is after DB is available
		needsStartEvent = true;
		getBuildVersion();
	}

	private void getBuildVersion() {
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

		TiScriptRunner.getInstance().setAppPackageName(getPackageName());
		if (DBG) {
			Log.d(LCAT, "Application onCreate");
		}

		final UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
		Thread.setDefaultUncaughtExceptionHandler(new UncaughtExceptionHandler() {

			public void uncaughtException(Thread t, Throwable e) {
				Log.e("TiUncaughtHandler", "Sending event: exception on thread: " + t.getName() + " msg:" + e.toString(), e);
				postAnalyticsEvent(TiAnalyticsEventFactory.createErrorEvent(t, e));
				defaultHandler.uncaughtException(t, e);
			}
		});

		baseUrl = "file:///android_asset/Resources/";

		File fullPath = new File(baseUrl, getStartFilename("app.js"));
		baseUrl = fullPath.getParent();

		methodMap = new HashMap<Class<?>, HashMap<String,Method>>(25);
		proxyMap = new HashMap<String, SoftReference<TiProxy>>(5);

		TiPlatformHelper.initialize(this);
		
		appProperties = new TiProperties(getApplicationContext(), "titanium", false);
		systemProperties = new TiProperties(getApplicationContext(), "system", true);

		//systemProperties.setString("ti.version", buildVersion); // was always setting "1.0"
	}
	
	protected void onAfterCreate()
	{
	    // this is called from the applications onCreate (subclass)
	    // once the appInfo has been set since this method has a dependency
	    // on it
    	TiResourceHelper.initialize(this);
	}
	
	public void setRootActivity(TiRootActivity rootActivity)
	{
		// Chicken and Egg problem. Set debugging here since I don't want to
		// change the code generator query app info for properties.

		TiConfig.LOGD = systemProperties.getBool("ti.android.debug", false);

		//TODO consider weakRef
		this.rootActivity = rootActivity;
		this.windowHandler = rootActivity;

        // calculate the display density
		DisplayMetrics dm = new DisplayMetrics();
		rootActivity.getWindowManager().getDefaultDisplay().getMetrics(dm);
		switch(dm.densityDpi)
		{
		    case DisplayMetrics.DENSITY_HIGH:
		    {
		        density = "high";
		        break;
		    }
		    case DisplayMetrics.DENSITY_MEDIUM:
		    {
		        density = "medium";
		        break;
		    }
		    case DisplayMetrics.DENSITY_LOW:
		    {
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
			this.windowHandler = rootActivity;
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

	public synchronized Method methodFor(Class<?> source, String name)
	{
		HashMap<String, Method> classMethods = methodMap.get(source);
		if (classMethods == null) {
			Method[] methods = source.getMethods();
			classMethods = new HashMap<String, Method>(methods.length);
			methodMap.put(source, classMethods);

			// we need to sort methods by their implementation order
			// i.e. subClass > superClass precedence
			final HashMap<Class<?>, Integer> hierarchy = new HashMap<Class<?>, Integer>();
			int i = 0;
			hierarchy.put(source, 0);
			for (Class<?> superClass = source.getSuperclass(); superClass != null;
				superClass = superClass.getSuperclass())
			{
				hierarchy.put(superClass, ++i);
			}

			Comparator<Method> comparator = new Comparator<Method>()
			{
				public int compare(Method o1, Method o2) {
					int h1 = hierarchy.get(o1.getDeclaringClass());
					int h2 = hierarchy.get(o2.getDeclaringClass());
					return h1-h2;
				}
			};

			List<Method> methodList = Arrays.asList(methods);
			Collections.sort(methodList, comparator);
			Collections.reverse(methodList);

			for(Method method : methodList) {
				// TODO filter?
				//Log.e(LCAT, "Obj: " + source.getSimpleName() + " Method: " + method.getName());
				classMethods.put(method.getName(), method);
			}
		}

		return classMethods.get(name);
	}

	private ArrayList<TiProxy> appEventProxies = new ArrayList<TiProxy>();
	public void addAppEventProxy(TiProxy appEventProxy)
	{
		Log.e(LCAT, "APP PROXY: " + appEventProxy);
		if (appEventProxy != null && !appEventProxies.contains(appEventProxy)) {
			appEventProxies.add(appEventProxy);
		}
	}

	public void removeAppEventProxy(TiProxy appEventProxy)
	{
		appEventProxies.remove(appEventProxy);
	}

	public boolean fireAppEvent(String eventName, TiDict data)
	{
		boolean handled = false;
		for (TiProxy appEventProxy : appEventProxies)
		{
			boolean proxyHandled = appEventProxy.getTiContext().dispatchEvent(eventName, data, appEventProxy);
			handled = handled || proxyHandled;
		}
		return handled;
	}
	
	public void removeEventListenersFromContext(TiContext listeningContext)
	{
		for (TiProxy appEventProxy : appEventProxies)
		{
			appEventProxy.removeEventListenersFromContext(listeningContext);
		}
	}

	public TiProperties getAppProperties()
	{
		return appProperties;
	}

	public TiProperties getSystemProperties()
	{
		return systemProperties;
	}

	public ITiAppInfo getAppInfo() {
		return appInfo;
	}
	
	public TiDict getStylesheet(String basename, String type, String objectId) {
	    if (stylesheet!=null) {
        	return stylesheet.getStylesheet(objectId,type,density,basename);
	    }
	    return new TiDict();
	}

	public void registerProxy(TiProxy proxy) {
		String proxyId = proxy.proxyId;
		if (!proxyMap.containsKey(proxyId)) {
			proxyMap.put(proxyId, new SoftReference<TiProxy>(proxy));
		}
	}

	public TiProxy unregisterProxy(String proxyId) {
		TiProxy proxy = null;

		SoftReference<TiProxy> ref = proxyMap.remove(proxyId);
		if (ref != null) {
			proxy = ref.get();
		}

		return proxy;
	}

	@Override
	public void onLowMemory()
	{
		super.onLowMemory();
	}

	@Override
	public void onTerminate() {
		super.onTerminate();
	}

	public synchronized boolean needsStartEvent() {
		return needsStartEvent;
	}

	public synchronized boolean needsEnrollEvent() {
		return needsEnrollEvent;
	}

	private boolean collectAnalytics() {
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

	public void sendAnalytics() {
		if (analyticsIntent != null) {
			if (startService(analyticsIntent) == null) {
				Log.w(LCAT, "Analytics service not found.");
			}
		}
	}

	public String getDeployType()
	{
		return getSystemProperties().getString(PROPERTY_DEPLOY_TYPE, DEPLOY_TYPE_DEVELOPMENT);
	}

	public String getTiBuildVersion() {
		return buildVersion;
	}

	public String getTiBuildTimestamp() {
		return buildTimestamp;
	}
	
	public String getTiBuildHash() {
		return buildHash;
	}
	
	public int getThreadStackSize() {
		return getSystemProperties().getInt(PROPERTY_THREAD_STACK_SIZE, DEFAULT_THREAD_STACK_SIZE);
	}
	
	public boolean forceCompileJS() {
		return getSystemProperties().getBool(PROPERTY_COMPILE_JS, false);
	}
}
