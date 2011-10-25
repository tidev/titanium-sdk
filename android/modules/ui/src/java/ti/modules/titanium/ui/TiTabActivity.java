/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiRootActivity;

import android.app.TabActivity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.TabHost;
import android.widget.TabHost.TabContentFactory;

public class TiTabActivity extends TabActivity
{
	private static final String LCAT = "TiTabActivity";
	private static final boolean DBG = TiConfig.LOGD;

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
		super.onCreate(savedInstanceState);
		int layoutResId = getResources().getIdentifier("titanium_tabgroup", "layout", getPackageName());
		if (layoutResId == 0) {
			throw new IllegalStateException("titanium_tabgroup layout resource not found.  TabGroup cannot be created.");
		}
		handler = new Handler();

		Intent intent = getIntent();

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

		setContentView(layoutResId);
		TabHost tabHost = getTabHost();

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
							Log.w(LCAT, "Notifying TiTabGroup, activity is created");
						} else {
							me.finish();
						}
					} catch (RemoteException e) {
						Log.e(LCAT, "Unable to message creator. finishing.");
						me.finish();
					} catch (RuntimeException e) {
						Log.w(LCAT, "Run-time exception: " + e.getMessage(), e);
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
		((TiApplication) getApplication()).setCurrentActivity(this, null);
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		((TiApplication) getApplication()).setCurrentActivity(this, this);
	}

	@Override
	protected void onDestroy()
	{
		super.onDestroy();
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
			proxy.closeFromActivity();
			proxy = null;
		}
		
		handler = null;
	}
	private boolean shouldFinishRootActivity()
	{
		Intent intent = getIntent();
		return (intent.hasExtra(TiC.INTENT_PROPERTY_FINISH_ROOT) && intent.getBooleanExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, false));
	}
}
