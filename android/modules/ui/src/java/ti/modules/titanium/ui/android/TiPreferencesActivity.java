/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import org.appcelerator.titanium.TiActivity;

import android.os.Bundle;

public class TiPreferencesActivity extends TiActivity
{
	protected static final String DEFAULT_PREFS_RNAME = "preferences";
	protected static final String PREFS_KEY = "prefsName";

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		String prefsName = DEFAULT_PREFS_RNAME;
		if (getIntent() != null && getIntent().hasExtra(PREFS_KEY)) {
			String name = getIntent().getExtras().getString(PREFS_KEY);
			if (name != null && name.length() > 0) {
				prefsName = name;
			}
		}

		TiPreferencesFragment fragment = new TiPreferencesFragment();
		Bundle args = new Bundle();
		args.putString(PREFS_KEY, prefsName);
		fragment.setArguments(args);

		// Display the fragment as the main content.
		getFragmentManager().beginTransaction().replace(android.R.id.content, fragment).commit();
	}
}
