/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.util;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.WeakReference;

import android.content.res.AssetManager;
import android.util.Log;

public class KrollAssetHelper
{
	private static final String TAG = "TiAssetHelper";
	private static WeakReference<AssetManager> manager;

	public static void init(AssetManager manager)
	{
		KrollAssetHelper.manager = new WeakReference<AssetManager>(manager);
	}

	public static String readAsset(String path)
	{
		try {
			AssetManager assetManager = manager.get();
			if (assetManager == null) {
				Log.e(TAG, "AssetManager is null, can't read asset: " + path);
				return null;
			}

			InputStream in = assetManager.open(path);
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			byte buffer[] = new byte[1024];
			int count = 0;
			while ((count = in.read(buffer)) != -1) {
				if (out != null) {
					out.write(buffer, 0, count);
				}
			}
			return out.toString();
		} catch (IOException e) {
			Log.e(TAG, "Error while reading asset \"" + path + "\":", e);
		}
		return null;
	}

	public static String readFile(String path)
	{
		try {
			FileInputStream in = new FileInputStream(path);
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			byte buffer[] = new byte[1024];
			int count = 0;
			while ((count = in.read(buffer)) != -1) {
				if (out != null) {
					out.write(buffer, 0, count);
				}
			}
			return out.toString();
		} catch (FileNotFoundException e) {
			Log.e(TAG, "File not found: " + path, e);
		} catch (IOException e) {
			Log.e(TAG, "Error while reading file: " + path, e);
		}
		return null;
	}
}
