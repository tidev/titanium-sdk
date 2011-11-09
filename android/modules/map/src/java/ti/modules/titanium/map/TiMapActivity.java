/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;

import com.google.android.maps.MapActivity;

public class TiMapActivity extends MapActivity
{

	OnLifecycleEvent lifecyleListener;

	public TiMapActivity() {
	}

	public void setLifecycleListener(OnLifecycleEvent lifecycleListener) {
		this.lifecyleListener = lifecycleListener;
	}

	@Override
	protected boolean isRouteDisplayed() {
		return false;
	}

	@Override
	protected void onPause() {
		super.onPause();

		if (lifecyleListener != null) {
			lifecyleListener.onPause(this);
		}
	}

	@Override
	protected void onResume() {
		super.onResume();

		if (lifecyleListener != null) {
			lifecyleListener.onResume(this);
		}
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();

		if (lifecyleListener != null) {
			lifecyleListener.onDestroy(this);
		}
	}


}
