/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.content.Intent;
import android.os.Bundle;


public class TiActivity extends TiBaseActivity
{
	private boolean isTab = false;
	private static final String TAG = "TiActivity";


	@Override
	protected void onCreate(Bundle savedInstanceState) {
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);
		Intent intent = getIntent();
		if (intent == null) {
			return;
		}

		isTab = intent.getBooleanExtra(TiC.INTENT_PROPERTY_IS_TAB, false);
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
		super.onResume();

		if (isTab()) {
			TiApplication.addToActivityStack(this);
		}
	}

	@Override
	protected void onPause()
	{
		super.onPause();

		if (isTab()) {
			TiApplication.removeFromActivityStack(this);
		}
	}

	public boolean isTab()
	{
		return isTab;
	}
}
