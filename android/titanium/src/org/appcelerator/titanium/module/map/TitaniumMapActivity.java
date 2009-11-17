package org.appcelerator.titanium.module.map;

import org.appcelerator.titanium.api.ITitaniumLifecycle;

import android.os.Bundle;

import com.google.android.maps.MapActivity;

public class TitaniumMapActivity extends MapActivity
{

	private ITitaniumLifecycle lifecycleListener;

	public TitaniumMapActivity() {
	}

	@Override
	protected boolean isRouteDisplayed() {
		return false;
	}

	@Override
	protected void onCreate(Bundle bundle) {
		super.onCreate(bundle);
	}

	public void setLifecycleListener(ITitaniumLifecycle lifecycleListener) {
		this.lifecycleListener = lifecycleListener;
	}

	@Override
	protected void onPause() {
		super.onPause();

		if (lifecycleListener != null) {
			lifecycleListener.onPause();
		}
	}

	@Override
	protected void onResume() {
		super.onResume();

		if (lifecycleListener != null) {
			lifecycleListener.onResume();
		}
	}


}
