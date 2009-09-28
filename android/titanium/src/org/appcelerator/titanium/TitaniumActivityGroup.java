/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.titanium.api.ITabChangeListener;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.module.analytics.TitaniumAnalyticsEventFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.appcelerator.titanium.util.TitaniumUrlHelper;

import android.app.Activity;
import android.app.ActivityGroup;
import android.content.Intent;
import android.os.Bundle;
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

	protected boolean fullscreen;

	protected String lastTabChangeData;

	protected ArrayList<WeakReference<ITabChangeListener>> tabChangeListeners;

	public TitaniumActivityGroup() {
	}

	public TitaniumActivityGroup(boolean singleActivityMode) {
		super(singleActivityMode);
		fullscreen = false;
		lastTabChangeData = null;
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

		final TitaniumWindowInfo info = windows.get(0);
		final TitaniumFileHelper tfh = new TitaniumFileHelper(this.getApplicationContext());

		Thread initialSourceThread = new Thread(new Runnable(){
			public void run() {
				String url = tfh.getResourceUrl(info.getWindowUrl());
				try {
					app.setSourceFor(url, TitaniumUrlHelper.getSource(app, app.getApplicationContext(), url, null));
				} catch (IOException e) {
					Log.e(LCAT, "Unable to pre-load source for " + url);
				}
			}});
		initialSourceThread.setPriority(Thread.NORM_PRIORITY);
		initialSourceThread.start();

		final int len = windows.size();

		if (len > 1) {
			Thread sourceThread = new Thread(new Runnable(){
				public void run() {
					try {
						Thread.sleep(1000);
					} catch (InterruptedException e) {
						Log.w(LCAT, "Secondary source cache thread interrupted");
					}
					for (int i = 1; i < len; i++) {
						String url = tfh.getResourceUrl(windows.get(i).getWindowUrl());
						try {
							app.setSourceFor(url, TitaniumUrlHelper.getSource(app, app.getApplicationContext(), url, null));
						} catch (IOException e) {
							Log.e(LCAT, "Unable to pre-load source for " + url);
						}
					}
				}});
			sourceThread.setPriority(Thread.MIN_PRIORITY);
			sourceThread.start();
		}

		if (info.isWindowFullscreen()) {
			this.requestWindowFeature(Window.FEATURE_NO_TITLE);
			fullscreen = true;
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
			tabChangeListeners = new ArrayList<WeakReference<ITabChangeListener>>();
		} else {
			appStrategy = new TitaniumSingleRootStrategy();
		}

		appStrategy.onCreate(this, savedInstanceState);
	}

	public void setActiveTab(int index) {
		if (appStrategy instanceof TitaniumTabbedAppStrategy) {
			TitaniumTabbedAppStrategy strategy = (TitaniumTabbedAppStrategy) appStrategy;
			strategy.setActiveTab(index);
		} else {
			Log.w(LCAT, "Attempt to switch tabs on non tabbed application ignored");
		}
	}

	public boolean isFullscreen() {
		return fullscreen;
	}

	public boolean isTabbed() {
		return appStrategy instanceof TitaniumTabbedAppStrategy;
	}

	public String getLastTabChange() {
		return lastTabChangeData;
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

	public void addTabChangeListener(ITabChangeListener listener)
	{
		if (tabChangeListeners != null) {
			synchronized(tabChangeListeners) {
				WeakReference<ITabChangeListener> weakListener = new WeakReference<ITabChangeListener>(listener);
				tabChangeListeners.add(weakListener);
			}
		} else {
			Log.w(LCAT, "Not a tabbed application, addTabChangeListener ignored.");
		}
	}

	public void removeTabChangeListener(ITabChangeListener listener) {
		// This is messier since the we have to iterate the weak references
		// and then compare.
		if (tabChangeListeners != null) {
			synchronized(tabChangeListeners) {
				for(WeakReference<ITabChangeListener> weakListener : tabChangeListeners) {
					ITabChangeListener l = weakListener.get();
					if (l != null && l.equals(listener)) {
						tabChangeListeners.remove(weakListener);
						break;
					}
				}
			}
		} else {
			Log.w(LCAT, "Not a tabbed application, removeTabChangeListener ignored.");
		}
	}

	public void dispatchTabChange(String data)
	{
		if (tabChangeListeners != null) {
			lastTabChangeData = data;
			synchronized (tabChangeListeners) {
				ArrayList<WeakReference<ITabChangeListener>> cleanupList = null;

				for(WeakReference<ITabChangeListener> weakListener : tabChangeListeners) {
					ITabChangeListener l = weakListener.get();
					if (l != null) {
						try {
							l.onTabChange(data);
						} catch (Throwable t) {
							Log.e(LCAT, "Error while invoking tabchange listener: ",t);
						}
					} else {
						if (cleanupList == null) {
							cleanupList = new ArrayList<WeakReference<ITabChangeListener>>();
						}
						cleanupList.add(weakListener);
					}
				}

				if (cleanupList != null) {
					for (WeakReference<ITabChangeListener> weakListener : cleanupList) {
						tabChangeListeners.remove(weakListener);
					}
					Log.i(LCAT, "Removed " + cleanupList.size() + " tabchange listeners the were no longer available");
				}
			}
		} else {
			Log.w(LCAT, "Not a tabbed application, dispatchTabChange ignored.");
		}
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
		boolean handled = super.dispatchKeyEvent(event);

		if(!handled) {
			handled = getCurrentActivity().dispatchKeyEvent(event);
		}

		return handled;
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
