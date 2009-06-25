/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.IOException;
import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEventFactory;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.appcelerator.titanium.util.TitaniumUrlHelper;

import android.app.Activity;
import android.app.ActivityGroup;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.widget.TextView;
import android.widget.Toast;

public class TitaniumActivityGroup extends ActivityGroup
{
	private static final String LCAT = "TiActivityGrp";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected TitaniumApplication app;
	protected TitaniumAppInfo appInfo;
	protected ITitaniumAppStrategy appStrategy;

	public TitaniumActivityGroup() {
	}

	public TitaniumActivityGroup(boolean singleActivityMode) {
		super(singleActivityMode);
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		if (DBG) {
			Log.d(LCAT,"onCreate");
		}
		super.onCreate(savedInstanceState);

        try {
        	app = (TitaniumApplication) getApplication();
        } catch (ClassCastException e) {
        	Log.e(LCAT, "Configuration problem: " + e.getMessage(), e);
        	setContentView(new TextView(this));
        	fatalDialog(
        			"Unable to cast Application object to TitaniumApplication." +
        			" Check AndroidManfest.xml for android:name attribute on application element."
        	);
        	return;
        }

		this.appInfo = app.getAppInfo();

		final ArrayList<TitaniumWindowInfo> windows = appInfo.getWindows();

		TitaniumWindowInfo info = windows.get(0);
		final TitaniumFileHelper tfh = new TitaniumFileHelper(this.getApplicationContext());
		Thread sourceThread = new Thread(new Runnable(){

			public void run() {
				for (TitaniumWindowInfo wi : windows) {
					String url = tfh.getResourceUrl(null, wi.getWindowUrl());
					try {
						app.setSourceFor(url, TitaniumUrlHelper.getSource(app, app.getApplicationContext(), url, null));
					} catch (IOException e) {
						Log.e(LCAT, "Unable to pre-load source for " + url);
					}
				}
			}});
		sourceThread.start();

		if (info.isWindowFullscreen()) {
			this.requestWindowFeature(Window.FEATURE_NO_TITLE);
		} else {
	        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
	        this.requestWindowFeature(Window.FEATURE_PROGRESS);
	        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
		}

		int numWindows = windows.size();

		if (numWindows == 0) {
			fatalDialog("tiapp.xml needs at least one window");
			return;
		}

		if (numWindows > 1) {
			appStrategy = new TitaniumTabbedAppStrategy();
		} else {
			appStrategy = new TitaniumSingleRootStrategy();
		}

		appStrategy.onCreate(this, savedInstanceState);
	}

	public void launch(Intent intent) {
		launch(new TitaniumIntentWrapper(intent));
	}

	public void launch(TitaniumIntentWrapper intent)
	{
		String name = intent.getWindowId();

		if (!intent.isAutoNamed()) {
			TitaniumAppInfo appInfo = app.getAppInfo();
			TitaniumWindowInfo window = appInfo.findWindowInfo(name);
			if (window == null) {
				Toast.makeText(this.getCurrentActivity(), "Window with name " + intent.getWindowId() + "not found in tiapp.xml", Toast.LENGTH_LONG).show();
				return;
			}
			intent.updateUsing(window);
		}

		activateActivity(new LocalActivityInfo(name, intent));
	}

	public void activateActivity(LocalActivityInfo lai)
	{
		String name = lai.getActivityId();
		TitaniumIntentWrapper intent = lai.getIntent();

		Window w = getLocalActivityManager().startActivity(name, intent.getIntent());
		if (DBG) {
			Log.d(LCAT, "Bringing new activity into view: " + name);
		}

		if (w == null) {
			Log.e(LCAT, "NULL WINDOW");
		}

		View v = w.getDecorView();

		if (v == null) {
			Log.e(LCAT, "NULL VIEW");
		}
		setContentView(w.getDecorView());
	}

	@Override
	protected void onNewIntent(Intent intent) {
		if (DBG) {
			Log.d(LCAT, "OnNewIntent ********");
		}
	}

	@Override
	protected void onSaveInstanceState(Bundle outState) {
		if (DBG) {
			Log.d(LCAT, "onSaveInstanceState ********");
		}
		super.onSaveInstanceState(outState);
	}

	@Override
	protected void onPause() {
		super.onPause();
	}

	@Override
	protected void onResume() {
		super.onResume();
	}

	@Override
	protected void onDestroy() {
		((TitaniumApplication)getApplication()).postAnalyticsEvent(TitaniumAnalyticsEventFactory.createAppEndEvent());
		super.onDestroy();
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event)
	{
		/*
        if ((event.getKeyCode() == KeyEvent.KEYCODE_BACK &&
        		event.getAction() == KeyEvent.ACTION_DOWN))
        {
        	Log.e(LCAT, "DISPATCH: BACK");
         	LocalActivityInfo activityInfo = null;
    		if (!activityStack.isEmpty()) {
        		 activityInfo = activityStack.pop();

        		if (DBG) {
        			Log.d(LCAT, "Popping current activity off of stack: " + activityInfo.getActivityId());
        		}
    		}

    		if (activityStack.size() > 0) {
    			//getLocalActivityManager().destroyActivity(activityInfo.getActivityId(), true);

           		activateActivity(activityStack.peek());
                //return true;
    		}

        }*/
		return super.dispatchKeyEvent(event);
	}

	@Override
	public void finishFromChild(Activity child) {
		Log.e(LCAT, "finishFromChild");
		//super.finishFromChild(child);
	}
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		Log.e(LCAT, " Activity Group Received Result!");
		super.onActivityResult(requestCode, resultCode, data);
	}

	private void fatalDialog(String message)
	{
		final TitaniumActivityGroup me = this;

    	TitaniumUIHelper.doOkDialog(
    			this,
    			"Fatal",
    			message,
    			TitaniumUIHelper.createFinishListener(me)
    			);
    	return;
	}
}
