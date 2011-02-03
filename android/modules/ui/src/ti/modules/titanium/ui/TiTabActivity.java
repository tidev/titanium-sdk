/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.app.ActivityGroup;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

public class TiTabActivity extends ActivityGroup
	implements ITiWindowHandler
{
	private static final String LCAT = "TiTabActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiCompositeLayout layout;
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
		handler = new Handler();

		Intent intent = getIntent();

		boolean fullscreen = false;
		boolean navbar = false;
		Messenger messenger = null;
		Integer messageId = null;
		String arrangementFromIntent =  "";

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
			if (intent.hasExtra(TiC.INTENT_PROPERTY_LAYOUT)) {
				arrangementFromIntent = intent.getStringExtra(TiC.INTENT_PROPERTY_LAYOUT);
			}
		}
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		if (arrangementFromIntent.equals(TiC.LAYOUT_HORIZONTAL)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		} else if (arrangementFromIntent.equals(TiC.LAYOUT_VERTICAL)) {
			arrangement = LayoutArrangement.VERTICAL;
		}
		layout = new TiCompositeLayout(this, arrangement);

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

	public TiCompositeLayout getLayout()
	{
		return layout;
	}

	@Override
	public void addWindow(View v, LayoutParams params)
	{
		layout.addView(v, params);
	}

	@Override
	public void removeWindow(View v)
	{
		layout.removeView(v);
	}

	@Override
	public void finish()
	{
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.getBooleanExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, false)) {
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
		}
		
		super.finish();
	}

	@Override
	protected void onPause()
	{
		super.onPause();
		getTiApp().setWindowHandler(null);
		((TiApplication) getApplication()).setCurrentActivity(this, null);
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		getTiApp().setWindowHandler(this);
		((TiApplication) getApplication()).setCurrentActivity(this, this);
	}

	@Override
	protected void onDestroy()
	{
		super.onDestroy();
		if (layout != null) {
			layout.removeAllViews();
			layout = null;
		}
		if (proxy != null) {
			proxy.closeFromActivity();
			proxy = null;
		}
		
		handler = null;
	}
}
