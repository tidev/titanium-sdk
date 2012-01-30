/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.lang.ref.WeakReference;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
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
	private static final String LCAT = "TiContext";
	private static final boolean DBG = TiConfig.LOGD;
	@SuppressWarnings("unused")
	private static final boolean TRACE = TiConfig.LOGV;

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
	//protected KrollBridge krollBridge;

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

		if (activity instanceof TiActivity) {
			//((TiActivity)activity).addTiContext(this);
		}

		if (DBG) {
			Log.e(LCAT, "BaseURL for context is " + baseUrl);
		}
	}

	public boolean isUIThread()
	{
		return Thread.currentThread().getId() == mainThreadId;
	}
/*
	public KrollBridge getKrollBridge()
	{
		//return krollBridge;
	}

	public void setKrollBridge(KrollBridge bridge)
	{
		//this.krollBridge = bridge;
	}
*/
	public Activity getActivity()
	{
		if (weakActivity == null) return null;
		Activity activity = weakActivity.get();
		return activity;
	}

	public void setActivity(Activity activity)
	{
		if (activity instanceof TiActivity) {
			//((TiActivity)activity).addTiContext(this);
		}
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
		//return baseUrl.resolve(this, baseUrl.baseUrl, path, scheme);
		return "";
	}

	public String resolveUrl(String scheme, String path, String relativeTo)
	{
		//return baseUrl.resolve(this, relativeTo, path, scheme);
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

	// Javascript Support

	public Object evalFile(String filename, Messenger messenger, int messageId)
		throws IOException
	{
		Object result = null;
		String setUrlBackTo = null;
		if (this.currentUrl != null && this.currentUrl.length() > 0 && !this.currentUrl.equals(filename)) {
			// A new file is being eval'd.  Must be from an include() statement.  Remember to set back
			// the original url, else things like JSS which depend on context's filename will break.
			setUrlBackTo = this.currentUrl;
		}
		this.currentUrl = filename;
/*		if (krollBridge == null) {
			if (DBG) {
				Log.w(LCAT, "Cannot eval file '" + filename + "'. Context has been released already.");
			}
			if (setUrlBackTo != null) { this.currentUrl = setUrlBackTo; }
			return null;
		}
*/

		//result = krollBridge.evalFile(filename);
		if (messenger != null) {
			try {
				Message msg = Message.obtain();
				msg.what = messageId;
				messenger.send(msg);
				if (DBG) {
					Log.d(LCAT, "Notifying caller that evalFile has completed");
				}
			} catch(RemoteException e) {
				Log.w(LCAT, "Failed to notify caller that eval completed");
			}
		}
		if (setUrlBackTo != null) { this.currentUrl = setUrlBackTo; }
		return result;
	}

	public Object evalFile(String filename)
		throws IOException
	{
		return evalFile(filename, null, -1);
	}

	public Object evalJS(String src)
	{
/*
		if (krollBridge == null)
		{
			Log.e(LCAT,"on evalJS, evaluator is null and shouldn't be");
		}
		return krollBridge.evalJS(src);
*/
		return null;
	}

/*
	public Scriptable getScope()
	{
		if (krollBridge != null) {
			return krollBridge.getScope();
		}
		return null;
	}
*/

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
					Log.e(LCAT, "Error dispatching lifecycle event: " + t.getMessage(), t);
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

	//@Override
	public void error(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		//TiJSErrorDialog.openErrorDialog(this, getActivity(), "Error", message, sourceName, line, lineSource, lineOffset);
	}

	//@Override
	public void runtimeError(String message, String sourceName, int line, String lineSource, int lineOffset)
	//public EvaluatorException runtimeError(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		//TiJSErrorDialog.openErrorDialog(this, getActivity(), "Runtime Error", message, sourceName, line, lineSource, lineOffset);
		//return new EvaluatorException(message, sourceName, line, lineSource, lineOffset);
	}

	//@Override
	public void warning(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		//TiJSErrorDialog.openErrorDialog(this, getActivity(), "Warning", message, sourceName, line, lineSource, lineOffset);
	}

	public static TiContext createTiContext(Activity activity, String baseUrl)
	{
		return createTiContext(activity, baseUrl, null);
	}

	public static TiContext createTiContext(Activity activity, String baseUrl, String loadFile)
	{
		TiContext tic = new TiContext(activity, baseUrl);
/*
		KrollContext kroll = KrollContext.createContext(tic, loadFile);
		tic.setKrollContext(kroll);
		KrollBridge krollBridge = new KrollBridge(kroll);
		tic.setKrollBridge(krollBridge);
*/
		return tic;
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
		/*
		KrollContext currentCtx = KrollContext.getCurrentKrollContext();
		if (currentCtx == null) {
			return null;
		}
		return currentCtx.getTiContext();
		*/
		return new TiContext(null, "");
	}

	public void release()
	{
		/*
		if (krollBridge != null) {
			krollBridge.release();
			krollBridge = null;
		}
		*/
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

