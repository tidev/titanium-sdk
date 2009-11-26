/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.map;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumActivityHelper;
import org.appcelerator.titanium.util.TitaniumDispatchException;

import android.content.Intent;
import android.os.Message;
import android.view.Window;
import android.webkit.WebView;

/**
 * NOTE: this is a STUB IMPLEMENTATION of Maps that we compile in in the case you don't use Maps
 * to get past the Davlik verification problem
 */
public class TitaniumMap extends TitaniumBaseModule
{
	private static final String LCAT = "TiMap";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public TitaniumMap(TitaniumModuleManager tmm, String moduleName) {
		super(tmm, moduleName);
	}

	@Override
	public void register(WebView webView) {
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumMap as " + moduleName + " using TitaniumMethod.");
		}
		tmm.registerInstance(moduleName, this);
	}


	@Override
	public boolean handleMessage(Message msg) {
		return false;
	}

	public String createMapView()
	{
		throw new TitaniumDispatchException("MapView internal error. You should not have been able to call this directly.", moduleName);
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
	}

	@Override
	public void onPause() {
		super.onPause();
	}

	@Override
	public void onResume() {
		super.onResume();
	}
}
