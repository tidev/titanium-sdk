/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import android.app.Activity;
import android.content.res.AssetManager;


public final class Assets {
	private static AssetManager assetManager = null;
	
	public static void init(Activity activity) {
		assetManager = activity.getAssets();
	}

	public static char[] readResource(String path) throws IOException {
		InputStream stream = assetManager.open(path);
		StringBuilder builder = new StringBuilder();
		try {
			int length = -1;
			byte buffer[] = new byte[1024];
			while ((length = stream.read(buffer)) != -1) {
				builder.append(new String(buffer, 0, length));
			}
			return builder.toString().toCharArray();
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}
}

