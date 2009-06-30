/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.lang.ref.SoftReference;
import java.util.HashMap;
import java.util.TreeSet;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.module.TitaniumBaseModule;

import android.os.Handler;
import android.util.Log;
import android.webkit.WebView;


public class TitaniumJSEventManager
{
	private static final String LCAT = "TiJSEvntMgr";

	protected SoftReference<WebView> softWebView;
	protected SoftReference<Handler> softHandler;
	protected AtomicInteger idGenerator;
	protected HashMap<String, HashMap<Integer, TitaniumJSEvent>> eventListeners;
	protected TreeSet<String> supportedEventNames;

	public TitaniumJSEventManager(TitaniumModuleManager manager) {
		this(manager.getHandler(), manager.getActivity().getWebView());
	}
	public TitaniumJSEventManager(TitaniumBaseModule module) {
		this(module.getHandler(), module.getWebView());
	}

	public TitaniumJSEventManager(Handler handler, WebView webView)
	{
		if (handler == null) {
			throw new IllegalArgumentException("Handler must not be null");
		}
		if (webView == null) {
			throw new IllegalArgumentException("WebView must not be null");
		}
		this.softHandler = new SoftReference<Handler>(handler);
		this.softWebView = new SoftReference<WebView>(webView);
		idGenerator = new AtomicInteger();
		this.eventListeners = new HashMap<String, HashMap<Integer, TitaniumJSEvent>>();
		this.supportedEventNames = new TreeSet<String>();
	}

	public void clear() {
		softWebView = null;
		for (HashMap<Integer, TitaniumJSEvent> l : eventListeners.values()) {
			l.clear();
		}
		eventListeners.clear();
		eventListeners = null;

		supportedEventNames.clear();
		supportedEventNames = null;
	}

	public void supportEvent(String eventName)
	{
		synchronized(supportedEventNames) {
			if (!supportedEventNames.contains(eventName)) {
				supportedEventNames.add(eventName);
				HashMap<Integer, TitaniumJSEvent> listeners = eventListeners.get(eventName);
				if (listeners == null) {
					listeners = new HashMap<Integer, TitaniumJSEvent>();
					eventListeners.put(eventName, listeners);
				}
			}
		}
	}

	public boolean supportsEvent(String eventName) {
		synchronized(supportedEventNames) {
			return supportedEventNames.contains(eventName);
		}
	}

	protected void checkSupportsEvent(String eventName) {
		if (supportedEventNames != null) {
			synchronized(supportedEventNames) {

				if (!supportedEventNames.contains(eventName)) {
					throw new IllegalArgumentException("This event handler does not support events named '" + eventName
							+ "'. Use supportEvent method to register valid event names."
						);
				}
			}
		} else {
			Log.w(LCAT, "supportedEventNames has been cleared");
		}
	}

	public int addListener(String eventName, String successListener, String errorListener) {
		int eventId = -1;
		if (eventListeners != null) {
			checkSupportsEvent(eventName); // Throws exception of failure

			HashMap<Integer, TitaniumJSEvent> listeners = eventListeners.get(eventName);
			eventId = idGenerator.incrementAndGet();

			synchronized(listeners) {
				TitaniumJSEvent event = new TitaniumJSEvent(new Integer(eventId), successListener, errorListener);
				listeners.put(eventId, event);
			}
		} else {
			Log.w(LCAT, "eventListeners is null, not adding event: " + eventName);
		}
		return eventId;
	}

	public int addListener(String eventName, String successListener) {
		return addListener(eventName, successListener, null);
	}

	public void removeListener(String eventName, int eventId)
	{
		if (eventId > -1 && eventListeners != null) {
			checkSupportsEvent(eventName); // Throws exception of failure

			HashMap<Integer, TitaniumJSEvent> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				synchronized(listeners) {
					TitaniumJSEvent event = listeners.get(eventId);
					if (event != null) {
						listeners.remove(eventId);
					} else {
						Log.w(LCAT, "Attempt to remove non-existant listener on event queue " + eventName + " with id " + eventId);
					}
				}
			}
		} else {
			Log.w(LCAT, "Invalid listener id: " + eventId + " or eventListeners is null" + (eventListeners == null));
		}
	}

	public boolean hasListeners(String eventName)
	{
		boolean result = false;
		if (eventListeners != null) {
			checkSupportsEvent(eventName); // Throws exception of failure

			HashMap<Integer, TitaniumJSEvent> listeners = eventListeners.get(eventName);
			if (listeners != null) {
				synchronized(listeners) {
					result = listeners.size() > 0;
				}
			}
		} else {
			Log.w(LCAT,"eventListeners is null");
		}
		return result;
	}

	//TODO consider collecting  list of listeners to invoke and pass that
	//     to the helper as a performance boost.

	public void invokeSuccessListeners(String eventName, String data) {
		if (eventListeners != null) {
			checkSupportsEvent(eventName); // Throws exception on failure

			final WebView webView = softWebView.get();
			if (webView != null) {
				final HashMap<Integer, TitaniumJSEvent> listeners = eventListeners.get(eventName);

				if (listeners != null) {
					synchronized(listeners) {
						final Handler handler = softHandler.get();
						if (handler == null) {
							throw new IllegalStateException("Handler is null");
						}
						for (TitaniumJSEvent event : listeners.values()) {
							String listener = event.getSuccessListener();
							if (listener != null) {
								TitaniumJavascriptHelper.evalJS(webView, handler, listener, data);
							}
						}
					}
				}
			}
		} else {
			Log.w(LCAT, "eventListeners is null, not invoke success event for eventName: " + eventName);
		}
	}

	public void invokeErrorListeners(String eventName, String data) {
		if (eventListeners != null) {
			checkSupportsEvent(eventName); // Throws exception on failure

			final WebView webView = softWebView.get();
			if (webView != null) {
				final HashMap<Integer, TitaniumJSEvent> listeners = eventListeners.get(eventName);

				if (listeners != null) {
					synchronized(listeners) {
						final Handler handler = softHandler.get();
						if (handler == null) {
							throw new IllegalStateException("Handler is null");
						}
						for (TitaniumJSEvent event : listeners.values()) {
							String listener = event.getErrorListener();
							if (listener != null) {
								TitaniumJavascriptHelper.evalJS(webView, handler, listener, data);
							}
						}
					}
				}
			}
		} else {
			Log.w(LCAT, "eventListeners is null, not invoke success event for eventName: " + eventName);
		}
	}

}
