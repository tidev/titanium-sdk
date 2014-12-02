/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiRHelper;

import android.os.Bundle;
import android.preference.PreferenceActivity;

public class TiPreferencesActivity extends PreferenceActivity 
{
	private static final String TAG = "TiPreferencesActivity";
	public static final String DEFAULT_PREFS_RNAME = "preferences";
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		String prefsName = DEFAULT_PREFS_RNAME;
		if (getIntent().hasExtra("prefsName")) {
			String name = getIntent().getExtras().getString("prefsName");
			if (name != null && name.length() > 0) {
				prefsName = name;
			}
		}
		
		// Find the layout file, do nothing if not found
		try {
			getPreferenceManager().setSharedPreferencesName(TiApplication.APPLICATION_PREFERENCES_NAME);
			int resid = TiRHelper.getResource("xml." + prefsName);
			if (resid != 0) {
				addPreferencesFromResource(resid);
			} else {
				Log.e(TAG, "xml." + prefsName + " preferences not found.");
				finish();
				return;
			}
		} catch (TiRHelper.ResourceNotFoundException e) {
			Log.e(TAG, "Error loading preferences: " + e.getMessage());
			finish();
			return;
		}
	}
}
