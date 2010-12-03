/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import java.io.IOException;
import java.util.concurrent.CountDownLatch;

import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.TiActivityWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBindingHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIActivityWindow;

import android.content.Intent;
import android.os.Bundle;

public abstract class TiJSActivity extends TiBaseActivity
{
	private static final String LCAT = "TiBaseActivity";
	private static boolean DBG = TiConfig.LOGD;

	protected TiContext tiContext;
	protected CountDownLatch jsLoadedLatch;
	protected String url;
	
	public TiJSActivity(ActivityProxy proxy) {
		setActivityProxy(proxy);
		if (proxy.hasProperty("url")) {
			this.url = TiConvert.toString(proxy.getProperty("url"));
		}
	}
	
	public TiJSActivity(String url) {
		this.url = url;
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) 
	{
		if (url == null) {
			Intent intent = getIntent();
			if (intent != null && intent.getDataString() != null) {
				url = intent.getDataString();
			} else {
				throw new IllegalStateException("Activity url required.");
			}
		}
		
		int lastSlash = url.lastIndexOf('/');
		String baseUrl = url.substring(0, lastSlash+1);
		if (baseUrl.length() == 0) {
			baseUrl = null;
		}
		tiContext = TiContext.createTiContext(this, baseUrl);

		TiActivityWindowProxy window = new TiActivityWindowProxy(tiContext);
		TiBindingHelper.bindCurrentWindow(tiContext, window);
		
		if (activityProxy == null) {
			setActivityProxy(new ActivityProxy(tiContext, this));
		}
		TiBindingHelper.bindCurrentActivity(tiContext, activityProxy);
		
		setWindowProxy(window);
		setMenuDispatchListener(new TiMenuDispatchListener(tiContext, activityProxy));
		super.onCreate(savedInstanceState);	
	}
	
	protected void waitForJS() {
		try {
			if (DBG) {
				Log.d(LCAT, "Waiting for JS Activity @ " + url + " to load");
			}
			jsLoadedLatch.await();
		} catch (InterruptedException e) {
			Log.w(LCAT, "Wait for JS Load interrupted.");
		}
		if (DBG) {
			Log.d(LCAT, "Loaded JS Activity @ " + url);
		}
	}
	
	protected void loadActivityScript() {
		try {
			String fullUrl = url;
			if (!fullUrl.contains("://") && !fullUrl.startsWith("/")) {
				fullUrl = tiContext.getBaseUrl() + fullUrl;
			}
			if (DBG) {
				if (url != fullUrl) {
					Log.d(LCAT, "Eval JS Activity:" + url + " (" + fullUrl+ ")");
				} else {
					Log.d(LCAT, "Eval JS Activity:" + url);
				}
			}
			tiContext.evalFile(fullUrl);
		} catch (IOException e) {
			e.printStackTrace();
			finish();
		} finally {
			if (DBG) {
				Log.d(LCAT, "Signal JS loaded");
			}
			jsLoadedLatch.countDown(); // Release UI thread
		}
	}
	
	protected void windowCreated() {
		super.windowCreated();
		TiUIActivityWindow win = new TiUIActivityWindow((TiActivityWindowProxy)window, this, layout);
		
		// Load the activity JS
		jsLoadedLatch = new CountDownLatch(1);
		new Thread(new Runnable(){
			@Override
			public void run() {
				loadActivityScript();
			}
		}).start();
		
		waitForJS();
		win.open();
	}
	
	@Override
	protected boolean shouldFinishRootActivity() {
		return getIntentBoolean("closeOnExit", false) || super.shouldFinishRootActivity();
	}
}
