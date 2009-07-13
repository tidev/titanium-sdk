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
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumApp;
import org.appcelerator.titanium.api.ITitaniumNetwork;
import org.appcelerator.titanium.api.ITitaniumPlatform;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
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
import android.os.Message;
import android.os.Process;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.SubMenu;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.animation.AlphaAnimation;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.ViewAnimator;

/**
 * Class that controls a mobile Titanium application.
 */

public class TitaniumActivity extends Activity implements Handler.Callback
{
	private static final String LCAT = "TiActivity";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final int ACCELEROMETER_DELAY = 100; // send event no more frequently than

	protected static final int MSG_START_ACTIVITY = 300;
	protected static final int MSG_ACTIVATE_WEBVIEW = 301;
	protected static final int MSG_PUSH_VIEW = 302;
	protected static final int MSG_POP_VIEW = 303;

	protected TitaniumApplication app;
	protected TitaniumIntentWrapper intent;
	protected TitaniumFileHelper tfh;

	protected TitaniumAppInfo appInfo;
	protected TitaniumWindowInfo windowInfo;
	protected TitaniumModuleManager moduleMgr;

	protected TitaniumUI tiUI;

	protected boolean loadOnPageEnd;

	protected ImageView splashView;

	protected TitaniumWebView webView;
	protected Handler handler;

	private HashMap<Integer, String> optionMenuCallbacks;
	private boolean loaded;
	private boolean allowVisible;
	private boolean destroyed;

	private HashMap<Integer, TitaniumResultHandler> resultHandlers;
	private AtomicInteger uniqueResultCodeAllocator;
	private static AtomicInteger idGenerator;
	private int initialOrientation;
	private HashSet<OnConfigChange> configurationChangeListeners;
	private TitaniumLogWatcher logWatcher;

	private ViewAnimator layout;
	private Drawable backgroundDrawable;

	private String url;
	private String source;
	private Semaphore sourceReady;

	private boolean showingJSError;

	private boolean fullscreen;

	public interface OnConfigChange {
		public void configurationChanged(Configuration config);
	}

	public interface CheckedRunnable {
		public void run(boolean isUISafe);
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
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(1);
		}

        final TitaniumActivity me = this;
        tfh = new TitaniumFileHelper(this);
        intent = new TitaniumIntentWrapper(getIntent());

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

    	Activity root = TitaniumActivityHelper.getRootActivity(this);
		handler = new Handler(me);
        webView = new TitaniumWebView(me);
        webView.setId(idGenerator.incrementAndGet());
        webView.setWebViewClient(new TiWebViewClient(this));
        webView.setWebChromeClient(new TiWebChromeClient(this));


        if (intent != null) {
        	appInfo = intent.getAppInfo(me);
        	windowInfo = intent.getWindowInfo(appInfo);
         	url = tfh.getResourceUrl(intent.getData().toString());
         } else {
        	 if (DBG) {
        		 Log.d(LCAT, "Intent was empty");
        	 }
         }

        sourceReady = new Semaphore(0);

		Thread sourceLoadThread = new Thread(new Runnable(){

			public void run() {
				try {
					source = TitaniumUrlHelper.getSource(app, app.getApplicationContext(), url, null);
				} catch (IOException e) {
					Log.e(LCAT, "Unable to load source for " + url);
				} finally {
					synchronized(sourceReady) {
						sourceReady.release();
					}
				}
			}});
        sourceLoadThread.start();

		layout = new ViewAnimator(this);
		layout.setAnimateFirstView(true);
		AlphaAnimation inAnim = new AlphaAnimation(0.0f, 1.0f);
		inAnim.setDuration(200);
		layout.setInAnimation(inAnim);

		configurationChangeListeners = new HashSet<OnConfigChange>();

		resultHandlers = new HashMap<Integer, TitaniumResultHandler>();
		uniqueResultCodeAllocator = new AtomicInteger();

        loadOnPageEnd = true;

        ts("After getApplication()");

        String backgroundImage = "default.png";
        final String fBackgroundImage = backgroundImage;
    	if(windowInfo != null && windowInfo.hasWindowBackgroundImage()) {
    		backgroundImage = windowInfo.getWindowBackgroundImage();
    	}

        Thread backgroundDrawableThread = new Thread(new Runnable(){

			public void run() {
				backgroundDrawable = tfh.loadDrawable(fBackgroundImage, false); // Ok to not have background
			}});
        backgroundDrawableThread.start();

        initializeModules();

        Thread webViewThread = new Thread(new Runnable(){

			public void run() {
				buildWebView();
			}});
        webViewThread.setPriority(Thread.MAX_PRIORITY);
        webViewThread.start();

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

        		webViewThread.interrupt();
        		return;
        	}
        }

        // Window features must be requested before setContentView

        if (intent.isFullscreen()) {
        	if (DBG) {
        		Log.d(LCAT, "Enabling No Title feature");
        	}
        	this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        	fullscreen = true;
        } else {
        	if (DBG) {
        		Log.d(LCAT, "Enabling Title area features");
        	}
	        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
	        this.requestWindowFeature(Window.FEATURE_PROGRESS);
	        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
        }

        ts("After Window Configuration");

        if (windowInfo != null) {
        	String orientation = windowInfo.getWindowOrientation();
        	if ("portrait".compareTo(orientation) == 0) {
        		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        	} else if ("landscape".compareTo(orientation) == 0) {
        		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        	} else {
        		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        	}
        	if(windowInfo.getWindowTitle() != null) {
        		root.setTitle(windowInfo.getWindowTitle());
        	}
        } else {
        	if (intent.getTitle() != null) {
        		root.setTitle(intent.getTitle());
        	}
        }
    	root = null;

		splashView=new ImageView(this);
		splashView.setScaleType(ImageView.ScaleType.FIT_XY);

		try {
			backgroundDrawableThread.join();
		} catch (InterruptedException e) {
			Log.w(LCAT, "Interrupted");
		}

		if (backgroundDrawable != null) {
			((BitmapDrawable) backgroundDrawable).setGravity(Gravity.TOP);
			splashView.setImageDrawable(backgroundDrawable);
		}
		layout.addView(splashView);
		setContentView(layout);

		ts("After splash");

		ts ("Starting WebView config");

//        if (d != null) {
//          // If you want the background to show, you have to have a ZERO alpha channel
//        	webView.setBackgroundColor(Color.argb(0,255,0,0));
//        	webView.setBackgroundDrawable(d);
//        }

        ts("end of onCreate");
	}

    public boolean isFullscreen() {
    	TitaniumActivityGroup parent = (TitaniumActivityGroup) getParent();
    	return parent != null ? parent.isFullscreen() : fullscreen;
    }

    protected void initializeModules() {
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

		if (app.needsEnrollEvent()) {
			app.postAnalyticsEvent(TitaniumAnalyticsEventFactory.createAppEnrollEvent(tiPlatform, tiApp));
		}

		if (app.needsStartEvent()) {
			String deployType = appInfo.getSystemProperties().getString("ti.deploytype", "unknown");

			app.postAnalyticsEvent(TitaniumAnalyticsEventFactory.createAppStartEvent(tiNetwork, tiPlatform, tiApp, deployType));
		}
    }

    protected void buildWebView()
    {
		if (windowInfo != null && windowInfo.hasBackgroundColor()) {
			webView.setBackgroundColor(windowInfo.getBackgroundColor());
		}

	       ts("After webview configured");

        if (intent != null)
		{
        	try {
          		synchronized(sourceReady) {
          			sourceReady.acquire();
          		}
          		webView.loadFromSource(url, source);
        	} catch (InterruptedException e) {
        		Log.w(LCAT, "Interrupted: " + e.getMessage());
        	}
	    }
		else
		{
			if (DBG) {
				Log.d(LCAT, "Intent was empty");
			}
		}
    }

	public boolean handleMessage(Message msg)
	{
		//Bundle b = msg.getData();

		switch(msg.what) {
			case MSG_START_ACTIVITY :
				startActivity((Intent) msg.obj);
				return true;
			case MSG_ACTIVATE_WEBVIEW : {
				View current = layout.getCurrentView();
				if (current == splashView) {
					layout.addView(webView);
					layout.showNext();
					layout.removeView(splashView);

					ts("webview is content");

			 	    if (!webView.hasFocus()) {
			 	    	webView.requestFocus();
			 	    }
				}
				loaded = true;
				return true;
			}
			case MSG_PUSH_VIEW: {
				View v = (View)msg.obj;
				layout.addView(v, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.FILL_PARENT,ViewGroup.LayoutParams.FILL_PARENT));
				layout.showNext();

				if (!v.hasFocus()) {
					v.requestFocus();
				}
				return true;
			}
			case MSG_POP_VIEW : {
				View v = (View) msg.obj;
				layout.showPrevious();
				layout.removeView(v);
				return true;
			}
		}

		return false;
	}

	public Handler getHandler() {
		return this.handler;
	}

    public TitaniumWebView getWebView() {
    	return this.webView;
    }

    public TitaniumAppInfo getAppInfo() {
    	return appInfo;
    }

    public void launchTitaniumActivity(final String name) {
		// Set up intent for launching activity in same context
		Intent intentCopy = (Intent) getIntent().clone();
		TitaniumIntentWrapper intent = new TitaniumIntentWrapper(intentCopy);
		intent.setWindowId(name);

		launchTitaniumActivity(intent);
    }

    public void launchTitaniumActivity(final TitaniumIntentWrapper intent) {
    	final Intent launchIntent = intent.getIntent();
    	if (launchIntent.getComponent() == null) {
			Class<?> activityClass = TitaniumApplication.getActivityForType(intent.getActivityType());
			if (activityClass == null) {
				throw new IllegalArgumentException("Unknow activity type: " + intent.getActivityType());
			}

			launchIntent.setClass(this, activityClass);
    	}

    	handler.obtainMessage(MSG_START_ACTIVITY, intent.getIntent()).sendToTarget();
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
        	Log.e(LCAT, "BACK in Activity");
        	if (webView.canGoBack()) {
        		webView.goBack();
        		Log.e(LCAT, "Activity back key and has webView back");
                return true;
        	} else {
        		finish();
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
				webView.evalJS(callback);
				result = true;
			}
		}
		return result;
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
	public void triggerLoad ()
	{
		if (DBG) {
			Log.d(LCAT, "triggerLoad = " + !loaded);
		}
		if (false == loaded)
		{
			if (!destroyed) {
				handler.obtainMessage(MSG_ACTIVATE_WEBVIEW).sendToTarget();
			} else {
				webView.destroy();
			}
		}
	}

	public void pushView(final View v) {
		handler.obtainMessage(MSG_PUSH_VIEW, v).sendToTarget();
	}

	public void popView(final View v) {
		handler.obtainMessage(MSG_POP_VIEW, v).sendToTarget();
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

	public void runOnUiThreadWithCheck(final CheckedRunnable r)
	{
		runOnUiThread(new Runnable(){

			public void run() {
				r.run(allowVisible);
			}});
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
		allowVisible = true;
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
		allowVisible = false;
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
		allowVisible = false;
		Log.e(LCAT, "ON DESTROY: " + webView.getId());
		Log.e(LCAT, "Loaded? " + loaded);
		super.onDestroy();
		if (!showingJSError) {
			moduleMgr.onDestroy();
		}
		if (loaded) {
			webView.destroy();
		}
		destroyed = true;
	}
}
