/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;
import java.lang.Thread.UncaughtExceptionHandler;
import java.util.HashMap;

import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEvent;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEventFactory;
import org.appcelerator.titanium.module.app.TitaniumProperties;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSRefCache;
import org.appcelerator.titanium.util.TitaniumPlatformHelper;
import org.xml.sax.SAXException;

import android.app.Application;
import android.content.Context;
import android.content.Intent;

public class TitaniumApplication
	extends Application
{
	public static final String LCAT = "TiApp";
	private static boolean DBG = TitaniumConfig.LOGD;
	private static final long STATS_WAIT = 300000;

	public static final String APP_ASSET_KEY = "tiapp";
	public static final String APP_CONTENT_KEY = "ticontent";

	private TitaniumAppInfo appInfo;

	private boolean needsStartEvent;
	private boolean needsEnrollEvent;
	private boolean needsSplashScreen;
	private HashMap<String,String> sourceCache;
	private TitaniumJSRefCache objectCache;

	protected TitaniumAnalyticsModel analyticsModel;
	protected Intent analyticsIntent;

	private static TitaniumApplication me;
	private static long lastAnalyticsTriggered = 0;

	public TitaniumApplication() {
		needsEnrollEvent = false; // test is after DB is available
		needsStartEvent = true;
		needsSplashScreen = true;
		sourceCache = new HashMap<String,String>(8);
		objectCache = new TitaniumJSRefCache();
	}

	public static TitaniumApplication getInstance() {
		return me;
	}

	@Override
	public void onCreate() {
		super.onCreate();
		if (DBG) {
			Log.d(LCAT, "Application.onCreate()");
		}

		if (me == null) {
			me = this;
		} else {
			throw new IllegalStateException("Attempt to contruct more than on TitaniumApplication.");
		}

		final UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
		Thread.setDefaultUncaughtExceptionHandler(new UncaughtExceptionHandler() {

			public void uncaughtException(Thread t, Throwable e) {
				Log.e("TiUncaughtHandler", "Sending event: exception on thread: " + t.getName() + " msg:" + e.toString());
				postAnalyticsEvent(TitaniumAnalyticsEventFactory.createErrorEvent(t, e));
				defaultHandler.uncaughtException(t, e);
			}
		});

		try {
			loadAppInfo(getApplicationContext());
		} catch (SAXException e) {
			Log.e(LCAT, "Error parsing tiapp.xml", e);
		} catch (IOException e) {
			Log.e(LCAT, "Error loading tiapp.xml", e);
		}

		TitaniumPlatformHelper.initialize(this);

		if (appInfo.collectAnalytics()) {
			analyticsIntent = new Intent(this, TitaniumAnalyticsService.class);
			analyticsModel = new TitaniumAnalyticsModel(this);
			needsEnrollEvent = analyticsModel.needsEnrollEvent();
		} else {
			needsEnrollEvent = false;
			needsStartEvent = false;
			Log.i(LCAT, "Analytics have been disabled");
		}
	}

	@Override
	public void onLowMemory() {
		super.onLowMemory();
		synchronized(sourceCache) {
			sourceCache.clear();
		}
	}

	@Override
	public void onTerminate() {
		super.onTerminate();
		if (DBG) {
			Log.d(LCAT, "Application.onTerminate()");
		}
	}

	public TitaniumAppInfo getAppInfo() {
		return appInfo;
	}

	public String loadAppInfo(Context context)
		throws IOException, SAXException
	{
		InputStream is = null;
		String appInfoKey = null;

		try {
			is = context.getAssets().open("tiapp.xml");
			appInfo = TitaniumAppInfo.loadFromXml(is, context);
			Context appContext = context.getApplicationContext();
			TitaniumConfig.LOGV = appInfo.getSystemProperties().getBool(TitaniumAppInfo.PROP_ANDROID_DEBUG, false);
			TitaniumConfig.LOGD = TitaniumConfig.LOGV;
			TitaniumProperties.DBG = TitaniumConfig.LOGV;
			TitaniumApplication.DBG = TitaniumConfig.LOGV;

			synchronized(appContext) {
				 Log.i(LCAT, "tiapp.xml processed, notifying components");
				 appContext.notifyAll();
			}
		} finally {
			if (is != null) {
				try {
					is.close();
				} catch (IOException e) {
					// Ignore
				}
			}
		}

		return appInfoKey;
	}

	public String getSourceFor(String url) {
		synchronized(sourceCache) {
			return sourceCache.get(url);
		}
	}

	public void setSourceFor(String url, String source) {
		synchronized(sourceCache) {
			sourceCache.put(url, source);
		}
	}

	public static Class<?> getActivityForType(String windowType)
	{
		Class<?> activity = null;

		if (windowType == null) {
			windowType = "single";
		}

		if ("single".compareTo(windowType) == 0) {
			activity = TitaniumActivity.class;
		} else {
			throw new IllegalStateException("Unknown window type: " + windowType);
		}

		return activity;
	}

	public void addModule(TitaniumModuleManager moduleMgr) {

	}

	public synchronized boolean needsStartEvent() {
		return needsStartEvent;
	}

	public synchronized boolean needsEnrollEvent() {
		return needsEnrollEvent;
	}

	public synchronized boolean needsSplashScreen() {
		return needsSplashScreen;
	}

	public synchronized void setNeedsSplashScreen(boolean needsSplashScreen) {
		this.needsSplashScreen = needsSplashScreen;
	}

	public synchronized void postAnalyticsEvent(TitaniumAnalyticsEvent event)
	{
		if (!appInfo.collectAnalytics()) {
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

		if (event.getEventType() == TitaniumAnalyticsEventFactory.EVENT_APP_ENROLL) {
			if (needsEnrollEvent) {
				analyticsModel.addEvent(event);
				needsEnrollEvent = false;
				sendAnalytics();
				analyticsModel.markEnrolled();
			}
		} else if (event.getEventType() == TitaniumAnalyticsEventFactory.EVENT_APP_START) {
			if (needsStartEvent) {
				analyticsModel.addEvent(event);
				needsStartEvent = false;
				sendAnalytics();
				lastAnalyticsTriggered = System.currentTimeMillis();
			}
			return;
		} else if (event.getEventType() == TitaniumAnalyticsEventFactory.EVENT_APP_END) {
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

	public String getSessionId() {
		return TitaniumPlatformHelper.getSessionId();
	}

	public void sendAnalytics() {
		if (analyticsIntent != null) {
			if (startService(analyticsIntent) == null) {
				Log.w(LCAT, "Analytics service not found.");
			}
		}
	}

	public TitaniumJSRefCache getObjectCache() {
		return objectCache;
	}
}
