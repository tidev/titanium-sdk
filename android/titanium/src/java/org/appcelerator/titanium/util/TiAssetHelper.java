/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.IOException;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;

import android.app.Activity;
import android.content.res.AssetManager;
import android.util.Log;

public class TiAssetHelper
{
	private static final String TAG = "TiAssetHelper";

	public static String readAsset(String path)
	{
		Activity activity = TiApplication.getInstance().getCurrentActivity();
		if (activity == null) {
			Log.e(TAG, "Current activity is not initialized");
			return null;
		}

		AssetManager manager = activity.getAssets();
		if (manager == null) {
			Log.e(TAG, "AssetManager is null");
			return null;
		}

		try {
			return TiStreamHelper.toString(manager.open(path));
		} catch (IOException e) {
			Log.e(TAG, "Error while reading asset \"" + path + "\":", e);
			return null;
		}
	}
}
