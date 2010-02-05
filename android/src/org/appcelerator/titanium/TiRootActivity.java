/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;

import android.app.Activity;
import android.app.ActivityGroup;
import android.app.LocalActivityManager;
import android.content.Intent;
import android.os.Bundle;
import android.view.Window;

public class TiRootActivity extends ActivityGroup
	implements TiActivitySupport
{

	protected TiContext tiContext;
	protected TiActivitySupportHelper supportHelper;

	public static class TiActivityRef
	{
		public String key;
		public Activity activity;
	}

	public TiRootActivity() {
		super(true); // Allow multiple activities
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		Log.checkpoint("checkpoint, on root activity create.");

		TiApplication host = getTiApp();
		host.setRootActivity(this);

		tiContext = TiContext.createTiContext(this, null);

		runOnUiThread(new Runnable(){

			public void run() {
				try {
					//krollBridge.evalFile(host.getStartUrl());
					tiContext.evalFile("app.js");
				} catch (IOException e) {
					// TODO be more helpful
					e.printStackTrace();
					finish();
				}

			}
		});
	}

	protected TiApplication getTiApp() {
		return (TiApplication) getApplication();
	}

	public TiActivityRef launchActivity(String key)
	{
		TiActivityRef ref = new TiActivityRef();

		LocalActivityManager lam = getLocalActivityManager();
		Activity activity = lam.getActivity(key);
		if (activity == null) {
			Intent intent = new Intent(this, TiActivity.class);
			Window w = lam.startActivity(key, intent);
			activity = lam.getActivity(key);
			//this.setContentView(w.getDecorView());
		}
		ref.activity = activity;
		ref.key = key;

		return ref;
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
