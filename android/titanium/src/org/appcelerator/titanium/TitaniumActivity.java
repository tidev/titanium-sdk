/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITabChangeListener;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.module.ui.TitaniumUserWindow;
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
import android.os.Messenger;
import android.os.Process;
import android.os.RemoteException;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Class that controls a mobile Titanium application.
 */

public class TitaniumActivity extends Activity
	implements Handler.Callback, ITabChangeListener
{
	private static final String LCAT = "TiActivity";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final int ACCELEROMETER_DELAY = 100; // send event no more frequently than

	protected static final int MSG_START_ACTIVITY = 300;
	protected static final int MSG_SET_LOAD_ON_PAGE_END = 304;
	protected static final int MSG_CLOSE = 305;
	protected static final int MSG_SETACTIVETAB = 306;
	protected static final int MSG_TABCHANGE = 307;

	protected TitaniumApplication app;
	protected TitaniumIntentWrapper intent;
	protected TitaniumFileHelper tfh;

	protected TitaniumAppInfo appInfo;
	protected TitaniumWindowInfo windowInfo;

	protected boolean loadOnPageEnd;

	protected ImageView splashView;

	protected Handler handler;
	protected Messenger parentMessenger;

	private boolean allowVisible;
	private boolean destroyed;

	private HashMap<Integer, TitaniumResultHandler> resultHandlers;
	private AtomicInteger uniqueResultCodeAllocator;
	private int initialOrientation;
	private TitaniumLogWatcher logWatcher;

	private Drawable backgroundDrawable;

	private boolean showingJSError;

	private boolean fullscreen;

	TitaniumUserWindow userWindow;

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

        final TitaniumActivity me = this;

        tfh = new TitaniumFileHelper(this);
        intent = new TitaniumIntentWrapper(getIntent());

        parentMessenger = (Messenger) getIntent().getExtras().getParcelable("ParentMessenger");

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

		resultHandlers = new HashMap<Integer, TitaniumResultHandler>();
		uniqueResultCodeAllocator = new AtomicInteger();

		this.userWindow = new TitaniumUserWindow(this);
		userWindow.attachWebView(url);

        loadOnPageEnd = true;

        ts("After getApplication()");

        Thread backgroundDrawableThread = null;

        if (app.needsSplashScreen()) {
	        String backgroundImage = "default.png";
	        final String fBackgroundImage = backgroundImage;
	    	if(windowInfo != null && windowInfo.hasWindowBackgroundImage()) {
	    		backgroundImage = windowInfo.getWindowBackgroundImage();
	    	}

	        backgroundDrawableThread = new Thread(new Runnable(){

				public void run() {
					backgroundDrawable = tfh.loadDrawable(fBackgroundImage, false); // Ok to not have background
				}});
	        backgroundDrawableThread.start();
        }

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

		splashView=new ImageView(this);
		splashView.setScaleType(ImageView.ScaleType.FIT_XY);

		if (backgroundDrawableThread != null) {
			try {
				backgroundDrawableThread.join();
			} catch (InterruptedException e) {
				Log.w(LCAT, "Interrupted");
			}

			if (backgroundDrawable != null) {
				((BitmapDrawable) backgroundDrawable).setGravity(Gravity.TOP);
				splashView.setImageDrawable(backgroundDrawable);
			}
			userWindow.addView(splashView);
			app.setNeedsSplashScreen(false);
		}

		ts("After splash");

		if (root instanceof TitaniumActivityGroup) {
	    	TitaniumActivityGroup tag = (TitaniumActivityGroup) root;
	    	if (tag != null && tag.isTabbed()) {
	    		tag.addTabChangeListener(this);
	    	}
		}

		setContentView(userWindow);

        ts("end of onCreate");
	}

    public boolean isFullscreen() {
    	TitaniumActivityGroup parent = (TitaniumActivityGroup) getParent();
    	return parent != null ? parent.isFullscreen() : fullscreen;
    }

	public boolean handleMessage(Message msg)
	{
		switch(msg.what) {
			case MSG_START_ACTIVITY :
				Messenger messenger = new Messenger(handler);
				Intent intent = (Intent) msg.obj;
				intent.putExtra("ParentMessenger", messenger);
				startActivity(intent);
				return true;

			case MSG_CLOSE : {
				finish();
				return true;
			}
			case MSG_SETACTIVETAB : {
				Activity activity  = TitaniumActivityHelper.getRootActivity(this);
				if (activity instanceof TitaniumActivityGroup) {
			    	TitaniumActivityGroup tag = (TitaniumActivityGroup) activity;
			    	if (tag != null) {
			    		tag.setActiveTab(msg.arg1);
			    	}
				} else if (parentMessenger != null) {
					try {
						parentMessenger.send(Message.obtain(msg));
					} catch (RemoteException e) {
						Log.e(LCAT, "Error sending message to parent handler: ", e);
					} finally {
						finish();
					}
				}
		    	return true;
			}
			case MSG_TABCHANGE : {
				String data = (String) msg.obj;
				userWindow.dispatchTabChange(data);
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

    public TitaniumUserWindow getCurrentWindow() {
    	return userWindow;
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
		userWindow.dispatchConfigurationChange(newConfig);
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK && event.getRepeatCount() == 0)) {
        	if (DBG) {
        		Log.d(LCAT, "BACK in Activity");
        	}
    		Log.i(LCAT, "Injecting onWindowFocusChanged(false)");
    		onWindowFocusChanged(false);
    		finish();
    		return false;
        } if (event.getKeyCode() == KeyEvent.KEYCODE_MENU && event.getRepeatCount() == 0) {
				getWindow().openPanel(Window.FEATURE_OPTIONS_PANEL, event);
				return true;
		}else {
        	return super.onKeyDown(keyCode, event);
        }
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

		return userWindow.dispatchPrepareOptionsMenu(menu);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item)
	{
		if (DBG) {
			Log.d(LCAT, "onOptionsItemSelected");
		}
		boolean result = super.onOptionsItemSelected(item);
		if (!result) {
			result = userWindow.dispatchOptionsItemSelected(item);
		}

		return result;
	}

    public void setActiveTab(int index) {
    	handler.obtainMessage(MSG_SETACTIVETAB, index, -1).sendToTarget();
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

		getCurrentWindow().onWindowFocusChanged(hasFocus);
	}

	public void onTabChange(String data) {
		handler.obtainMessage(MSG_TABCHANGE, data).sendToTarget();
	}

	@Override
	public void setTitle(CharSequence title) {
		Activity a = TitaniumActivityHelper.getRootActivity(this);
		if (a instanceof TitaniumActivityGroup) {
			a.setTitle(title);
		} else {
			super.setTitle(title);
		}
	}

	@Override
	protected void onResume()
	{
		allowVisible = true;
		super.onResume();
		userWindow.onResume();
	}

	@Override
	protected void onPause() {
		allowVisible = false;
		super.onPause();
		userWindow.onPause();
	}

	@Override
	protected void onDestroy() {
		allowVisible = false;
		Activity activity = TitaniumActivityHelper.getRootActivity(this);
		if (activity instanceof TitaniumActivityGroup) {
	    	TitaniumActivityGroup tag = (TitaniumActivityGroup) activity;
	    	if (tag != null && tag.isTabbed()) {
	    		tag.removeTabChangeListener(this);
	    	}
	    }

		super.onDestroy();
		userWindow.onDestroy();

		destroyed = true;
	}
}
