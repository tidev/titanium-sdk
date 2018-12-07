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
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.IntentProxy;

/** The activity that is shown when opening a Titanium "Ti.UI.Window" in JavaScript. */
public class TiActivity extends TiBaseActivity
{
	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
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
		// handle shortcut intents
		Intent intent = getIntent();
		String shortcutId =
			intent.hasExtra(TiC.EVENT_PROPERTY_SHORTCUT) ? intent.getStringExtra(TiC.EVENT_PROPERTY_SHORTCUT) : null;
		if (shortcutId != null) {
			KrollModule appModule = TiApplication.getInstance().getModuleByName("App");
			if (appModule != null) {
				KrollDict data = new KrollDict();
				data.put(TiC.PROPERTY_ID, shortcutId);
				appModule.fireEvent(TiC.EVENT_SHORTCUT_ITEM_CLICK, data);
			}
		}
		super.onResume();
	}
}
