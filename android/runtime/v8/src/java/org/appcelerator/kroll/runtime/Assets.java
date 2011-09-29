/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime;

import java.io.IOException;
import java.io.InputStream;

import android.app.Activity;
import android.content.res.AssetManager;
import android.util.Log;


public final class Assets
{
	private static final String TAG = "Assets";

	private static AssetManager assetManager = null;


	public static void init(Activity activity)
	{
		assetManager = activity.getAssets();
	}

	public static char[] readResource(String resourcePath) throws IOException
	{
		if (assetManager == null) {
			Log.e(TAG, "assetManager is not initialized");
			return null;
		}

		InputStream stream = assetManager.open(resourcePath);

		StringBuilder builder = new StringBuilder();
		try {
			int length = -1;
			byte buffer[] = new byte[1024];
			while ((length = stream.read(buffer)) != -1) {
				builder.append(new String(buffer, 0, length));
			}

			return builder.toString().toCharArray();

		} catch (IOException e) {
			Log.e(TAG, "Error when reading resources:", e);
			return null;
		}
	}
}

