/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.mozilla.javascript.ErrorReporter;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Scriptable;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.os.Process;
import android.os.RemoteException;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

public class TiContext implements TiEvaluator, ITiMenuDispatcherListener, ErrorReporter
{
	private static final String LCAT = "TiContext";
	private static final boolean DBG = TiConfig.LOGD;
	private static final boolean TRACE = TiConfig.LOGV;

	private long mainThreadId;

	private String baseUrl;
	private String currentUrl;

	private WeakReference<Activity> weakActivity;
	private TiEvaluator	tiEvaluator;
	private TiApplication tiApp;
	private Map<String, HashMap<Integer, TiListener>> eventListeners;
	private AtomicInteger listenerIdGenerator;
	protected KrollContext krollContext;
	
	private ArrayList<WeakReference<OnEventListenerChange>> eventChangeListeners;
	private List<WeakReference<OnLifecycleEvent>> lifecycleListeners;
	private OnMenuEvent menuEventListener;
	private WeakReference<OnConfigurationChanged> weakConfigurationChangedListeners;

	public static interface OnLifecycleEvent
	{
		void onStart();
		void onResume();
		void onPause();
		void onStop();
		void onDestroy();
	}

	public static interface OnConfigurationChanged
	{
		public void configurationChanged(Configuration newConfig);
	}

	public static interface OnMenuEvent
	{
		public boolean hasMenu();
		public boolean prepareMenu(Menu menu);
		public boolean menuItemSelected(MenuItem item);
	}

	public static class TiListener
	{
		protected SoftReference<KrollProxy> weakProxy;
		protected Object listener;

		public TiListener(KrollProxy proxy, Object listener) {
			this.weakProxy = new SoftReference<KrollProxy>(proxy);
			this.listener = listener;
		}

		public boolean invoke(KrollInvocation invocation, String eventName, KrollDict data) {
			boolean invoked = false;
			KrollProxy p = weakProxy.get();
			if (p != null && listener != null) {
				p.fireSingleEvent(eventName, listener, data);
				invoked = true;
			} else {
				if (DBG) {
					Log.w(LCAT, "Unable to fire event with eventName '" + eventName + "' references were garbage collected.");
				}
			}

			return invoked;
		}

		public boolean isSameProxy(KrollProxy p) {
			KrollProxy localProxy = weakProxy.get();
			return (p != null && localProxy != null && localProxy.equals(p));
		}
	}

	public TiContext(Activity activity, String baseUrl)
	{
		this.mainThreadId = Looper.getMainLooper().getThread().getId();

		this.tiApp = (TiApplication) activity.getApplication();
		this.weakActivity = new WeakReference<Activity>(activity);
		this.listenerIdGenerator = new AtomicInteger(0);
		//this.eventListeners = new HashMap<String, HashMap<Integer,TiListener>>();
		this.eventListeners = Collections.synchronizedMap(new HashMap<String, HashMap<Integer,TiListener>>());
		eventChangeListeners = new ArrayList<WeakReference<OnEventListenerChange>>();
		//lifecycleListeners = new ArrayList<WeakReference<OnLifecycleEvent>>();
		lifecycleListeners = Collections.synchronizedList(new ArrayList<WeakReference<OnLifecycleEvent>>());
		if (baseUrl == null) {
			this.baseUrl = "app://";
		} else {
			this.baseUrl = baseUrl;
			if (!baseUrl.endsWith("/")) {
				this.baseUrl += "/";
			}
		}

		if (activity instanceof TiActivity) {
			((TiActivity)activity).addTiContext(this);
		}

		if (DBG) {
			Log.e(LCAT, "BaseURL for context is " + baseUrl);
		}
	}

	public boolean isUIThread() {
		return Thread.currentThread().getId() == mainThreadId;
	}

	public TiEvaluator getJSContext() {
		return tiEvaluator;
	}

	public void setJSContext(TiEvaluator evaluator) {
		if (DBG) {
			Log.i(LCAT, "Setting JS Context");
		}
		tiEvaluator = evaluator;
	}

	public Activity getActivity() {
		Activity activity = weakActivity.get();
		return activity;
	}

	public TiApplication getTiApp() {
		return tiApp;
	}

	public TiRootActivity getRootActivity() {
		return getTiApp().getRootActivity();
	}

	public TiFileHelper getTiFileHelper() {
		return new TiFileHelper(getTiApp());
	}

	public String absoluteUrl(String defaultScheme, String url)
	{
		try {
			URI uri = new URI(url);
			String scheme = uri.getScheme();
			if (scheme == null) {
				String path = uri.getPath();
				String fname = null;
				int lastIndex = path.lastIndexOf("/");
				if (lastIndex > 0) {
					fname = path.substring(lastIndex+1);
					path = path.substring(0, lastIndex);
				}

				if (path.startsWith("../") || path.equals("..")) {
					String[] right = path.split("/");
					String[] left = null;
					if (baseUrl.contains("://")) {
						String[] tmp = baseUrl.split("://");
						if (tmp.length > 1)
						{
							left = tmp[1].split("/");
						}
						else
						{
							left = new String[] {};
						}
					} else {
						left = baseUrl.split("/");
					}

					int rIndex = 0;
					int lIndex = left.length;

					while(rIndex < right.length && right[rIndex].equals("..")) {
						lIndex--;
						rIndex++;
					}
					String sep = "";
					StringBuilder sb = new StringBuilder();
					for (int i = 0; i < lIndex; i++) {
						sb.append(sep).append(left[i]);
						sep = "/";
					}
					for (int i = rIndex; i < right.length; i++) {
						sb.append(sep).append(right[i]);
						sep = "/";
					}
					String bUrl = sb.toString();
					if (!bUrl.endsWith("/")) {
						bUrl = bUrl + "/";
					}
					url = TiFileHelper2.joinSegments(defaultScheme + "//",bUrl, fname);
				}
			}
		} catch (URISyntaxException e) {
			Log.w(LCAT, "Error parsing url: " + e.getMessage(), e);
		}

		return url;
	}

	public String resolveUrl(String scheme, String path)
	{
		return resolveUrl(scheme, path, getBaseUrl());
	}

	public String resolveUrl(String scheme, String path, String relativeTo)
	{
		if (!TiFileFactory.isLocalScheme(path)) {
			return path;
		}

		String result = null;
		if (scheme == null) {
			scheme = "app:";
		}

		if (path.startsWith("../")) {
			path = absoluteUrl(scheme, path);
		}

		Uri uri = Uri.parse(path);
		if (uri.getScheme() == null) {
			if (!path.startsWith("/")) {
				result = relativeTo + path;
			} else {
				result = scheme + "/" + path;
			}
		} else {
			result = path;
		}

		if (!result.startsWith("file:")) {
			String[] p = { result };
			TiBaseFile tbf = TiFileFactory.createTitaniumFile(this, p, false);
			result = tbf.nativePath();
		}

		return result;
	}

	public String getBaseUrl() {
		return baseUrl;
	}
	
	public String getCurrentUrl() {
		return currentUrl;
	}

	// Javascript Support

	public Object evalFile(String filename, Messenger messenger, int messageId) throws IOException {
		Object result = null;
		
		this.currentUrl = filename;

		result = getJSContext().evalFile(filename);
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
		return result;
	}

	public Object evalFile(String filename) throws IOException {
		return evalFile(filename, null, -1);
	}

	public Object evalJS(String src) {
		TiEvaluator evaluator = getJSContext();
		if (evaluator == null)
		{
			Log.e(LCAT,"on evalJS, evaluator is null and shouldn't be");
		}
		return evaluator.evalJS(src);
	}

	@Override
	public Scriptable getScope() {
		return getJSContext().getScope();
	}
	
	// Event Management

	public void addOnEventChangeListener(OnEventListenerChange listener) {
		eventChangeListeners.add(new WeakReference<OnEventListenerChange>(listener));
	}

	public void removeOnEventChangeListener(OnEventListenerChange listener)
	{
		for (WeakReference<OnEventListenerChange> ref : eventChangeListeners) {
			OnEventListenerChange l = ref.get();
			if (l != null) {
				if (l.equals(listener)) {
					eventChangeListeners.remove(ref);
					break;
				}
			}
		}
	}

	protected void dispatchOnEventChange(boolean added, String eventName, int count, KrollProxy proxy)
	{
		for (WeakReference<OnEventListenerChange> ref : eventChangeListeners) {
			OnEventListenerChange l = ref.get();
			if (l != null) {
				try {
					if (added) {
						l.eventListenerAdded(eventName, count, proxy);
					} else {
						l.eventListenerRemoved(eventName, count, proxy);
					}
				} catch (Throwable t) {
					Log.e(LCAT, "Error invoking OnEventChangeListener: " + t.getMessage(), t);
				}
			}
		}
	}

	public int addEventListener(String eventName, KrollProxy proxy, Object listener)
	{
		int listenerId = -1;
		int listenerCount = 0;

		if (eventName != null) {
			if (proxy != null) {
				if (listener != null) {
					synchronized (eventListeners) {
						HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
						if (listeners == null) {
							listeners = new HashMap<Integer, TiListener>();
							eventListeners.put(eventName, listeners);
						}

						listenerId = listenerIdGenerator.incrementAndGet();
						listeners.put(listenerId, new TiListener(proxy, listener));
						if (DBG) {
							Log.d(LCAT, "Added for eventName '" + eventName + "' with id " + listenerId);
						}

						listenerCount = listeners.size();
					}
					dispatchOnEventChange(true, eventName, listenerCount, proxy);
				} else {
					throw new IllegalStateException("addEventListener expects a non-null listener");
				}
			} else {
				throw new IllegalStateException("addEventListener expects a non-null KrollProxy");
			}
		} else {
			throw new IllegalStateException("addEventListener expects a non-null eventName");
		}

		return listenerId;
	}

	public void removeEventListener(String eventName, int listenerId)
	{
		if (eventName != null) {
			HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				TiListener listener = listeners.get(listenerId);
				if (listeners.remove(listenerId) == null) {
					if (DBG) {
						Log.w(LCAT, "listenerId " + listenerId + " not for eventName '" + eventName + "'");
					}
				} else {
					dispatchOnEventChange(false, eventName, listeners.size(), listener.weakProxy.get());
					if (DBG) {
						Log.i(LCAT, "listener with id " + listenerId + " with eventName '" + eventName + "' was removed.");
					}
				}
			}
		} else {
			throw new IllegalStateException("removeEventListener expects a non-null eventName");
		}
	}

	public void removeEventListener(String eventName, Object listener)
	{
		if (listener instanceof Number) {
			removeEventListener(eventName, ((Number)listener).intValue());
			return;
		}

		boolean removed = false;
		int newCount = 0;
		SoftReference<KrollProxy> proxyOfListener = null;
		
		if (eventName != null) {
			synchronized(eventListeners) {
				HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
				if (listeners != null) {
					for (Entry<Integer, TiListener> entry : listeners.entrySet())
					{
						Object l = entry.getValue().listener;
						if (l.equals(listener))
						{
							listeners.remove(entry.getKey());
							removed = true;
							newCount = listeners.size();
							proxyOfListener = entry.getValue().weakProxy;
							break;
						}
					}
					if (!removed) {
						Log.w(LCAT, "listener not found for eventName '" + eventName + "'");
					}
				}
			}
			if (removed) {
				dispatchOnEventChange(false, eventName, newCount, proxyOfListener.get());
			}
		} else {
			throw new IllegalStateException("removeEventListener expects a non-null eventName");
		}
	}
	
	public void removeEventListenersFromContext(TiContext listeningContext)
	{
		if (eventListeners == null) {
			return;
		}
		synchronized(eventListeners) {
			for (String eventName : eventListeners.keySet()) {
				HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
				if (listeners != null) {
					ArrayList<Integer> toDelete = null;
					for (Entry<Integer, TiListener>entry :  listeners.entrySet()) {
						TiListener l = entry.getValue();
						if (l.listener instanceof KrollCallback) {
							KrollCallback kc = (KrollCallback) l.listener;
							if (kc != null && kc.isWithinTiContext(listeningContext)) {
								if (toDelete == null) {
									toDelete = new ArrayList<Integer>();
								}
								toDelete.add(entry.getKey());
							}
						}
					}
					if (toDelete != null) {
						for (Integer id  : toDelete) {
							removeEventListener(eventName, id.intValue());
						}
					}
				}
				
			}
		}
	}

	public boolean hasAnyEventListener(String eventName)
	{
		boolean result = false;

		if (eventName != null) {
			HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				result = !listeners.isEmpty();
			}
		} else {
			throw new IllegalStateException("removeEventListener expects a non-null eventName");
		}

		return result;
	}

	public boolean hasEventListener(String eventName, KrollProxy proxy)
	{
		boolean result = false;

		if (eventName != null) {
			if (proxy != null) {
				synchronized(eventListeners) {
					HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
					if (listeners != null && !listeners.isEmpty()) {
						for (TiListener listener : listeners.values()) {
							if (listener.isSameProxy(proxy)) {
								result = true;
								break;
							}
						}
					}
				}
			} else {
				throw new IllegalStateException("addEventListener expects a non-null KrollProxy");
			}
		} else {
			throw new IllegalStateException("addEventListener expects a non-null eventName");
		}

		return result;
	}

	public boolean dispatchEvent(String eventName, KrollDict data, KrollProxy proxy)
	{
		KrollInvocation inv = KrollInvocation.createMethodInvocation(
			this, getJSContext().getScope(), new KrollObject(proxy), "event:"+eventName, null, proxy);
		return dispatchEvent(inv, eventName, data, proxy);
	}

	public boolean dispatchEvent(KrollInvocation invocation, String eventName, KrollDict data)
	{
		return dispatchEvent(invocation, eventName, data, null);
	}
	
	public boolean dispatchEvent(KrollInvocation invocation, String eventName, KrollDict data, KrollProxy proxy)
	{
		boolean dispatched = false;
		if (eventName != null) {
			Map<Integer, TiListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				if (data == null) {
					data = new KrollDict();
				}
				data.put("type", eventName);

				Set<Entry<Integer, TiListener>> listenerSet = listeners.entrySet();
				synchronized(eventListeners) {
					for(Entry<Integer, TiListener> entry : listenerSet) {
						TiListener listener = entry.getValue();
						if (proxy == null || (proxy != null && listener.isSameProxy(proxy))) {
							boolean invoked = false;
							try {
								if (listener.weakProxy.get() != null) {
									if (!data.containsKey("source")) {
										data.put("source", listener.weakProxy.get());
									}
									invoked = listener.invoke(invocation, eventName, data);
								}
							} catch (Exception e) {
								Log.e(LCAT, "Error invoking listener with id " + entry.getKey() + " on eventName '" + eventName + "'", e);
							}
							dispatched = dispatched || invoked;
						}
					}
				}
			} else {
				if(TRACE) {
					Log.w(LCAT, "No listeners for eventName: " + eventName);
				}
			}
		} else {
			throw new IllegalStateException("dispatchEvent expects a non-null eventName");
		}
		return dispatched;
	}

	public void addOnLifecycleEventListener(OnLifecycleEvent listener) {
		lifecycleListeners.add(new WeakReference<OnLifecycleEvent>(listener));
	}

	public void removeOnLifecycleEventListener(OnLifecycleEvent listener)
	{
		synchronized(lifecycleListeners) {
			for (WeakReference<OnLifecycleEvent> ref : lifecycleListeners) {
				OnLifecycleEvent l = ref.get();
				if (l != null) {
					if (l.equals(listener)) {
						eventChangeListeners.remove(ref);
						break;
					}
				}
			}
		}
	}

	public void setOnMenuEventListener(OnMenuEvent listener) {
		if (listener != null) {
			menuEventListener = listener;
			TiActivitySupport tis = (TiActivitySupport) getActivity();
			if (tis != null) {
				tis.setMenuDispatchListener(this);
			}
		} else {
			menuEventListener = null;
			TiActivitySupport tis = (TiActivitySupport) getActivity();
			if (tis != null) {
				tis.setMenuDispatchListener(null);
			}
		}
	}

	public boolean dispatchHasMenu()
	{
		if (menuEventListener != null) {
			return menuEventListener.hasMenu();
		}

		return false;
	}

	public boolean dispatchPrepareMenu(Menu menu)
	{
		if (menuEventListener != null) {
			return menuEventListener.prepareMenu(menu);
		}

		return false;
	}

	public boolean dispatchMenuItemSelected(MenuItem item)
	{
		if (menuEventListener != null) {
			return menuEventListener.menuItemSelected(item);
		}

		return false;
	}

	public void setOnConfigurationChangedListener(OnConfigurationChanged listener) {
		if (listener == null) {
			weakConfigurationChangedListeners = null;
		} else {
			weakConfigurationChangedListeners = new WeakReference<OnConfigurationChanged>(listener);
		}
	}
	public void dispatchOnConfigurationChanged(Configuration newConfig)
	{
		if (weakConfigurationChangedListeners != null) {
			OnConfigurationChanged listener = weakConfigurationChangedListeners.get();
			if (listener != null) {
				listener.configurationChanged(newConfig);
			}
		}
	}

	public void dispatchOnStart()
	{
		synchronized(lifecycleListeners) {
			for(WeakReference<OnLifecycleEvent> ref : lifecycleListeners) {
				OnLifecycleEvent listener = ref.get();
				if (listener != null) {
					try {
						listener.onStart();
					} catch (Throwable t) {
						Log.e(LCAT, "Error dispatching onStart  event: " + t.getMessage(), t);
					}
				} else {
					Log.w(LCAT, "lifecycleListener has been garbage collected");
				}
			}
		}
	}

	public void dispatchOnResume() {
		synchronized(lifecycleListeners) {
			for(WeakReference<OnLifecycleEvent> ref : lifecycleListeners) {
				OnLifecycleEvent listener = ref.get();
				if (listener != null) {
					try {
						listener.onResume();
					} catch (Throwable t) {
						Log.e(LCAT, "Error dispatching onResume  event: " + t.getMessage(), t);
					}
				} else {
					Log.w(LCAT, "lifecycleListener has been garbage collected");
				}
			}
		}
	}

	public void dispatchOnPause() {
		synchronized (lifecycleListeners) {
			for(WeakReference<OnLifecycleEvent> ref : lifecycleListeners) {
				OnLifecycleEvent listener = ref.get();
				if (listener != null) {
					try {
						listener.onPause();
					} catch (Throwable t) {
						Log.e(LCAT, "Error dispatching onPause  event: " + t.getMessage(), t);
					}
				} else {
					Log.w(LCAT, "lifecycleListener has been garbage collected");
				}
			}
		}
	}

	public void dispatchOnStop() {
		synchronized(lifecycleListeners) {
			for(WeakReference<OnLifecycleEvent> ref : lifecycleListeners) {
				OnLifecycleEvent listener = ref.get();
				if (listener != null) {
					try {
						listener.onStop();
					} catch (Throwable t) {
						Log.e(LCAT, "Error dispatching onStop  event: " + t.getMessage(), t);
					}
				} else {
					Log.w(LCAT, "lifecycleListener has been garbage collected");
				}
			}
		}
	}

	public void dispatchOnDestroy() {
		synchronized(lifecycleListeners) {
			for(WeakReference<OnLifecycleEvent> ref : lifecycleListeners) {
				OnLifecycleEvent listener = ref.get();
				if (listener != null) {
					try {
						listener.onDestroy();
					} catch (Throwable t) {
						Log.e(LCAT, "Error dispatching onDestroy  event: " + t.getMessage(), t);
					}
				} else {
					Log.w(LCAT, "lifecycleListener has been garbage collected");
				}
			}
		}
	}


	@Override
	public void error(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		doRhinoDialog("Error", message, sourceName, line, lineSource, lineOffset);
	}

	@Override
	public EvaluatorException runtimeError(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		doRhinoDialog("Runtime Error", message, sourceName, line, lineSource, lineOffset);
		return null;
	}

	@Override
	public void warning(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		doRhinoDialog("Warning", message, sourceName, line, lineSource, lineOffset);
	}

	public static TiContext createTiContext(Activity activity, String baseUrl)
	{
		TiContext tic = new TiContext(activity, baseUrl);
		KrollContext kroll = KrollContext.createContext(tic);
		tic.setKrollContext(kroll);
		KrollBridge krollBridge = new KrollBridge(kroll);
		tic.setJSContext(krollBridge);
		return tic;
	}

	private void doRhinoDialog(final String title, final String message, final String sourceName, final int line,
			final String lineSource, final int lineOffset)
	{
		final Semaphore s = new Semaphore(0);
		final Activity activity = getActivity();

		activity.runOnUiThread(new Runnable(){

			@Override
			public void run()
			{
				OnClickListener listener = new OnClickListener() {

					public void onClick(DialogInterface dialog, int which) {
						Process.killProcess(Process.myPid());
					}
				};

				FrameLayout layout = new FrameLayout(activity);
				layout.setBackgroundColor(Color.rgb(128, 0, 0));

				LinearLayout vlayout = new LinearLayout(activity);
				vlayout.setOrientation(LinearLayout.VERTICAL);
				vlayout.setPadding(10, 10, 10, 10);

				layout.addView(vlayout);

				TextView sourceInfoView = new TextView(activity);
				sourceInfoView.setBackgroundColor(Color.WHITE);
				sourceInfoView.setTextColor(Color.BLACK);
				sourceInfoView.setPadding(4, 5, 4, 0);
				sourceInfoView.setText("[" + line + "," + lineOffset + "] " + sourceName);

				TextView messageView = new TextView(activity);
				messageView.setBackgroundColor(Color.WHITE);
				messageView.setTextColor(Color.BLACK);
				messageView.setPadding(4, 5, 4, 0);
				messageView.setText(message);

				TextView sourceView = new TextView(activity);
				sourceView.setBackgroundColor(Color.WHITE);
				sourceView.setTextColor(Color.BLACK);
				sourceView.setPadding(4, 5, 4, 0);
				sourceView.setText(lineSource);

				TextView infoLabel = new TextView(activity);
				infoLabel.setText("Location: ");
				infoLabel.setTextColor(Color.WHITE);
				infoLabel.setTextScaleX(1.5f);

				TextView messageLabel = new TextView(activity);
				messageLabel.setText("Message: ");
				messageLabel.setTextColor(Color.WHITE);
				messageLabel.setTextScaleX(1.5f);

				TextView sourceLabel = new TextView(activity);
				sourceLabel.setText("Source: ");
				sourceLabel.setTextColor(Color.WHITE);
				sourceLabel.setTextScaleX(1.5f);

				vlayout.addView(infoLabel);
				vlayout.addView(sourceInfoView);
				vlayout.addView(messageLabel);
				vlayout.addView(messageView);
				vlayout.addView(sourceLabel);
				vlayout.addView(sourceView);

		        new AlertDialog.Builder(activity)
		        .setTitle(title)
		        .setView(layout)
		        .setPositiveButton("Kill",listener)
		        .setNeutralButton("Continue", new OnClickListener(){
					@Override
					public void onClick(DialogInterface arg0, int arg1) {
						s.release();
					}})
		        .setCancelable(false)
		        .create()
		        .show();

			}
		});

        try {
        	s.acquire();
        } catch (InterruptedException e) {
        	// Ignore
        }
	}
	
	public KrollContext getKrollContext() {
		return krollContext;
	}
	
	public void setKrollContext(KrollContext krollContext) {
		this.krollContext = krollContext;
	}
	
	public static TiContext getCurrentTiContext() {
		KrollContext currentCtx = KrollContext.getCurrentKrollContext();
		if (currentCtx == null) {
			return null;
		}
		return currentCtx.getTiContext();
	}
	
	public void release()
	{
		getTiApp().removeEventListenersFromContext(this);

		if (tiEvaluator != null && tiEvaluator instanceof KrollBridge)
		{
			((KrollBridge)tiEvaluator).release();
			tiEvaluator = null;
		}
		
		if (lifecycleListeners != null) {
			lifecycleListeners.clear();
		}
		if (eventChangeListeners != null) {
			eventChangeListeners.clear();
		}
		if (eventListeners != null) {
			eventListeners.clear();
		}
		menuEventListener = null;
		
	}
}
