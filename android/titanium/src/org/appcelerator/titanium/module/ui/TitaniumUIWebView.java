/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui;

import java.util.HashMap;
import java.util.HashSet;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.TitaniumWebView.OnConfigChange;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumUIWebView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Message;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.SubMenu;
import android.view.View;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class TitaniumUIWebView extends TitaniumBaseView
	implements ITitaniumUIWebView, ITitaniumView, Handler.Callback, ITitaniumLifecycle
{
	private static final String LCAT = "TitaniumUIWebView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	// App/UI level events
	public static final String EVENT_UI_TABCHANGED = "ui.tabchange";

	private static final int MSG_SHOWING = 300;
	private static final int MSG_DISPATCH_WINDOW_EVENT = 301;

	private TitaniumModuleManager tmm;
	private WebView view;
	private String url;
	private Handler handler;
	private boolean hasBeenOpened;
	private boolean needsInitialOnResume;

	private HashMap<Integer, String> optionMenuCallbacks;
	private HashSet<OnConfigChange> configurationChangeListeners;
	private TitaniumJSEventManager windowEventManager;

	public TitaniumUIWebView(TitaniumModuleManager tmm) {
		super(tmm);
		this.tmm = tmm;
		tmm.setCurrentView(this);

		handler = new Handler(this);
		this.hasBeenOpened = false;
		this.needsInitialOnResume = true;
		this.configurationChangeListeners = new HashSet<OnConfigChange>();

		eventManager.supportEvent(EVENT_UI_TABCHANGED);

		this.windowEventManager = new TitaniumJSEventManager(tmm);
		this.windowEventManager.setEnforceEventNames(false); // Allow custom user events.
		this.windowEventManager.supportEvent(EVENT_FOCUSED);
		this.windowEventManager.supportEvent(EVENT_UNFOCUSED);

		tmm.getCurrentWindow().registerView(this);
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		if (msg.what == MSG_SHOWING) {
			if (needsInitialOnResume) {
				onResume();
				needsInitialOnResume = false;
			}
			if (view != null) {
				if (view instanceof TitaniumWebView) {
					//((TitaniumWebView) view).showing();
				} else {
					view.loadUrl(url);
				}
				hasBeenOpened = true;
				handled = true;
			}
		} else if (msg.what == MSG_DISPATCH_WINDOW_EVENT) {
			String eventName = (String) msg.obj;
			String eventData = (String) msg.getData().getString("eventData");

			windowEventManager.invokeSuccessListeners(eventName, eventData);
			handled = true;
		} else {
			handled = super.handleMessage(msg);
		}
		return handled;
	}

	@Override
	protected void processLocalOptions(JSONObject o) throws JSONException {
		if (o.has("url")) {
			setUrl(o.getString("url"));
		}
	}

	@Override
	protected void doOpen()
	{
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		setLayoutParams(params);
		setFocusable(false);
		setFocusableInTouchMode(false);

		if (!URLUtil.isNetworkUrl(url)) {
			TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getActivity());
			String u = url;
			if (!URLUtil.isAssetUrl(url)) {
				u = tfh.getResourceUrl(url);
			}
			TitaniumWebView tv = tmm.getWebView();
			tv.setUrl(u);
	        tv.initializeModules();
	    	tv.buildWebView(); //TODO Performance?
	    	view = tv;
		} else {
			view = new WebView(tmm.getAppContext()) {

				@Override
				public boolean onKeyDown(int keyCode, KeyEvent event) {
					if (keyCode == KeyEvent.KEYCODE_BACK && event.getRepeatCount() == 0) {
						if (this.canGoBack()) {
							this.goBack();
							return true;
						}
					}
					return super.onKeyDown(keyCode, event);
				}
			};
			view.setWebChromeClient(new WebChromeClient() {
			});
			view.setWebViewClient(new WebViewClient(){
			});
			view.getSettings().setJavaScriptEnabled(true);
			view.getSettings().setLoadsImagesAutomatically(true);
			view.getSettings().setAllowFileAccess(false);
			view.getSettings().setPluginsEnabled(true);
			view.setScrollBarStyle(WebView.SCROLLBARS_INSIDE_OVERLAY);
			view.loadUrl(url);
		}
	}

	public WebView getWebView() {
		return view;
	}

	@Override
	protected View getContentView() {
		return view;
	}

	@Override
	protected LayoutParams getContentLayoutParams() {
		return new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
	}

	public TitaniumWebView getTitaniumWebView() {
		TitaniumWebView v = null;

		if (view instanceof TitaniumWebView) {
			v = (TitaniumWebView) view;
		}

		return v;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public void addConfigChangeListener(OnConfigChange listener) {
		synchronized(configurationChangeListeners) {
			configurationChangeListeners.add(listener);
		}
	}

	public void removeConfigChangeListener(OnConfigChange listener) {
		synchronized(configurationChangeListeners) {
			configurationChangeListeners.remove(listener);
		}
	}

	public void dispatchConfigurationChange(Configuration newConfig)
	{
		synchronized(configurationChangeListeners) {
			for(OnConfigChange listener : configurationChangeListeners) {
				try {
					listener.configurationChanged(newConfig);
				} catch (Throwable t) {
					Log.e(LCAT, "Error invoking configuration changed on a listener");
				}
			}
		}
	}

    protected void buildMenuTree(Menu menu, TitaniumMenuItem md, HashMap<Integer, String> map)
    {
    	if (md.isRoot()) {
    		for(TitaniumMenuItem mi : md.getMenuItems()) {
    			buildMenuTree(menu, mi, map);
    		}
    	} else if (md.isSubMenu()) {
    		SubMenu sm = menu.addSubMenu(0, md.getItemId(), 0, md.getLabel());
    		for(TitaniumMenuItem mi : md.getMenuItems()) {
    			buildMenuTree(sm, mi, map);
    		}
    	} else if (md.isSeparator()) {
    		// Skip, no equivalent in Android
    	} else if (md.isItem()) {
    		MenuItem mi = menu.add(0, md.getItemId(), 0, md.getLabel());
    		String s = md.getIcon();
    		if (s != null) {
     			Drawable d = null;
				TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getActivity());
				d = tfh.loadDrawable(s, true);
				if (d != null) {
					mi.setIcon(d);
				}
    		}

    		s = md.getCallback();
    		if (s != null) {
    			map.put(md.getItemId(), s);
    		}
    	} else {
    		throw new IllegalStateException("Unknown menu type expected: root, submenu, separator, or item");
    	}
    }

	public boolean dispatchPrepareOptionsMenu(Menu menu)
	{
		boolean handled = false;
		TitaniumWebView v = getTitaniumWebView();
		if (v != null) {
			TitaniumMenuItem md = v.getInternalMenu();
			if (md != null) {
				if (!md.isRoot()) {
					throw new IllegalStateException("Expected root menuitem");
				}

				if (optionMenuCallbacks != null) {
					optionMenuCallbacks.clear();
				}

				optionMenuCallbacks = new HashMap<Integer, String>();
				menu.clear(); // Inefficient, but safest at the moment
				buildMenuTree(menu, md, optionMenuCallbacks);
				handled = true;
			} else {
				if (DBG) {
					Log.d(LCAT, "No option menu set.");
				}
			}
		}
		return handled;
	}

	public boolean dispatchOptionsItemSelected(MenuItem item) {
		boolean result = false;

		if (optionMenuCallbacks != null) {
			int id = item.getItemId();
			final String callback = optionMenuCallbacks.get(id);
			if (callback != null) {
				TitaniumWebView v = getTitaniumWebView();
				if (v != null) {
					v.evalJS(callback);
				}
				result = true;
			}
		}

		return result;
	}

	public int addWindowEventListener(String eventName, String eventListener)
	{
		return windowEventManager.addListener(eventName, eventListener);
	}

	public void removeWindowEventListener(String eventName, int listenerId) {
		windowEventManager.removeListener(eventName, listenerId);
	}

	public void dispatchWindowEvent(String eventName, String eventData) {
		Message msg = handler.obtainMessage(MSG_DISPATCH_WINDOW_EVENT, eventName);
		msg.getData().putString("eventData", eventData);
		msg.sendToTarget();
	}

	public void dispatchApplicationEvent(String eventName, String data) {
		//eventListeners.invokeSuccessListeners(eventName, data);
	}

	public ITitaniumLifecycle getLifecycle() {
		return this;
	}

	public void postOpen() {
		if (!hasBeenOpened) {
			handler.obtainMessage(MSG_OPEN).sendToTarget();
			handler.obtainMessage(MSG_SHOWING).sendToTarget(); // Showing?
		}
	}

	public void onResume() {
		if (tmm != null) {
			tmm.onResume();
		}
	}

	public void onPause() {
		if (tmm != null) {
			tmm.onPause();
		}
	}

	public void onDestroy() {
		if (tmm != null) {
			tmm.onDestroy();
		}
		windowEventManager.clear();
	}
}
