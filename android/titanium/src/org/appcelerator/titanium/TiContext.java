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
import java.util.HashMap;
import java.util.Set;
import java.util.Map.Entry;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiFileHelper2;

import android.app.Activity;
import android.net.Uri;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;

public class TiContext implements TiEvaluator
{
	private static final String LCAT = "TiContext";
	private static final boolean DBG = TiConfig.LOGD;

	private long mainThreadId;

	private String baseUrl;

	private WeakReference<Activity> weakActivity;
	private SoftReference<TiEvaluator>	softTiEvaluator;
	private HashMap<String, HashMap<Integer, TiListener>> eventListeners;
	private AtomicInteger listenerIdGenerator;

	private ArrayList<WeakReference<OnEventListenerChange>> eventChangeListeners;
	private ArrayList<WeakReference<OnLifecycleEvent>> lifecycleListeners;

	public static interface OnLifecycleEvent
	{
		void onStart();
		void onResume();
		void onPause();
		void onStop();
		void onDestroy();
	}

	public static class TiListener
	{
		protected SoftReference<TiProxy> weakTiProxy;
		protected Object listener;

		public TiListener(TiProxy tiProxy, Object listener) {
			this.weakTiProxy = new SoftReference<TiProxy>(tiProxy);
			this.listener = listener;
		}

		public boolean invoke(String eventName, TiDict data) {
			boolean invoked = false;
			TiProxy p = weakTiProxy.get();
			if (p != null && listener != null) {
				p.fireSingleEvent(eventName, listener, data);
				invoked = true;
			} else {
				Log.w(LCAT, "Unable to fire event with eventName '" + eventName + "' references were garbage collected.");
			}

			return invoked;
		}

		public boolean isSameProxy(TiProxy p) {
			TiProxy localProxy = weakTiProxy.get();
			return (p != null && localProxy != null && localProxy.equals(p));
		}
	}

	public TiContext(Activity activity, String baseUrl)
	{
		this.mainThreadId = Looper.getMainLooper().getThread().getId();

		this.weakActivity = new WeakReference<Activity>(activity);
		this.listenerIdGenerator = new AtomicInteger(0);
		this.eventListeners = new HashMap<String, HashMap<Integer,TiListener>>();
		eventChangeListeners = new ArrayList<WeakReference<OnEventListenerChange>>();
		lifecycleListeners = new ArrayList<WeakReference<OnLifecycleEvent>>();
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

	private TiEvaluator getJSContext() {
		return softTiEvaluator.get();
	}

	public void setJSContext(TiEvaluator evaluator) {
		this.softTiEvaluator = new SoftReference<TiEvaluator>(evaluator);
	}

	public Activity getActivity() {
		Activity activity = weakActivity.get();
		return activity;
	}

	public TiApplication getTiApp() {
		return (TiApplication) getActivity().getApplication();
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
						left = tmp[1].split("/");
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
				result = baseUrl + path;
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

	// Javascript Support

	public Object evalFile(String filename, Messenger messenger, int messageId) throws IOException {
		Object result = null;

		result = getJSContext().evalFile(filename);
		if (messenger != null) {
			try {
				Message msg = Message.obtain();
				msg.what = messageId;
				messenger.send(msg);
				Log.e(LCAT, "Notifying caller that evalFile has completed");
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
		return getJSContext().evalJS(src);
	}

	public void fireEvent() {
		// TODO Auto-generated method stub
	}

	public void bindToToplevel(String topLevelName, String[] objectName) {
		getJSContext().bindToToplevel(topLevelName, objectName);
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

	protected void dispatchOnEventChange(boolean added, String eventName, int count, TiProxy tiProxy)
	{
		for (WeakReference<OnEventListenerChange> ref : eventChangeListeners) {
			OnEventListenerChange l = ref.get();
			if (l != null) {
				try {
					if (added) {
						l.eventListenerAdded(eventName, count, tiProxy);
					} else {
						l.eventListenerRemoved(eventName, count, tiProxy);
					}
				} catch (Throwable t) {
					Log.e(LCAT, "Error invoking OnEventChangeListener: " + t.getMessage(), t);
				}
			}
		}
	}

	public int addEventListener(String eventName, TiProxy tiProxy, Object listener)
	{
		int listenerId = -1;

		if (eventName != null) {
			if (tiProxy != null) {
				if (listener != null) {
					HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
					if (listeners == null) {
						listeners = new HashMap<Integer, TiListener>();
						eventListeners.put(eventName, listeners);
					}

					listenerId = listenerIdGenerator.incrementAndGet();
					listeners.put(listenerId, new TiListener(tiProxy, listener));
					Log.i(LCAT, "Added for eventName '" + eventName + "' with id " + listenerId);
					dispatchOnEventChange(true, eventName, listeners.size(), tiProxy);
				} else {
					throw new IllegalStateException("addEventListener expects a non-null listener");
				}
			} else {
				throw new IllegalStateException("addEventListener expects a non-null tiProxy");
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
					Log.w(LCAT, "listenerId " + listenerId + " not for eventName '" + eventName + "'");
				} else {
					dispatchOnEventChange(false, eventName, listeners.size(), listener.weakTiProxy.get());
					Log.i(LCAT, "listener with id " + listenerId + " with eventName '" + eventName + "' was removed.");
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

		if (eventName != null) {
			HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				boolean removed = false;
				for (Entry<Integer, TiListener> entry : listeners.entrySet())
				{
					Object l = entry.getValue().listener;
					if (l.equals(listener))
					{
						listeners.remove(entry.getKey());
						dispatchOnEventChange(false, eventName, listeners.size(), entry.getValue().weakTiProxy.get());
						removed = true;
						break;
					}
				}
				if (!removed) {
					Log.w(LCAT, "listener not found for eventName '" + eventName + "'");
				}
			}
		} else {
			throw new IllegalStateException("removeEventListener expects a non-null eventName");
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

	public boolean hasEventListener(String eventName, TiProxy tiProxy)
	{
		boolean result = false;

		if (eventName != null) {
			if (tiProxy != null) {
				HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
				if (listeners != null && !listeners.isEmpty()) {
					for (TiListener listener : listeners.values()) {
						if (listener.isSameProxy(tiProxy)) {
							result = true;
							break;
						}
					}
				}
			} else {
				throw new IllegalStateException("addEventListener expects a non-null tiProxy");
			}
		} else {
			throw new IllegalStateException("addEventListener expects a non-null eventName");
		}

		return result;
	}


	public void dispatchEvent(String eventName, TiDict data)
	{
		if (eventName != null) {
			HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				if (data == null) {
					data = new TiDict();
				}

				Set<Entry<Integer, TiListener>> listenerSet = listeners.entrySet();
				for(Entry<Integer, TiListener> entry : listenerSet) {
					boolean keep = false;
					try {
						keep = entry.getValue().invoke(eventName, data);
					} catch (Exception e) {
						Log.e(LCAT, "Error invoking listener with id " + entry.getKey() + " on eventName '" + eventName + "'", e);
					}

					if (!keep) {
						listeners.remove(entry.getKey());
						Log.i(LCAT, "Listener with id " + entry.getKey() + " removed due to invocation failure.");
					}
				}
				listenerSet.clear();
				listenerSet = null;
			}
		} else {
			throw new IllegalStateException("removeEventListener expects a non-null eventName");
		}
	}

	public void dispatchEvent(TiProxy tiProxy, String eventName, TiDict data)
	{
		if (tiProxy != null) {
			if (eventName != null) {
				HashMap<Integer, TiListener> listeners = eventListeners.get(eventName);
				if (listeners != null) {
					if (data == null) {
						data = new TiDict();
					}

					Set<Entry<Integer, TiListener>> listenerSet = listeners.entrySet();
					for(Entry<Integer, TiListener> entry : listenerSet) {
						TiListener listener = entry.getValue();
						if (listener.isSameProxy(tiProxy)) {
							boolean keep = false;
							try {
								keep = listener.invoke(eventName, data);
							} catch (Exception e) {
								Log.e(LCAT, "Error invoking listener with id " + entry.getKey() + " on eventName '" + eventName + "'", e);
							}

							if (!keep) {
								listeners.remove(entry.getKey());
								Log.i(LCAT, "Listener with id " + entry.getKey() + " removed due to invocation failure.");
							}
						}
					}
				} else {
					Log.w(LCAT, "No listeners for eventName: " + eventName);
				}
			} else {
				throw new IllegalStateException("dispatchEvent expects a non-null eventName");
			}
		} else {
			throw new IllegalStateException("dispatchEvent requires a non-null tiProxy");
		}
	}

	public void addOnLifecycleEventListener(OnLifecycleEvent listener) {
		lifecycleListeners.add(new WeakReference<OnLifecycleEvent>(listener));
	}

	public void removeOnLifecycleEventListener(OnLifecycleEvent listener)
	{
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

	public void dispatchOnStart()
	{
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

	public void dispatchOnResume() {
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

	public void dispatchOnPause() {
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

	public void dispatchOnStop() {
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

	public void dispatchOnDestroy() {
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

	public static TiContext createTiContext(Activity activity, TiDict preload, String baseUrl)
	{
		TiContext tic = new TiContext(activity, baseUrl);
		KrollContext kroll = KrollContext.createContext(tic);
		KrollBridge krollBridge = new KrollBridge(kroll, preload);
		tic.setJSContext(krollBridge);
		return tic;
	}
}
