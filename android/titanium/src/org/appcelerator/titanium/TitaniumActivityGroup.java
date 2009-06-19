/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.util.ArrayList;
import java.util.Stack;

import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEventFactory;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumUIHelper;

import android.app.Activity;
import android.app.ActivityGroup;
import android.content.Intent;
import android.os.Bundle;
import android.util.Config;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.widget.TextView;
import android.widget.Toast;

public class TitaniumActivityGroup extends ActivityGroup
{
	private static final String LCAT = "TiActivityGrp";
	private static final boolean DBG = Config.LOGD;

	protected TitaniumApplication app;

	public TitaniumActivityGroup() {
	}

	public TitaniumActivityGroup(boolean singleActivityMode) {
		super(singleActivityMode);
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

        try {
        	app = (TitaniumApplication) getApplication();
        	app.pushActivityStack();
        } catch (ClassCastException e) {
        	Log.e(LCAT, "Configuration problem: " + e.getMessage(), e);
        	setContentView(new TextView(this));
        	fatalDialog(
        			"Unable to cast Application object to TitaniumApplication." +
        			" Check AndroidManfest.xml for android:name attribute on application element."
        	);
        	return;
        }

		TitaniumAppInfo appInfo = app.getAppInfo();

		ArrayList<TitaniumWindowInfo> windows = appInfo.getWindows();

		int numWindows = windows.size();

		if (numWindows == 0) {
			fatalDialog("tiapp.xml needs at least one window");
			return;
		}

		String type = "single";
		if (numWindows > 1) {
			type = "tabbed";
		}

		Class<?> activity = TitaniumApplication.getActivityForType(type);

		TitaniumIntentWrapper appIntent = new TitaniumIntentWrapper(new Intent(this, activity));
		if (numWindows == 1) {
			TitaniumWindowInfo info = windows.get(0);
			appIntent.setWindowId(info.getWindowId());
			if (info.isWindowFullscreen()) {
				this.requestWindowFeature(Window.FEATURE_NO_TITLE);
			} else {
		        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
		        this.requestWindowFeature(Window.FEATURE_PROGRESS);
		        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
			}
		} else {
			appIntent.setWindowId(TitaniumIntentWrapper.ACTIVITY_PREFIX +"TABBED-ROOT");
		}

		launch(appIntent);
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

		Stack<LocalActivityInfo> stack = app.getActivityStack();
		LocalActivityInfo top = null;
		if (!stack.isEmpty()) {
			top = stack.peek();
		}
		if (top == null || !top.getActivityId().equals(name)) {
			stack.push(new LocalActivityInfo(name, intent));
			if (DBG) {
				Log.d(LCAT, "Pushing new activity on stack: " + name);
			}
		} else {
			if (Config.LOGD) {
				Log.d(LCAT, "Activity already exists on top: activity name=" + name);
			}
		}
		activateActivity(stack.peek());
	}

	public void activateActivity(LocalActivityInfo lai) {
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
		if (DBG) {
			Log.d(LCAT, "OnPause ******** depth: " + getStackDepth());
		}
	}

	@Override
	protected void onResume() {
		super.onResume();
		if (DBG) {
			Log.d(LCAT, "OnResume ******** depth: " + getStackDepth());
		}
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		((TitaniumApplication)getApplication()).postAnalyticsEvent(TitaniumAnalyticsEventFactory.createAppEndEvent());
	}

	private int getStackDepth() {
		int size = -1;
		try {
			Stack<LocalActivityInfo> stack = ((TitaniumApplication) getApplication()).getActivityStack();
			if (stack != null) {
				size = stack.size();
			}
		} catch (ClassCastException e) {
			// Ignore
		}
		return size;
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event)
	{
        if ((event.getKeyCode() == KeyEvent.KEYCODE_BACK &&
        		event.getAction() == KeyEvent.ACTION_DOWN))
        {

        	Stack<LocalActivityInfo> activityStack  = app.getActivityStack();
    		LocalActivityInfo activityInfo = activityStack.pop();

    		if (DBG) {
    			Log.d(LCAT, "Popping current activity off of stack: " + activityInfo.getActivityId());
    		}

    		if (activityStack.isEmpty()) {
    			if (!app.isLastActivityStack()) {
    				app.popActivityStack();
    	    		activityStack = app.getActivityStack();
    			} else {
    				//activityStack.push(activityInfo);
    				//return true;
    			}
    			if (DBG) {
    				Log.d(LCAT, "not Pushing root activity back on stack: " + activityInfo.getActivityId());
    			}
    		}

    		if (activityStack.size() > 0) {
    			getLocalActivityManager().destroyActivity(activityInfo.getActivityId(), true);

           		activateActivity(activityStack.peek());
                return true;
    		}
        }

		return super.dispatchKeyEvent(event);
	}

	@Override
	public void finishFromChild(Activity child) {
    	Stack<LocalActivityInfo> activityStack  = app.getActivityStack();
		LocalActivityInfo activityInfo = activityStack.pop();

		if (DBG) {
			Log.d(LCAT, "Popping current activity off of stack: " + activityInfo.getActivityId());
		}

		if (activityStack.isEmpty()) {
			if (!app.isLastActivityStack()) {
				app.popActivityStack();
	    		activityStack = app.getActivityStack();
			} else {
				//activityStack.push(activityInfo);
				//return true;
			}
			if (DBG) {
				Log.d(LCAT, "not Pushing root activity back on stack: " + activityInfo.getActivityId());
			}
		}

		if (activityStack.size() > 0) {
			getLocalActivityManager().destroyActivity(activityInfo.getActivityId(), true);

       		activateActivity(activityStack.peek());
		} else {
			getLocalActivityManager().destroyActivity(activityInfo.getActivityId(), false);
		}


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
