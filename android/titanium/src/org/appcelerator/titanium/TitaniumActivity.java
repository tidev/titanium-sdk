/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumApp;
import org.appcelerator.titanium.api.ITitaniumNetwork;
import org.appcelerator.titanium.api.ITitaniumPlatform;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
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
import org.appcelerator.titanium.module.ui.TitaniumMenuItem;
import org.appcelerator.titanium.util.TitaniumActivityHelper;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumJavascriptHelper;
import org.appcelerator.titanium.util.TitaniumLogWatcher;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.appcelerator.titanium.util.TitaniumUrlHelper;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Process;
import android.util.Config;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.SubMenu;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Class that controls a mobile Titanium application.
 */

public class TitaniumActivity extends Activity
{
	private static final String LCAT = "TiActivity";
	private static final boolean DBG = Config.LOGD;

	protected static final int ACCELEROMETER_DELAY = 100; // send event no more frequently than

	protected TitaniumApplication app;
	protected TitaniumAppInfo appInfo;
	protected TitaniumWindowInfo windowInfo;
	protected TitaniumModuleManager moduleMgr;

	protected TitaniumUI tiUI;

	protected boolean loadOnPageEnd;

	protected ImageView splashView;

	protected WebView webView;
	protected Handler handler;

	private HashMap<Integer, String> optionMenuCallbacks;
	private boolean loaded;
	private boolean destroyed;

	private HashMap<Integer, TitaniumResultHandler> resultHandlers;
	private AtomicInteger uniqueResultCodeAllocator;
	private static AtomicInteger idGenerator;
	private int initialOrientation;
	private HashSet<OnConfigChange> configurationChangeListeners;
	private TitaniumLogWatcher logWatcher;

	private FrameLayout layout;

	private boolean showingJSError;

	public interface OnConfigChange {
		public void configurationChanged(Configuration config);
	}

	private long start;

	private void ts(String s) {
		long now = System.currentTimeMillis();
		long ms = now - start;
		Log.w(LCAT, s + " : " + ms);
		start = now;
	}

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
    	start = System.currentTimeMillis();

    	if (DBG) {
    		Log.d(LCAT, "onCreate");
    	}
        super.onCreate(savedInstanceState);

        logWatcher = new TitaniumLogWatcher(this);

        final TitaniumActivity me = this;

        try {
        	app = (TitaniumApplication) getApplication();
        } catch (ClassCastException e) {
        	Log.e(LCAT, "Configuration problem: " + e.getMessage(), e);
        	setContentView(new TextView(this));
        	TitaniumUIHelper.doOkDialog(
        			this,
        			"Fatal",
        			"Unable to cast Application object to TitaniumApplication." +
        			" Check AndroidManfest.xml for android:name attribute on application element.",
        			TitaniumUIHelper.createFinishListener(me)
        			);
        	return;
        }

        ts("After getApplication()");

        loadOnPageEnd = true;
        initialOrientation = this.getRequestedOrientation();
        Intent activityIntent = getIntent();
        if (activityIntent != null) {
        	String message = activityIntent.getExtras().getString("message");
        	if (message != null) {
        		this.setTitle("Javascript Error");
        		showingJSError = true;
        		LinearLayout layout = new LinearLayout(this);
        		layout.setOrientation(LinearLayout.VERTICAL);
        		layout.setBackgroundColor(Color.WHITE);
        		TextView tv = new TextView(this);
        		tv.setText(message);
        		tv.setTextColor(Color.RED);
        		layout.addView(tv, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.FILL_PARENT,LinearLayout.LayoutParams.WRAP_CONTENT,0.75f));
        		Button ok = new Button(this);
        		ok.setText("OK");
         		ok.setOnClickListener(new View.OnClickListener(){
					public void onClick(View arg0) {
						Process.killProcess(Process.myPid());
					}});
        		layout.addView(ok, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.FILL_PARENT,LinearLayout.LayoutParams.WRAP_CONTENT,0.25f));
        		this.setContentView(layout);
        		return;
        	}
        }

        TitaniumIntentWrapper intent = new TitaniumIntentWrapper(getIntent());

        if (getIntent() != null) {
        	appInfo = intent.getAppInfo(me);
        	windowInfo = intent.getWindowInfo(appInfo);
        } else {
        	if (DBG) {
        		Log.d(LCAT, "Intent was empty");
        	}
        }

        // Window features must be requested before setContentView

        if (intent.isFullscreen()) {
        	if (DBG) {
        		Log.d(LCAT, "Enabling No Title feature");
        	}
        	this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        } else {
        	if (DBG) {
        		Log.d(LCAT, "Enabling Title area features");
        	}
	        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
	        this.requestWindowFeature(Window.FEATURE_PROGRESS);
	        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
        }

        ts("After Window Configuration");

        String backgroundImage = "default.png";

        if (windowInfo != null) {
        	String orientation = windowInfo.getWindowOrientation();
        	if ("portrait".compareTo(orientation) == 0) {
        		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        	} else if ("landscape".compareTo(orientation) == 0) {
        		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        	} else {
        		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        	}
        	if(windowInfo.hasWindowBackgroundImage()) {
        		backgroundImage = windowInfo.getWindowBackgroundImage();
        	}
        }

        TitaniumFileHelper tfh = new TitaniumFileHelper(this);
		splashView=new ImageView(this);

		splashView.setScaleType(ImageView.ScaleType.FIT_XY);
		Drawable d = tfh.loadDrawable(intent, backgroundImage, false); // Ok to not have background
		if (d != null) {
			((BitmapDrawable) d).setGravity(Gravity.TOP);
			splashView.setImageDrawable(d);
		}
		setContentView(splashView);

		ts("After splash");

		layout = new FrameLayout(this);

		configurationChangeListeners = new HashSet<OnConfigChange>();

		resultHandlers = new HashMap<Integer, TitaniumResultHandler>();
		uniqueResultCodeAllocator = new AtomicInteger();
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(1);
		}

		ts ("Starting WebView config");
		handler = new Handler();
        webView = new WebView(me);

//        if (d != null) {
//          // If you want the background to show, you have to have a ZERO alpha channel
//        	webView.setBackgroundColor(Color.argb(0,255,0,0));
//        	webView.setBackgroundDrawable(d);
//        }

        // Setup webView
        webView.setId(idGenerator.incrementAndGet()); //ToDo unique
        webView.setWebViewClient(new TiWebViewClient(me));
        webView.setWebChromeClient(new TiWebChromeClient(me));
		webView.clearCache(true);
		webView.setVerticalScrollbarOverlay(true);
		if (windowInfo != null && windowInfo.hasBackgroundColor()) {
			webView.setBackgroundColor(windowInfo.getBackgroundColor());
		}

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportZoom(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setLightTouchEnabled(true);

        ts("After webview configured, before modules");

        // Add Modules
        moduleMgr = new TitaniumModuleManager(this, handler);
        this.tiUI = new TitaniumUI(moduleMgr, "TitaniumUI");

        new TitaniumMedia(moduleMgr, "TitaniumMedia");
        String userAgent = appInfo.getSystemProperties().getString(TitaniumAppInfo.PROP_NETWORK_USER_AGENT, null); //if we get null, we have a startup error.
        ITitaniumNetwork tiNetwork = new TitaniumNetwork(moduleMgr, "TitaniumNetwork", userAgent);
        ITitaniumPlatform tiPlatform = new TitaniumPlatform(moduleMgr, "TitaniumPlatform");

		ITitaniumApp tiApp = new TitaniumApp(moduleMgr, "TitaniumApp",appInfo);
 		new TitaniumAnalytics(moduleMgr, "TitaniumAnalytics");
		new TitaniumAPI(moduleMgr, "TitaniumAPI");
		new TitaniumFilesystem(moduleMgr, "TitaniumFilesystem");
		new TitaniumDatabase(moduleMgr, "TitaniumDatabase");
		new TitaniumAccelerometer(moduleMgr, "TitaniumAccelerometer");
		new TitaniumGesture(moduleMgr, "TitaniumGesture");
		new TitaniumGeolocation(moduleMgr, "TitaniumGeolocation");

		// Add Modules from Applications
		app.addModule(moduleMgr);

		moduleMgr.registerModules();

		ts ("After modules");

		if (app.needsStartEvent()) {
			String deployType = appInfo.getSystemProperties().getString("ti.deploytype", "unknown");

			app.postAnalyticsEvent(TitaniumAnalyticsEventFactory.createAppStartEvent(tiNetwork, tiPlatform, tiApp, deployType));
		}

        if (getIntent() != null)
		{
          	String url = tfh.getResourceUrl(intent, intent.getData().toString());
          	try {
          		loadFromSource(url);
          	} catch (Exception e) {
            	setContentView(new TextView(this));
            	TitaniumUIHelper.doOkDialog(
            			this.getParent(),
            			"Fatal",
            			"Error loading source: " + e.getMessage(),
            			TitaniumUIHelper.createKillListener()
            			);
            	return;
          	}
	    }
		else
		{
			if (DBG) {
				Log.d(LCAT, "Intent was empty");
			}
		}
        ts("end of onCreate");
	}

    public WebView getWebView() {
    	return this.webView;
    }

    public void launchTitaniumActivity(final String name) {
		// Set up intent for launching activity in same context
		Intent intentCopy = (Intent) getIntent().clone();
		TitaniumIntentWrapper intent = new TitaniumIntentWrapper(intentCopy);
		intent.setWindowId(name);

		launchTitaniumActivity(intent);
    }

    public void launchTitaniumActivity(TitaniumIntentWrapper intent) {
    	final Intent launchIntent = intent.getIntent();
    	if (launchIntent.getComponent() == null) {
			Class<?> activityClass = TitaniumApplication.getActivityForType(intent.getActivityType());
			if (activityClass == null) {
				throw new IllegalArgumentException("Unknow activity type: " + intent.getActivityType());
			}

			launchIntent.setClass(this, activityClass);
    	}

    	final TitaniumActivity me = this;

		handler.post(new Runnable(){

			public void run() {
				TitaniumActivityGroup parent = TitaniumActivityHelper.getTitaniumActivityGroup(me);
				parent.launch(launchIntent);
			}
		});
    }

    public void launchActivityForResult(final TitaniumIntentWrapper intent, final int code,
    		final TitaniumResultHandler resultHandler)
    {
    	TitaniumResultHandler wrapper = new TitaniumResultHandler() {

			public void onError(TitaniumActivity activity, int requestCode, Exception e)
			{
				resultHandler.onError(activity, requestCode, e);
				removeResultHandler(code);
			}

			public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data)
			{
				resultHandler.onResult(activity, requestCode, resultCode, data);
				removeResultHandler(code);
			}
		};

    	registerResultHandler(code, wrapper);
    	try {
    		startActivityForResult(intent.getIntent(), code);
     	} catch (ActivityNotFoundException e) {
			wrapper.onError(this,code,e);
		}
    }

	@Override
	public void onConfigurationChanged(Configuration newConfig) {
		super.onConfigurationChanged(newConfig);
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

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK && event.getRepeatCount() == 0)) {
        	if (webView.canGoBack()) {
        		webView.goBack();
        		Log.e(LCAT, "Activity back key and has webView back");
                return true;
        	}
        }
        return false;
    }

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		super.onCreateOptionsMenu(menu);
		if (DBG) {
			Log.d(LCAT, "onCreateOptionsMenu");
		}
		return true;
	}

	@Override
	public boolean onPrepareOptionsMenu(Menu menu)
	{
		if (DBG) {
			Log.d(LCAT, "onPrepareOptionsMenu");
		}
		super.onPrepareOptionsMenu(menu);

		TitaniumMenuItem md = tiUI.getInternalMenu();
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

		} else {
			if (DBG) {
				Log.d(LCAT, "No option menu set.");
			}
			return false;
		}
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item)
	{
		if (DBG) {
			Log.d(LCAT, "onOptionsItemSelected");
		}
		boolean result = super.onOptionsItemSelected(item);

		if (optionMenuCallbacks != null) {
			int id = item.getItemId();
			final String callback = optionMenuCallbacks.get(id);
			if (callback != null) {
				TitaniumJavascriptHelper.evalJS(webView, handler, callback);
				result = true;
			}
		}
		return result;
	}

	protected boolean loadFromSource(String url)
		throws IOException
	{
    	return loadFromSource(url, null);
    }

    protected boolean loadFromSource(String url, String[] files)
    	throws IOException
    {
    	if (DBG) {
    		Log.d(LCAT,"Full url: " + url);
    	}
    	return TitaniumUrlHelper.loadFromSource(webView, url, null);
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
				TitaniumFileHelper tfh = new TitaniumFileHelper(this.getParent());
				d = tfh.loadDrawable(new TitaniumIntentWrapper(getIntent()), s, true);
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
	public void triggerLoad ()
	{
		if (DBG) {
			Log.d(LCAT, "triggerLoad = " + !loaded);
		}
		if (false == loaded)
		{
			if (!destroyed) {
				final TitaniumActivity me = this;
	 			handler.post(new Runnable(){
					public void run() {
						layout.addView(me.webView);
				 	    me.setContentView(layout);
				 	    ts("webview is content");

				 	    if (!me.webView.hasFocus()) {
				 	    	me.webView.requestFocus();
				 	    }
						loaded = true;
					}
				});
			} else {
				webView.destroy();
			}
		}
	}
	public void setLoadOnPageEnd(boolean load) {
		loadOnPageEnd = load;
	}
	public boolean getLoadOnPageEnd() {
		return loadOnPageEnd;
	}

	public int getUniqueResultCode() {
		return uniqueResultCodeAllocator.getAndIncrement();
	}

	protected void registerResultHandler(int code, TitaniumResultHandler handler) {
		if (handler == null) {
			Log.w(LCAT, "Received a null result handler");
		}
		resultHandlers.put(code, handler);
	}

	protected void removeResultHandler(int code) {
		resultHandlers.remove(code);
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

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		Log.e(LCAT, "TitaniumActivity, onActivityResult");
		super.onActivityResult(requestCode, resultCode, data);
		TitaniumResultHandler handler = resultHandlers.get(requestCode);
		if (handler != null) {
			handler.onResult(this, requestCode, resultCode, data);
		} else {
			Log.i(LCAT, "Received activity requestCode=" + requestCode + " but no handler was registered. Ignoring.");
		}
	}

	@Override
	public void finishFromChild(Activity child) {
		//super.finishFromChild(child);
		Log.e(LCAT, "TA - finishFromChild: ");
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		if (!showingJSError) {
			if (appInfo != null && appInfo.getSystemProperties().getBool(TitaniumAppInfo.PROP_ANDROID_WATCHLOG, false)) {
				logWatcher.attach();
			}
			moduleMgr.onResume();
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
		if (!showingJSError) {
			moduleMgr.onPause();
			if (appInfo != null && appInfo.getSystemProperties().getBool(TitaniumAppInfo.PROP_ANDROID_WATCHLOG, false)) {
				logWatcher.detach();
			}
		}
	}

	@Override
	protected void onDestroy() {
		Log.e(LCAT, "ON DESTROY: " + webView.getId());
		Log.e(LCAT, "Loaded? " + loaded);
		super.onDestroy();
		if (!showingJSError) {
			moduleMgr.onDestroy();
		}
		if (loaded) {
			//webView.destroy();
		}
		destroyed = true;
	}
}
