/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.bridge.OnEventListenerChange;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

public class KrollEventManager {
	private static final String TAG = "KrollEventManager";
	private static final boolean DBG = TiConfig.LOGD;
	private static final boolean TRACE = TiConfig.LOGV;
	
	protected KrollProxy proxy;
	protected ArrayList<WeakReference<OnEventListenerChange>> eventChangeListeners;
	protected Map<String, HashMap<Integer, KrollListener>> eventListeners;
	protected AtomicInteger listenerIdGenerator;
	
	public KrollEventManager(KrollProxy proxy) {
		this.proxy = proxy;

		this.eventChangeListeners = new ArrayList<WeakReference<OnEventListenerChange>>();
		this.listenerIdGenerator = new AtomicInteger(0);
		this.eventListeners = Collections.synchronizedMap(new HashMap<String, HashMap<Integer, KrollListener>>());
	}
	
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
					Log.e(TAG, "Error invoking OnEventChangeListener: " + t.getMessage(), t);
				}
			}
		}
	}

	public int addEventListener(String eventName, Object listener)
	{
		int listenerId = -1;
		int listenerCount = 0;

		if (eventName != null) {
			if (proxy != null) {
				if (listener != null) {
					synchronized (eventListeners) {
						HashMap<Integer, KrollListener> listeners = eventListeners.get(eventName);
						if (listeners == null) {
							listeners = new HashMap<Integer, KrollListener>();
							eventListeners.put(eventName, listeners);
						}

						listenerId = listenerIdGenerator.incrementAndGet();
						listeners.put(listenerId, new KrollListener(proxy, listener));
						if (DBG) {
							Log.d(TAG, "Added for eventName '" + eventName + "' with id " + listenerId);
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

	public static class KrollListener
	{
		protected SoftReference<KrollProxy> weakProxy;
		protected Object listener;
		protected static final String TAG = "KrollListener";

		public KrollListener(KrollProxy proxy, Object listener) {
			this.weakProxy = new SoftReference<KrollProxy>(proxy);
			this.listener = listener;
		}

		public boolean invoke(String eventName, KrollDict data) {
			boolean invoked = false;
			KrollProxy p = weakProxy.get();
			if (p != null && listener != null) {
				p.fireSingleEvent(eventName, listener, data);
				invoked = true;
			} else {
				if (DBG) {
					Log.w(TAG, "Unable to fire event with eventName '" + eventName + "' references were garbage collected.");
				}
			}

			return invoked;
		}

		public boolean isSameProxy(KrollProxy p) {
			KrollProxy localProxy = weakProxy.get();
			return (p != null && localProxy != null && localProxy.equals(p));
		}
	}

	public void removeEventListener(String eventName, int listenerId)
	{
		if (eventName != null) {
			HashMap<Integer, KrollListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				KrollListener listener = listeners.get(listenerId);
				if (listeners.remove(listenerId) == null) {
					if (DBG) {
						Log.w(TAG, "listenerId " + listenerId + " not for eventName '" + eventName + "'");
					}
				} else {
					dispatchOnEventChange(false, eventName, listeners.size(), listener.weakProxy.get());
					if (DBG) {
						Log.i(TAG, "listener with id " + listenerId + " with eventName '" + eventName + "' was removed.");
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
				HashMap<Integer, KrollListener> listeners = eventListeners.get(eventName);
				if (listeners != null) {
					for (Entry<Integer, KrollListener> entry : listeners.entrySet())
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
						Log.w(TAG, "listener not found for eventName '" + eventName + "'");
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

	public boolean hasAnyEventListener(String eventName)
	{
		boolean result = false;

		if (eventName != null) {
			HashMap<Integer, KrollListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				result = !listeners.isEmpty();
			}
		} else {
			throw new IllegalStateException("removeEventListener expects a non-null eventName");
		}

		return result;
	}
	
	public boolean dispatchEvent(String eventName, KrollDict data)
	{
		boolean dispatched = false;
		if (eventName != null) {
			Map<Integer, KrollListener> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				if (data == null) {
					data = new KrollDict();
				}
				if (!data.containsKey("type")) {
					data.put("type", eventName);
				}

				Set<Entry<Integer, KrollListener>> listenerSet = listeners.entrySet();
				synchronized(eventListeners) {
					for(Entry<Integer, KrollListener> entry : listenerSet) {
						KrollListener listener = entry.getValue();
						if (proxy == null || (proxy != null && listener.isSameProxy(proxy))) {
							boolean invoked = false;
							try {
								if (listener.weakProxy.get() != null) {
									if (!data.containsKey("source")) {
										data.put("source", listener.weakProxy.get());
									}
									invoked = listener.invoke(eventName, data);
								}
							} catch (Exception e) {
								Log.e(TAG, "Error invoking listener with id " + entry.getKey() + " on eventName '" + eventName + "'", e);
							}
							dispatched = dispatched || invoked;
						}
					}
				}
			} else {
				if(TRACE) {
					Log.w(TAG, "No listeners for eventName: " + eventName);
				}
			}
		} else {
			throw new IllegalStateException("dispatchEvent expects a non-null eventName");
		}
		return dispatched;
	}
	
	public void release() {
		if (eventChangeListeners != null) {
			eventChangeListeners.clear();
		}
		if (eventListeners != null) {
			eventListeners.clear();
		}
	}
}
