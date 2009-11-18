/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumApp;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumNativeControl;
import org.appcelerator.titanium.api.ITitaniumNetwork;
import org.appcelerator.titanium.api.ITitaniumPlatform;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumAPI;
import org.appcelerator.titanium.module.TitaniumAccelerometer;
import org.appcelerator.titanium.module.TitaniumAnalytics;
import org.appcelerator.titanium.module.TitaniumApp;
import org.appcelerator.titanium.module.TitaniumDatabase;
import org.appcelerator.titanium.module.TitaniumFilesystem;
import org.appcelerator.titanium.module.TitaniumGeolocation;
import org.appcelerator.titanium.module.TitaniumGesture;
import org.appcelerator.titanium.module.TitaniumMedia;
import org.appcelerator.titanium.module.TitaniumNetwork;
import org.appcelerator.titanium.module.TitaniumPlatform;
import org.appcelerator.titanium.module.TitaniumUI;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEventFactory;
import org.appcelerator.titanium.module.contacts.TitaniumContacts;
import org.appcelerator.titanium.module.geo.TitaniumGeolocation2;
import org.appcelerator.titanium.module.map.TitaniumMap;
import org.appcelerator.titanium.module.ui.TitaniumMenuItem;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.appcelerator.titanium.util.TitaniumUrlHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.os.Message;
import android.view.View;
import android.webkit.MimeTypeMap;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.AbsoluteLayout;

@SuppressWarnings("deprecation")
public class TitaniumWebView extends WebView
	implements Handler.Callback, ITitaniumLifecycle
{
	private static final String LCAT = "TiWebView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String JAVASCRIPT = "javascript:";
	private static final String TITANIUM_CALLBACK = "Titanium.callbacks"; //Sent from ti.js

	public static final String EVENT_FOCUSED = "focused";
	public static final String EVENT_FOCUSED_JSON = "{type:'" + EVENT_FOCUSED + "'}";
	public static final String EVENT_UNFOCUSED = "unfocused";
	public static final String EVENT_UNFOCUSED_JSON = "{type:'" + EVENT_UNFOCUSED + "'}";

	public static final String EVENT_UI_TABCHANGED = "ui.tabchange";

	public static final int MSG_RUN_JAVASCRIPT = 300;
	public static final int MSG_LOAD_FROM_SOURCE = 301;
	public static final int MSG_ADD_CONTROL = 302;
	public static final int MSG_UPDATE_NATIVE_CONTROLS = 303;
	public static final int MSG_REQUEST_NATIVE_LAYOUT = 304;
	public static final int MSG_INVALIDATE_LAYOUT = 305;

	protected static final String MSG_EXTRA_URL = "url";
	protected static final String MSG_EXTRA_SOURCE = "source";

	private Handler handler;
	private Handler evalHandler;

	private TitaniumModuleManager tmm;
	private TitaniumUI tiUI;

	private MimeTypeMap mtm;

	private HashMap<String, WeakReference<ITitaniumNativeControl>> nativeControls;
	private AbsoluteLayout.LayoutParams offScreen;

	private HashMap<String, Semaphore> locks;
	private AtomicInteger uniqueLockId;

	private String url;
	private String source;
	private Semaphore sourceReady;
//	private boolean useAsView;
	private boolean hasBeenOpened;
	private TitaniumJSEventManager eventListeners;
//	private SoftReference<TitaniumUIWebView> softUIWebView;

	private String key;

	public interface OnConfigChange {
		public void configurationChanged(Configuration config);
	}

	public TitaniumWebView(TitaniumModuleManager tmm, boolean isWindow)
	{
		super(tmm.getActivity());
		this.tmm = tmm;

		this.hasBeenOpened = false;

		this.handler = new Handler(this);
		this.mtm = MimeTypeMap.getSingleton();
		this.locks = new HashMap<String,Semaphore>();
		this.uniqueLockId = new AtomicInteger();

//?
        setWebViewClient(new TiWebViewClient(tmm.getActivity()));
        setWebChromeClient(new TiWebChromeClient(tmm.getActivity(), isWindow)); //TODO: Fix

		WebSettings settings = getSettings();

		setVerticalScrollbarOverlay(true);

        settings.setJavaScriptEnabled(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportZoom(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setLightTouchEnabled(true);

        offScreen = new AbsoluteLayout.LayoutParams(1, 1, -100, -100);
        final TitaniumWebView me = this;

        setBackgroundColor(Color.TRANSPARENT);

        HandlerThread ht = new HandlerThread("TiJSEvalThread"){

			@Override
			protected void onLooperPrepared() {
				super.onLooperPrepared();
				evalHandler = new Handler(Looper.myLooper(), new Handler.Callback(){

					public boolean handleMessage(Message msg) {
						if(msg.what == MSG_RUN_JAVASCRIPT) {
							if (DBG) {
								Log.d(LCAT, "Invoking: " + msg.obj);
							}
							String id = msg.getData().getString("syncId");
							loadUrl((String) msg.obj);
							syncOn(id);
							if (DBG) {
								Log.w(LCAT, "AFTER: " + msg.obj);
							}

							return true;
						}
						return false;
					}});
				synchronized(me) {
					me.notify();
				}
			}

        };
        ht.start();
        // wait for eval hander to initialize
        synchronized(me) {
        	try {
        		me.wait();
        	} catch (InterruptedException e) {

        	}
        }

        sourceReady = new Semaphore(0);
	}

	public void setUrl(String url) {
        this.url = url;

        final String furl = url;
        final TitaniumModuleManager ftmm = tmm;
		Thread sourceLoadThread = new Thread(new Runnable(){

			public void run() {
				try {
					TitaniumApplication app = ftmm.getApplication();
					source = TitaniumUrlHelper.getSource(app, app.getApplicationContext(), furl, null);
					Log.i(LCAT, "Source loaded for " + furl);
				} catch (IOException e) {
					Log.e(LCAT, "Unable to load source for " + furl);
				} finally {
					sourceReady.release();
				}
			}});
        sourceLoadThread.start();
	}

	public void initializeModules()
	{
		this.eventListeners = new TitaniumJSEventManager(this);
		this.eventListeners.supportEvent(EVENT_FOCUSED);
		this.eventListeners.supportEvent(EVENT_UNFOCUSED);
		// UI/App level events
		this.eventListeners.supportEvent(EVENT_UI_TABCHANGED);

        // Add Modules
        this.tiUI = new TitaniumUI(tmm, "TitaniumUI");
        TitaniumAppInfo appInfo = tmm.getActivity().getAppInfo();

        new TitaniumMedia(tmm, "TitaniumMedia");
        String userAgent = appInfo.getSystemProperties().getString(TitaniumAppInfo.PROP_NETWORK_USER_AGENT, null); //if we get null, we have a startup error.
        ITitaniumNetwork tiNetwork = new TitaniumNetwork(tmm, "TitaniumNetwork", userAgent);
        ITitaniumPlatform tiPlatform = new TitaniumPlatform(tmm, "TitaniumPlatform");

		ITitaniumApp tiApp = new TitaniumApp(tmm, "TitaniumApp",appInfo);
 		new TitaniumAnalytics(tmm, "TitaniumAnalytics");
		new TitaniumAPI(tmm, "TitaniumAPI");
		new TitaniumFilesystem(tmm, "TitaniumFilesystem");
		new TitaniumDatabase(tmm, "TitaniumDatabase");
		new TitaniumAccelerometer(tmm, "TitaniumAccelerometer");
		new TitaniumGesture(tmm, "TitaniumGesture");
		new TitaniumGeolocation(tmm, "TitaniumGeolocation");

		new TitaniumContacts(tmm, "TitaniumContacts");
		new TitaniumMap(tmm, "TitaniumMap");
		new TitaniumGeolocation2(tmm, "TitaniumGeo2"); // forward/reverse geo

		// Add Modules from Applications
		TitaniumApplication app = tmm.getApplication();
		app.addModule(tmm);

		tmm.registerModules();

		//TODO: Move to Window?
		if (app.needsEnrollEvent()) {
			String deployType = appInfo.getSystemProperties().getString("ti.deploytype", "unknown");
			app.postAnalyticsEvent(TitaniumAnalyticsEventFactory.createAppEnrollEvent(tiPlatform, tiApp,deployType));
		}

		if (app.needsStartEvent()) {
			String deployType = appInfo.getSystemProperties().getString("ti.deploytype", "unknown");

			app.postAnalyticsEvent(TitaniumAnalyticsEventFactory.createAppStartEvent(tiNetwork, tiPlatform, tiApp, deployType));
		}
    }

    public void buildWebView()
    {
    	if (DBG) {
    		Log.d(LCAT, "buildWebView");
    	}

        if (url != null)
		{
        	try {
        		Log.i(LCAT, "Waiting for source " + url);
      			sourceReady.acquire();
          		Log.i(LCAT, "Loading source");
          		loadFromSource(url, source);
        	} catch (InterruptedException e) {
        		Log.w(LCAT, "Interrupted: " + e.getMessage());
        	}
        	hasBeenOpened = true;
	    }
		else
		{
			if (DBG) {
				Log.d(LCAT, "url was empty");
			}
		}
    }

	public String registerLock() {
		String syncId = "S:" + uniqueLockId.incrementAndGet();
		synchronized(locks) {
			Semaphore l = locks.get(syncId);
			if (l != null) {
				throw new IllegalStateException("Attempt to register duplicate lock id: " + syncId);
			}
			l = new Semaphore(0);
			locks.put(syncId, l);
			return syncId;
		}
	}

	public Semaphore getLockFor(String syncId) {
		synchronized(locks) {
			return locks.get(syncId);
		}
	}

	public void unregisterLock(String syncId) {
		synchronized(locks) {
			if (locks.containsKey(syncId)) {
				locks.remove(syncId);
			}
		}
	}

	public void signal(String syncId) {
		if (DBG) {
			Log.d(LCAT, "Signaling " + syncId);
		}
		Semaphore l = null;
		synchronized(locks) {
			l = locks.get(syncId);
		}
		l.release();
	}

	public void evalJS(final String method) {
		evalJS(method, (String) null, (String) null);
	}

	public void evalJS(final String method, final String data) {
		evalJS(method, data, (String) null);
	}

	public void evalJS(final String method, final JSONObject data)
	{
		String dataValue = null;

		if (data != null) {
			dataValue = data.toString();
		}

		evalJS(method, dataValue, (String) null);
	}

	private void syncOn(String syncId) {
		if (syncId != null) {
			Semaphore l = null;
			synchronized(locks) {
				l = locks.get(syncId);
			}
			try {
				l.acquire();
			} catch (InterruptedException e) {

			}
		}
	}

	public void evalJS(final String method, final String data, final String syncId)
	{
		String expr = method;
		if (expr != null && expr.startsWith(TITANIUM_CALLBACK)) {
			if (data != null) {
				if (syncId == null) {
					expr += ".invoke(" + data + ")";
				}  else {
					expr += ".invoke(" + data + ",'" + syncId + "')";
				}
			} else {
				if (syncId == null) {
					expr += ".invoke()";
				} else {
					expr += ".invoke(null,'" + syncId + "')";
				}
			}
			if (DBG) {
				Log.d(LCAT, expr);
			}
		}

		if (handler != null) {
			if (expr != null && !expr.startsWith(JAVASCRIPT)) {
				expr = JAVASCRIPT + expr;
			}

			if (DBG) {
				Log.w(LCAT, " BEFORE: " + expr);
			}
			final String f = expr;
			// If someone tries to invoke from WebViewCoreThread, use our eval thread
			if ("WebViewCoreThread".equals(Thread.currentThread().getName())) {
				Message m = evalHandler.obtainMessage(MSG_RUN_JAVASCRIPT, expr);
				m.getData().putString("syncId", syncId);
				m.sendToTarget();
			} else {
				loadUrl(f);
				syncOn(syncId);
				if (DBG) {
					Log.w(LCAT, "AFTER: " + f);
				}
			}
		} else {
			Log.w(LCAT, "Handler not available for dispatching event");
		}

	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;
		Bundle b = msg.getData();

		switch (msg.what) {
			case MSG_LOAD_FROM_SOURCE:
	      		String url = b.getString(MSG_EXTRA_URL);
	      		String source = b.getString(MSG_EXTRA_SOURCE);

	      		Log.w(LCAT, "Handling load source message: " + url);

				String extension = MimeTypeMap.getFileExtensionFromUrl(url);
				String mimetype = "application/octet-stream";
				if (extension != null) {
					String type = mtm.getMimeTypeFromExtension(extension);
					if (type != null) {
						mimetype = type;
					} else {
						mimetype = "text/html";
					}

					if("text/html".equals(mimetype)) {

						if (source != null) {
								loadDataWithBaseURL(url, source, mimetype, "utf-8", "about:blank");
								return true;
						} else {
							loadUrl(url); // For testing, doesn't normally run.
						}
					}
				}
				handled = true;
				break;
			case MSG_ADD_CONTROL :
				if (isFocusable()) {
					setFocusable(false);
				}
				View v = (View) msg.obj;
				addView(v, offScreen);
				handled = true;
				break;
			case MSG_REQUEST_NATIVE_LAYOUT : {
				evalJS((String) msg.obj);
				handled = true;
				break;
			}
			case MSG_INVALIDATE_LAYOUT : {
				requestNativeLayout();
				handled = true;
				break;
			}
			case MSG_UPDATE_NATIVE_CONTROLS : {
				String json = (String) msg.obj;
				synchronized(nativeControls) {
					try {
						JSONObject o = new JSONObject(json);
						for (String id : nativeControls.keySet()) {
							if (o.has(id)) {
								JSONObject pos = o.getJSONObject(id);
								Bundle b1 = new Bundle(4);
								b1.putInt("top", pos.getInt("top"));
								b1.putInt("left", pos.getInt("left"));
								b1.putInt("width", pos.getInt("width"));
								b1.putInt("height", pos.getInt("height"));

								ITitaniumNativeControl c = nativeControls.get(id).get();
								c.handleLayoutRequest(b1);
							} else {
								if (DBG) {
									Log.w(LCAT, "Position data not found for id " + id);
								}
							}
						}
					} catch (JSONException e) {
						Log.e(LCAT, "Malformed location object from Titanium.API: " + json);
					}
				}
				handled = true;
				break;
			}
		}
		return handled;
	}

	public void loadFromSource(String url, String source)
	{
		Message m = handler.obtainMessage(MSG_LOAD_FROM_SOURCE);
		Bundle b = m.getData();
		b.putString(MSG_EXTRA_URL, url);
		b.putString(MSG_EXTRA_SOURCE, source);
		m.sendToTarget();
	}

	public synchronized void addListener(ITitaniumNativeControl control) {
		String id = control.getHtmlId();

		if (id == null) {
			throw new IllegalArgumentException("Control must have a non-null id");
		}
		if (nativeControls == null) {
			nativeControls = new HashMap<String, WeakReference<ITitaniumNativeControl>>();
		} else if(nativeControls.containsKey(id)) {
			throw new IllegalArgumentException("Control has already been registered id=" + id);
		}

		synchronized(nativeControls) {
			nativeControls.put(id, new WeakReference<ITitaniumNativeControl>(control));
		}
		//requestNativeLayout(id);

		if (DBG) {
			Log.d(LCAT, "Native control linked to html id " + id);
		}
	}

	public synchronized void removeListener(ITitaniumNativeControl control) {
		if (nativeControls != null) {
			String id = control.getHtmlId();
			synchronized(nativeControls) {
				if (nativeControls.containsKey(id)) {
					nativeControls.remove(id);
					if (DBG) {
						Log.d(LCAT, "Native control unlinked from html id " + id);
					}
				} else {
					Log.w(LCAT, "Attempt to unlink a non registered control. html id " + id);
				}
			}
		}
	}

	public void requestNativeLayout() {
		if (nativeControls != null) {
			synchronized(nativeControls) {
				if (nativeControls != null && nativeControls.size() > 0) {
					JSONArray a = new JSONArray();
					for (String id : nativeControls.keySet()) {
						a.put(id);
					}
					requestNativeLayout(a);
				} else {
					if (DBG) {
						Log.d(LCAT, "No native controls, layout request ignored");
					}
				}
			}
		}
	}

	public synchronized void requestNativeLayout(String id)
	{
		JSONArray a = new JSONArray();
		a.put(id);
		requestNativeLayout(a);
	}

	protected void requestNativeLayout(JSONArray a)
	{
		StringBuilder sb = new StringBuilder(256);
		sb.append("Titanium.sendLayoutToNative(")
			.append(a.toString())
			.append(")");

		handler.removeMessages(MSG_REQUEST_NATIVE_LAYOUT);
		Message msg = handler.obtainMessage(MSG_REQUEST_NATIVE_LAYOUT, sb.toString());
		handler.sendMessageDelayed(msg, 100);
		sb.setLength(0);
	}

	public void updateNativeControls(String json) {
		handler.obtainMessage(MSG_UPDATE_NATIVE_CONTROLS, json).sendToTarget();
	}

	public void invalidateLayout() {
		handler.removeMessages(MSG_INVALIDATE_LAYOUT);
		handler.sendEmptyMessageDelayed(MSG_INVALIDATE_LAYOUT, 250);
	}

	public void addControl(View control) {
		handler.obtainMessage(MSG_ADD_CONTROL, control).sendToTarget();
	}

	@Override
	protected void onSizeChanged(int w, int h, int ow, int oh) {
		// TODO Auto-generated method stub
		super.onSizeChanged(w, h, ow, oh);
		handler.post(
				new Runnable() {
					public void run() {
						requestNativeLayout();
					}
		        });
	}

/*
	public void dispatchApplicationEvent(String eventName, String data) {
		eventListeners.invokeSuccessListeners(eventName, data);
	}
*/
	public TitaniumMenuItem getInternalMenu()
	{
		TitaniumMenuItem menu = null;
		if (tiUI != null) {
			menu = tiUI.getInternalMenu();
		}
		return menu;
	}

	public ITitaniumLifecycle getLifecycle() {
		return this;
	}

	public View getNativeView() {
		return this;
	}

	// Lifecycle Methods

	public void postOpen() {
		// TODO Auto-generated method stub

	}

	public void onDestroy()
	{
		Log.e(LCAT, "ON DESTROY: " + getId());
		//Log.e(LCAT, "Loaded? " + loaded);

		if (/*loaded*/ true) {
			destroy();
		}
	}

	public void onPause() {
		pauseTimers();
	}

	public void onResume() {
		resumeTimers();
	}
}
