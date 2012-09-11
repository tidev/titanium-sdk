/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUrl;
import org.appcelerator.titanium.util.TiWeakList;

import android.app.Activity;
import android.content.ContextWrapper;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;

public class TiContext// implements ErrorReporter
{
	private static final String TAG = "TiContext";

	public static final int LIFECYCLE_ON_START = 0;
	public static final int LIFECYCLE_ON_RESUME = 1;
	public static final int LIFECYCLE_ON_PAUSE = 2;
	public static final int LIFECYCLE_ON_STOP = 3;
	public static final int LIFECYCLE_ON_DESTROY = 4;

	private long mainThreadId;

	private TiUrl baseUrl;
	private String currentUrl;
	private boolean launchContext;

	private WeakReference<Activity> weakActivity;
	private TiApplication tiApp;
	protected KrollContext krollContext;

	private TiWeakList<OnLifecycleEvent> lifecycleListeners;

	public static interface OnLifecycleEvent {
		void onStart(Activity activity);
		void onResume(Activity activity);
		void onPause(Activity activity);
		void onStop(Activity activity);
		void onDestroy(Activity activity);
	}

	public TiContext(Activity activity, String baseUrl)
	{
		this.mainThreadId = Looper.getMainLooper().getThread().getId();
		if (activity != null) {
			this.tiApp = (TiApplication) activity.getApplication();
		} else {
			this.tiApp = TiApplication.getInstance();
		}
		this.weakActivity = new WeakReference<Activity>(activity);
		lifecycleListeners = new TiWeakList<OnLifecycleEvent>(true);
		if (baseUrl == null) {
			baseUrl = TiC.URL_APP_PREFIX;
		} else if (!baseUrl.endsWith("/")) {
			baseUrl += "/";
		}
		this.baseUrl = new TiUrl(baseUrl, null);

		Log.e(TAG, "BaseURL for context is " + baseUrl, Log.DEBUG_MODE);
	}

	public boolean isUIThread()
	{
		return Thread.currentThread().getId() == mainThreadId;
	}

	public Activity getActivity()
	{
		if (weakActivity == null) return null;
		Activity activity = weakActivity.get();
		return activity;
	}

	public void setActivity(Activity activity)
	{
		weakActivity = new WeakReference<Activity>(activity);
	}

	public TiApplication getTiApp() 
	{
		return tiApp;
	}

	public TiRootActivity getRootActivity()
	{
		return getTiApp().getRootActivity();
	}

	public TiFileHelper getTiFileHelper()
	{
		return new TiFileHelper(getTiApp());
	}

	public String resolveUrl(String path)
	{
		return resolveUrl(null, path);
	}

	public String resolveUrl(String scheme, String path)
	{
		return "";
	}

	public String resolveUrl(String scheme, String path, String relativeTo)
	{
		return "";
	}

	public String getBaseUrl()
	{
		return baseUrl.baseUrl;
	}

	public String getCurrentUrl()
	{
		return currentUrl;
	}


	public void addOnLifecycleEventListener(OnLifecycleEvent listener)
	{
		lifecycleListeners.add(new WeakReference<OnLifecycleEvent>(listener));
	}

	public void removeOnLifecycleEventListener(OnLifecycleEvent listener)
	{
		lifecycleListeners.remove(listener);
	}

	public void fireLifecycleEvent(Activity activity, int which)
	{
		synchronized (lifecycleListeners.synchronizedList()) {
			for (OnLifecycleEvent listener : lifecycleListeners.nonNull()) {
				try {
					fireLifecycleEvent(activity, listener, which);
				} catch (Throwable t) {
					Log.e(TAG, "Error dispatching lifecycle event: " + t.getMessage(), t);
				}
			}
		}
	}

	protected void fireLifecycleEvent(Activity activity, OnLifecycleEvent listener, int which)
	{
		switch (which) {
			case LIFECYCLE_ON_START: listener.onStart(activity); break;
			case LIFECYCLE_ON_RESUME: listener.onResume(activity); break;
			case LIFECYCLE_ON_PAUSE: listener.onPause(activity); break;
			case LIFECYCLE_ON_STOP: listener.onStop(activity); break;
			case LIFECYCLE_ON_DESTROY: listener.onDestroy(activity); break;
		}
	}

	public void error(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
	}

	public void runtimeError(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
	}

	public void warning(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
	}

	public static TiContext createTiContext(Activity activity, String baseUrl)
	{
		return createTiContext(activity, baseUrl, null);
	}

	public static TiContext createTiContext(Activity activity, String baseUrl, String loadFile)
	{
		return new TiContext(activity, baseUrl);
	}

	public KrollContext getKrollContext()
	{
		return krollContext;
	}

	public void setKrollContext(KrollContext krollContext)
	{
		this.krollContext = krollContext;
	}

	public static TiContext getCurrentTiContext()
	{
		return new TiContext(null, "");
	}

	public void release()
	{
		if (lifecycleListeners != null) {
			lifecycleListeners.clear();
		}
	}

	public boolean isLaunchContext()
	{
		return launchContext;
	}

	public void setLaunchContext(boolean launchContext)
	{
		this.launchContext = launchContext;
	}

	public ContextWrapper getAndroidContext()
	{
		if (weakActivity == null || weakActivity.get() == null) {
			return tiApp;
		}
		return weakActivity.get();
	}

	public void setBaseUrl(String baseUrl)
	{
		this.baseUrl.baseUrl = baseUrl;
		if (this.baseUrl.baseUrl == null) {
			this.baseUrl.baseUrl = TiC.URL_APP_PREFIX;
		}
	}
}

