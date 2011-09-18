/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;

import android.app.Activity;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;


public final class Assets {
	private static AssetManager assetManager = null;
	
	public static void init(Activity activity) {
		assetManager = activity.getAssets();
	}

	public static char[] readResource(String path) throws IOException {
		AssetFileDescriptor fd = assetManager.openFd(path);
		try {
			long length = fd.getDeclaredLength();
			if (length > Integer.MAX_VALUE) {
				return null;
			}

			char[] buffer = new char[(int)length];
			Reader r = new InputStreamReader(fd.createInputStream());
			if (r.read(buffer) > 0) {
				return buffer;
			}
		} finally {
			fd.close();
		}
		return null;
	}
}

