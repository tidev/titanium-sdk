/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumActivityHelper;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumLogWatcher;
import org.appcelerator.titanium.util.TitaniumUIHelper;

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
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
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

public class TitaniumActivity extends Activity
	implements Handler.Callback
{
	private static final String LCAT = "TiActivity";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final int ACCELEROMETER_DELAY = 100; // send event no more frequently than

	protected static final int MSG_START_ACTIVITY = 300;
	protected static final int MSG_ACTIVATE_VIEW = 301;
	//protected static final int MSG_PUSH_VIEW = 302;
	//protected static final int MSG_POP_VIEW = 303;
	protected static final int MSG_SET_LOAD_ON_PAGE_END = 304;
	protected static final int MSG_CLOSE = 305;

	protected TitaniumApplication app;
	protected TitaniumIntentWrapper intent;
	protected TitaniumFileHelper tfh;

	protected TitaniumAppInfo appInfo;
	protected TitaniumWindowInfo windowInfo;

	protected ArrayList<ITitaniumView> views;
	protected int activeViewIndex;

	protected boolean loadOnPageEnd;

	protected ImageView splashView;

	protected Handler handler;

	private boolean allowVisible;
	private boolean destroyed;

	private HashMap<Integer, TitaniumResultHandler> resultHandlers;
	private AtomicInteger uniqueResultCodeAllocator;
	private static AtomicInteger idGenerator;
	private int initialOrientation;
	private TitaniumLogWatcher logWatcher;

	private ViewAnimator layout;
	private Drawable backgroundDrawable;

	private boolean showingJSError;

	private boolean fullscreen;

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

        views = new ArrayList<ITitaniumView>(5);
        activeViewIndex = -1;

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

		String url = null;

        if (intent != null) {
        	appInfo = intent.getAppInfo(me);
        	windowInfo = intent.getWindowInfo(appInfo);
         	url = tfh.getResourceUrl(intent.getData().toString());
         } else {
        	 if (DBG) {
        		 Log.d(LCAT, "Intent was empty");
        	 }
         }

        TitaniumWebView webView = new TitaniumWebView(me, url);
        webView.setId(idGenerator.incrementAndGet());
        addView(webView);

		layout = new ViewAnimator(this);
		layout.setAnimateFirstView(true);
		AlphaAnimation inAnim = new AlphaAnimation(0.0f, 1.0f);
		inAnim.setDuration(200);
		layout.setInAnimation(inAnim);

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

        ts("end of onCreate");
	}

    public boolean isFullscreen() {
    	TitaniumActivityGroup parent = (TitaniumActivityGroup) getParent();
    	return parent != null ? parent.isFullscreen() : fullscreen;
    }

	public boolean handleMessage(Message msg)
	{
		//Bundle b = msg.getData();

		switch(msg.what) {
			case MSG_START_ACTIVITY :
				startActivity((Intent) msg.obj);
				return true;
			case MSG_ACTIVATE_VIEW : {
				int index = msg.arg1;
				synchronized(views) {
					activeViewIndex = index;
					ITitaniumView tiView = views.get(index);
					View newView = tiView.getNativeView();
					View current = layout.getCurrentView();
					if (current != newView) {
						layout.addView(newView);
						layout.showNext();
						layout.removeView(current);

						if (!current.hasFocus()) {
							current.requestFocus();
						}
					}
				}
				return true;
			}
			/*
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
			*/
			case MSG_CLOSE : {
				finish();
				return true;
			}
		}

		return false;
	}

	public Handler getHandler() {
		return this.handler;
	}

    public TitaniumAppInfo getAppInfo() {
    	return appInfo;
    }

    public TitaniumWindowInfo getWindowInfo() {
    	return windowInfo;
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

		for(ITitaniumView view : views) {
			view.dispatchConfigurationChange(newConfig);
		}
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK && event.getRepeatCount() == 0)) {
        	Log.e(LCAT, "BACK in Activity");
//       	if (webView.canGoBack()) {
//        		webView.goBack();
//        		Log.e(LCAT, "Activity back key and has webView back");
//                return true;
//        	} else {
        		Log.i(LCAT, "Injecting onWindowFocusChanged(false)");
        		onWindowFocusChanged(false);
        		finish();
//        	}
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

		boolean handled = false;

		if (activeViewIndex > -1) {
			ITitaniumView tiView = getActiveView();
			if (tiView != null) {
				handled = tiView.dispatchPrepareOptionsMenu(menu);
			}
		}

		return handled;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item)
	{
		if (DBG) {
			Log.d(LCAT, "onOptionsItemSelected");
		}
		boolean result = super.onOptionsItemSelected(item);

		ITitaniumView tiView = getActiveView();
		if (tiView != null) {
			result = tiView.dispatchOptionsItemSelected(item);
		}

		return result;
	}

/*    public void triggerLoad ()
	{
		if (DBG) {
			Log.d(LCAT, "triggerLoad = " + !loaded);
		}
		if (false == loaded)
		{
			if (!destroyed) {
				handler.obtainMessage(MSG_ACTIVATE_VIEW).sendToTarget();
			} else {
				//webView.destroy();
			}
		}
	}
*/
    // TODO, may return index
    public void addView(ITitaniumView view) {
    	synchronized(views) {
    		// TODO check for multiple adds
    		views.add(view);
    		Log.e(LCAT, "ADDING VIEW: " + view);
    	}
    }

    public ITitaniumView getActiveView()
    {
    	ITitaniumView tiView = null;
    	synchronized(views) {
    		if (activeViewIndex > -1) {
    			tiView = views.get(activeViewIndex);
    		}
    	}
    	return tiView;
    }

    public void setActiveView(int index) {
    	handler.obtainMessage(MSG_ACTIVATE_VIEW, index, -1).sendToTarget();
    }

    public void setActiveView(ITitaniumView tiView) {
    	int index = 0;
    	synchronized(views) {
    		Log.e(LCAT, "LOOKING FOR VIEW: " + tiView);
    		index = views.indexOf(tiView);
    	}
    	setActiveView(index);
    }

    public int getViewCount() {
    	synchronized (views) {
			return views.size();
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
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);

		if (activeViewIndex > -1) {
			ITitaniumView tiView = views.get(activeViewIndex);
			tiView.dispatchWindowFocusChanged(hasFocus);
		}
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

			for(ITitaniumView view : views) {
				ITitaniumLifecycle lifecycle = view.getLifecycle();
				if (lifecycle != null) {
					lifecycle.onResume();
				}
			}
		}
	}

	@Override
	protected void onPause() {
		allowVisible = false;
		super.onPause();
		if (!showingJSError) {
			for(ITitaniumView view : views) {
				ITitaniumLifecycle lifecycle = view.getLifecycle();
				if (lifecycle != null) {
					lifecycle.onPause();
				}
			}

			if (appInfo != null && appInfo.getSystemProperties().getBool(TitaniumAppInfo.PROP_ANDROID_WATCHLOG, false)) {
				logWatcher.detach();
			}
		}
	}

	@Override
	protected void onDestroy() {
		allowVisible = false;
		super.onDestroy();
		if (!showingJSError) {
			for(ITitaniumView view : views) {
				ITitaniumLifecycle lifecycle = view.getLifecycle();
				if (lifecycle != null) {
					lifecycle.onDestroy();
				}
			}
		}
		views.clear();
		destroyed = true;
	}
}
