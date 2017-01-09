/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.content.Intent;
import android.os.Bundle;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.proxy.IntentProxy;

public class TiActivity extends TiBaseActivity
{

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		Intent intent = getIntent();
		if (intent == null) {
			return;
		}
	}

	@Override
	protected void onDestroy()
	{
		fireOnDestroy();
		super.onDestroy();
	}

	@Override
	protected void onResume()
	{
		TiRootActivity rootActivity = getTiApp().getRootActivity();
		if (rootActivity != null) {
			Intent rootIntent = rootActivity.getIntent();

			// merge root intent extras
			if (rootIntent != null) {
				Intent intent = getIntent();
				if (intent.getComponent().getClassName().equals(TiActivity.class.getName())) {
					intent.putExtras(rootIntent);
					setIntent(intent);

					// fire 'newintent'
					IntentProxy intentProxy = new IntentProxy(intent);
					KrollDict data = new KrollDict();
					data.put(TiC.PROPERTY_INTENT, intentProxy);
					rootActivity.getActivityProxy().fireSyncEvent(TiC.EVENT_NEW_INTENT, data);
				}
			}
		}
		super.onResume();
		if (getTiApp().isRestartPending()) {
			return;
		}
	}

	@Override
	protected void onPause()
	{
		super.onPause();

		if (getTiApp().isRestartPending()) {
			return;
		}
	}

}
