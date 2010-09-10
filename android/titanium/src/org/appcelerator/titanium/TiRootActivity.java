/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.lang.ref.SoftReference;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.app.Activity;
import android.app.ActivityGroup;
import android.app.LocalActivityManager;
import android.content.Intent;
import android.os.Bundle;
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

		TiApplication host = getTiApp();
		host.setRootActivity(this);
		tiContext = TiContext.createTiContext(this, null);

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

		tiContext.dispatchOnStart();
	}

	@Override
	protected void onResume() {
		super.onResume();
		Log.checkpoint("checkpoint, on root activity resume.");
		tiContext.dispatchOnResume();
	}

	@Override
	protected void onPause() {
		super.onPause();

		tiContext.dispatchOnPause();
	}

	@Override
	protected void onStop() {
		super.onStop();

		tiContext.dispatchOnStop();
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();

		tiContext.dispatchOnDestroy();
	}
}
