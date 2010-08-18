/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.lang.ref.SoftReference;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.R.color;
import android.app.Activity;
import android.app.ActivityGroup;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.LocalActivityManager;
import android.app.PendingIntent;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.DialogInterface.OnClickListener;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Process;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

public class TiRootActivity extends ActivityGroup
	implements TiActivitySupport, ITiWindowHandler
{
	private static final String LCAT = "TiRootActivity";
	private static final boolean DBG = TiConfig.LOGD;

	private static AtomicInteger windowIdGenerator;

	protected TiContext tiContext;
	protected TiActivitySupportHelper supportHelper;
	protected TiCompositeLayout rootLayout;
	protected SoftReference<ITiMenuDispatcherListener> softMenuDispatcher;
	
	private AlertDialog b2373Alert;

	public static class TiActivityRef
	{
		public String key;
		public Activity activity;
	}

	public TiRootActivity() {
		super(true); // Allow multiple activities
		windowIdGenerator = new AtomicInteger(0);
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		Log.checkpoint("checkpoint, on root activity create.");
		if (DBG) {
			Log.e(LCAT, "Instance Count: " + getInstanceCount());
		}
		
		Intent intent = getIntent();
		if (intent != null) {
			String action = intent.getAction();
			if (action != null && action.equals(Intent.ACTION_MAIN)) {
				Set<String> categories = intent.getCategories();
				boolean b2373Detected = true; //Absence of LAUNCHER is the problem.
				if (categories != null) {
					for(String category : categories) {
						if (category.equals(Intent.CATEGORY_LAUNCHER)) {
							b2373Detected = false;
							break;
						}
					}
				}
				
				if(b2373Detected) {
					Log.e(LCAT, "Android issue 2373 detected, restarting app. Instances: " + getInstanceCount());
					rootLayout = new TiCompositeLayout(this, false);
					setContentView(rootLayout);
					return;
				}
			}
		}
		
		TiApplication host = getTiApp();
		host.setRootActivity(this);
		tiContext = TiContext.createTiContext(this, null, null);

		 if (host.getAppInfo().isFullscreen()) {
			getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
					WindowManager.LayoutParams.FLAG_FULLSCREEN);
		}

		if (!host.getAppInfo().isNavBarHidden()) {
			this.requestWindowFeature(Window.FEATURE_LEFT_ICON); // TODO Keep?
			this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
			this.requestWindowFeature(Window.FEATURE_PROGRESS);
			this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
		} else {
			this.requestWindowFeature(Window.FEATURE_NO_TITLE);
		}

		rootLayout = new TiCompositeLayout(this, false);
		setContentView(rootLayout);

		new Thread(new Runnable(){

			@Override
			public void run() {
				try {
					if (DBG) {
						Log.i(LCAT, "eval app.js");
					}
					tiContext.evalFile("app://app.js");
				} catch (IOException e) {
					e.printStackTrace();
					finish();
				}
			}}).start();

		Log.e("ROOT", "Leaving TiRootActivity.onCreate");
	}

	protected TiApplication getTiApp() {
		return (TiApplication) getApplication();
	}

	public String openWindow(Intent intent)
	{
		LocalActivityManager lam = getLocalActivityManager();

		String windowId = "window$$" + windowIdGenerator.incrementAndGet();
		lam.startActivity(windowId, intent);
		return windowId;
	}

	public void addWindow(String windowId, LayoutParams params)
	{
		LocalActivityManager lam = getLocalActivityManager();
		Activity activity = lam.getActivity(windowId);
		if (activity != null) {
			View decor = activity.getWindow().getDecorView();
			rootLayout.addView(decor, params);
		}
	}

	public void addWindow(View v, LayoutParams params) {
		rootLayout.addView(v, params);
	}

	public void closeWindow(String windowId) {
		LocalActivityManager lam = getLocalActivityManager();
		Activity activity = lam.getActivity(windowId);
		if (activity != null) {
			View decor = activity.getWindow().getDecorView();
			rootLayout.removeView(decor);
		}
		lam.destroyActivity(windowId, true);
	}

	public void removeWindow(View v) {
		rootLayout.removeView(v);
	}

	// Activity Support
	public int getUniqueResultCode() {
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		return supportHelper.getUniqueResultCode();
	}

	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler resultHandler)
	{
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		supportHelper.launchActivityForResult(intent, code, resultHandler);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);

		supportHelper.onActivityResult(requestCode, resultCode, data);
	}

	@Override
	public void finish() {
		// TODO Auto-generated method stub
		super.finish();
	}

   public void setMenuDispatchListener(ITiMenuDispatcherListener dispatcher) {
    	softMenuDispatcher = new SoftReference<ITiMenuDispatcherListener>(dispatcher);
    }

	@Override
	public boolean onCreateOptionsMenu(Menu menu)
	{
		if (softMenuDispatcher != null) {
			ITiMenuDispatcherListener dispatcher = softMenuDispatcher.get();
			if (dispatcher != null) {
				return dispatcher.dispatchHasMenu();
			}
		}
		return super.onCreateOptionsMenu(menu);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		if (softMenuDispatcher != null) {
			ITiMenuDispatcherListener dispatcher = softMenuDispatcher.get();
			if (dispatcher != null) {
				return dispatcher.dispatchMenuItemSelected(item);
			}
		}
		return super.onOptionsItemSelected(item);
	}

	@Override
	public boolean onPrepareOptionsMenu(Menu menu) {
		if (softMenuDispatcher != null) {
			ITiMenuDispatcherListener dispatcher = softMenuDispatcher.get();
			if (dispatcher != null) {
				return dispatcher.dispatchPrepareMenu(menu);
			}
		}
		return super.onPrepareOptionsMenu(menu);
	}

//	@Override
//	public void finishFromChild(Activity child) {
//		//super.finishFromChild(child);
//		finish();
//	}

	// Lifecyle
	@Override
	protected void onStart() {
		super.onStart();

		if (tiContext != null) {
			tiContext.dispatchOnStart();
		}
	}

	
	@Override
	protected void onRestart() {
		super.onRestart();
		TiProperties systemProperties = getTiApp().getSystemProperties();
		boolean restart = systemProperties.getBool("ti.android.root.reappears.restart", false);
		if (restart) {
			Log.w(LCAT, "Tasks may have been destroyed by Android OS for inactivity. Restarting.");
			restartApp(buildLaunchIntent(), 250);
		}
	}

	@Override
	protected void onResume() {
		super.onResume();
		Log.checkpoint("checkpoint, on root activity resume.");
		if (tiContext != null) {
			tiContext.dispatchOnResume();
		} else {
			// No context, we have a launch problem.

			TiProperties systemProperties = getTiApp().getSystemProperties();
			String backgroundColor = systemProperties.getString("ti.android.bug2373.backgroundColor", "black");
			rootLayout.setBackgroundColor(TiColorHelper.parseColor(backgroundColor));
			
			final Intent relaunch = buildLaunchIntent();
			
			OnClickListener restartListener = new OnClickListener() {	
				@Override
				public void onClick(DialogInterface arg0, int arg1) {
					restartApp(relaunch, 500);
				}
			};
			
			String title = systemProperties.getString("ti.android.bug2373.title", "Restart Required");
			String message = systemProperties.getString("ti.android.bug2373.message", "An application restart is required");
			String buttonText = systemProperties.getString("ti.android.bug2373.buttonText", "Continue");
			
			b2373Alert = new AlertDialog.Builder(this)
	        .setTitle(title)
	        .setMessage(message)
	        .setPositiveButton(buttonText, restartListener)
	        .setCancelable(false)
 	        .create();
			
			b2373Alert.show();
		}
	}
	
	private Intent buildLaunchIntent() 
	{
		Intent intent = new Intent(getApplicationContext(), getClass());
		intent.setAction(Intent.ACTION_MAIN);
		intent.addCategory(Intent.CATEGORY_LAUNCHER);
		
		return intent;
	}

	private void restartApp(Intent relaunch, int delay) {
		AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
		if (am != null) {
			PendingIntent pi = PendingIntent.getActivity(getApplicationContext(), 0, relaunch, PendingIntent.FLAG_ONE_SHOT);
			am.set(AlarmManager.RTC, System.currentTimeMillis() + delay, pi);
		}
		finish();						
	}
	
	@Override
	protected void onPause() {
		super.onPause();

		if (tiContext != null) {
			tiContext.dispatchOnPause();
		} else {
			// Not in a good state. Let's get out.
			if (b2373Alert != null && b2373Alert.isShowing()) {
				b2373Alert.cancel();
				b2373Alert = null;
			}
			finish();
		}
	}

	@Override
	protected void onStop() {
		super.onStop();

		if (tiContext != null) {
			tiContext.dispatchOnStop();
		}
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();

		if (tiContext != null) {
			tiContext.dispatchOnDestroy();
			TiModule.clearModuleSingletons();
		}
	}
}
