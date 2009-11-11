package org.appcelerator.titanium.module.map;

import org.appcelerator.titanium.util.Log;

import android.os.Bundle;

import com.google.android.maps.MapActivity;

public class TitaniumMapActivity extends MapActivity {

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

}
