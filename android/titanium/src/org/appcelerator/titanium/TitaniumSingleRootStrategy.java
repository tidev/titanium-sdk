/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.content.Intent;
import android.os.Bundle;

public class TitaniumSingleRootStrategy implements ITitaniumAppStrategy {

	public TitaniumSingleRootStrategy() {
	}

	public void onCreate(final TitaniumActivityGroup tag, Bundle savedInstanceState) {
		TitaniumApplication app = (TitaniumApplication) tag.getApplication();
		ArrayList<TitaniumWindowInfo> windows = app.getAppInfo().getWindows();
		TitaniumWindowInfo info = windows.get(0);

		TitaniumIntentWrapper appIntent = new TitaniumIntentWrapper(new Intent(tag, TitaniumActivity.class));
		appIntent.setWindowId(info.getWindowId());

		tag.launch(appIntent);
	}
}
