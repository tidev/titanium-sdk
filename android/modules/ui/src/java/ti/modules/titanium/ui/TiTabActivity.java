/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiActivityWindows;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;

import android.app.TabActivity;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.TabHost;
import android.widget.TabHost.TabContentFactory;

public class TiTabActivity extends TabActivity
{
	private static final String TAG = "TiTabActivity";

	protected TabGroupProxy proxy;
	protected Handler handler;

	public TiTabActivity() {
	}

	public void setTabGroupProxy(TabGroupProxy proxy) {
		this.proxy = proxy;
	}
	
	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending()) {
			super.onCreate(savedInstanceState);
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		if (TiBaseActivity.isUnsupportedReLaunch(this, savedInstanceState)) {
			Log.w(TAG, "Unsupported, out-of-order activity creation. Finishing.");
			super.onCreate(savedInstanceState);
			tiApp.scheduleRestart(250);
			finish();
			return;
		}

		TiApplication.addToActivityStack(this);
		KrollRuntime.incrementActivityRefCount();

		super.onCreate(savedInstanceState);


		int layoutResId = getResources().getIdentifier("titanium_tabgroup", "layout", getPackageName());
		if (layoutResId == 0) {
			throw new IllegalStateException("titanium_tabgroup layout resource not found.  TabGroup cannot be created.");
		}
		Intent intent = getIntent();
		handler = new Handler();

		// Grab the TabHost from the layout and put it in a TiCompositeLayout
		// so we can more easily support things like animation and
		// our tab group being below/above screen.
		TabHost tabHost = (TabHost) LayoutInflater.from(this).inflate(layoutResId, null);
		TiCompositeLayout.LayoutParams tabHostLayout = new TiCompositeLayout.LayoutParams();
		tabHostLayout.autoFillsHeight = true;
		tabHostLayout.autoFillsWidth = true;
		TiCompositeLayout layout = new TiCompositeLayout(this, LayoutArrangement.DEFAULT, proxy);
		layout.addView(tabHost, tabHostLayout);

		boolean fullscreen = false;
		boolean navbar = false;
		Messenger messenger = null;
		Integer messageId = null;
		if (intent != null) {
			if (intent.hasExtra(TiC.PROPERTY_FULLSCREEN)) {
				fullscreen = intent.getBooleanExtra(TiC.PROPERTY_FULLSCREEN, fullscreen);
			}
			if (intent.hasExtra(TiC.PROPERTY_NAV_BAR_HIDDEN)) {
				navbar = !intent.getBooleanExtra(TiC.PROPERTY_NAV_BAR_HIDDEN, navbar);
			}
			if (intent.hasExtra(TiC.INTENT_PROPERTY_MESSENGER)) {
				messenger = (Messenger) intent.getParcelableExtra(TiC.INTENT_PROPERTY_MESSENGER);
				messageId = intent.getIntExtra(TiC.INTENT_PROPERTY_MSG_ID, -1);
			}
			if (intent.hasExtra(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE)) {
				int mode = intent.getIntExtra(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, -1);
				if (mode != -1) {
					Window w = getWindow();
					if (w != null) {
						w.setSoftInputMode(mode);
					}
				}
			}
		}

		if (fullscreen) {
			getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
					WindowManager.LayoutParams.FLAG_FULLSCREEN);
		}

		if (navbar) {
			this.requestWindowFeature(Window.FEATURE_LEFT_ICON); // TODO Keep?
			this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
			this.requestWindowFeature(Window.FEATURE_PROGRESS);
			this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
		} else {
			this.requestWindowFeature(Window.FEATURE_NO_TITLE);
		}

		setContentView(layout);

		// The TabActivity requires that a tab be present and that the tab have
		// some content (at least one View) *before* we get to the point where
		// we load our tabs in TiUiTabGroup.  If there is no tab and content, NPEs
		// occur.  So one bogus tab is created with a bogus view on it.  Then it's
		// replaced with our tabs in TiUITabGroup.
		TabHost.TabSpec tabSpec = tabHost.newTabSpec("ti_empty").setIndicator("");
		tabSpec.setContent(new TabContentFactory()
		{
			@Override
			public View createTabContent(String tag)
			{
				return new View(TiTabActivity.this);
			}
		});
		tabHost.addTab(tabSpec);
		
		// Notify caller that onCreate is done. Use post
		// to prevent deadlock.
		final TiTabActivity me = this;
		final Messenger fMessenger = messenger;
		final int fMessageId = messageId;
		handler.post(new Runnable() {
			@Override
			public void run() {
				if (fMessenger != null) {
					try {
						Message msg = Message.obtain();
						msg.what = fMessageId;
						msg.obj = me;
						if (fMessenger.getBinder().pingBinder()) {
							fMessenger.send(msg);
							Log.d(TAG, "Notifying TiTabGroup, activity is created", Log.DEBUG_MODE);
						} else {
							me.finish();
						}
					} catch (RemoteException e) {
						Log.e(TAG, "Unable to message creator. finishing.");
						me.finish();
					} catch (RuntimeException e) {
						Log.w(TAG, "Run-time exception: " + e.getMessage(), e);
					}
				}
			}
		});
	}

	public TiApplication getTiApp()
	{
		return (TiApplication) getApplication();
	}

	@Override
	public void finish()
	{
		if (proxy != null) {
			KrollDict data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_SOURCE, proxy);
			proxy.fireSyncEvent(TiC.EVENT_CLOSE, data);
		}

		if (shouldFinishRootActivity()) {
			if (getApplication() != null) {
				TiApplication tiApp = getTiApp();
				if (tiApp != null) {
					TiRootActivity rootActivity = tiApp.getRootActivity();
					if (rootActivity != null) {
						rootActivity.finish();
					}
				}
			}
		}
		super.finish();
	}

	@Override
	protected void onPause()
	{
		super.onPause();

		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}
			return;
		}
		TiUIHelper.showSoftKeyboard(getWindow().getDecorView(), false);
		tiApp.setCurrentActivity(this, null);
	}


	@Override
	protected void onResume()
	{
		super.onResume();

		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}
			return;
		}

		tiApp.setCurrentActivity(this, this);
	}

	@Override
	protected void onStop()
	{
		super.onStop();
		KrollRuntime.suggestGC();
	}

	@Override
	protected void onDestroy()
	{
		TiApplication.removeFromActivityStack(this);
		super.onDestroy();

		TiApplication tiApp = getTiApp();

		if (tiApp.isRestartPending()) {
			if (!isFinishing()) {
				finish();
			}
			return;
		}
		

		if (!isFinishing())
		{
			// Our Activities are currently unable to recover from Android-forced restarts,
			// so we need to relaunch the application entirely.
			if (!shouldFinishRootActivity()) {
				Intent intent = getIntent();
				if (intent != null) {
					// Put it in, because we want it to finish root in this case.
					intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, true);
				}
			}
			getTiApp().scheduleRestart(250);
			finish();
			return;
		}

		if (proxy != null) {
			//Remove activityWindows reference from tabs. ActivityWindow reference is only removed when a tab is created (but is added when a tab is added to a tabGroup).
			//Furthermore, when a tabGroup opens, only the current tab is created (the rest won't create until clicked on). This introduces a memory leak when we have multiple tabs,
			//and attempt to open/close tabGroup without navigating through all the tabs.
			TabProxy[] tabs = proxy.getTabs();
			if (tabs != null) {
				for (int i = 0; i < tabs.length; ++i) {
					TiActivityWindows.removeWindow(tabs[i].getWindowId());
				}
			}

			proxy.closeFromActivity();
			proxy = null;
		}

		KrollRuntime.decrementActivityRefCount();
		KrollRuntime.suggestGC();
		handler = null;
	}

	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);
		TiBaseActivity.callOrientationChangedListener(newConfig);
	}
	
	private boolean shouldFinishRootActivity()
	{
		Intent intent = getIntent();
		return (intent.hasExtra(TiC.INTENT_PROPERTY_FINISH_ROOT) && intent.getBooleanExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, false));
	}
}
