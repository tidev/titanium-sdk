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

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;

/**
 * @author Max Stepanov
 */
public final class Assets {

	/**
	 * Initialize Assets with AssetManager
	 * @param assetManager
	 */
	public static void init(AssetManager assetManager) {
		assign(new Assets(assetManager));
	}

	private final AssetManager assetManager;
	
	public static Assets instance;

	private Assets(AssetManager assetManager) {
		this.assetManager = assetManager;
		instance = this;
	}
	
	public char[] readResource(String path) throws IOException {
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
		
	private static native void assign(Assets assets);

}
