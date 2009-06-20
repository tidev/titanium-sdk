/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumUIHelper;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;

/**
 * The purpose of this Activity is to determine what the base Titanium
 * Activity should be, start it and finish.
 *
 * @author dthorp
 *
 */
public class TitaniumLaunchActivity extends Activity
{
	private static final String LCAT = "TiLaunchActivity";

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		TitaniumApplication app = null;

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
		} else {
			appIntent.setWindowId(TitaniumIntentWrapper.ACTIVITY_PREFIX +"TI-ROOT");
		}

		startActivity(appIntent.getIntent());
		finish();
	}

	private void fatalDialog(String message)
	{
    	TitaniumUIHelper.doOkDialog(
    			this,
    			"Fatal",
    			message,
    			TitaniumUIHelper.createFinishListener(this)
    			);
    	return;
	}
}
