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

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;

public class KrollAssetHelper
{
	private static final String TAG = "TiAssetHelper";
	private static WeakReference<AssetManager> manager;
	private static String packageName, cacheDir;
	private static AssetCrypt assetCrypt;
	private static TiResourceUtils tiResourceUtils;

	public interface AssetCrypt
	{
		String readAsset(String path);
	}
	
	public interface TiResourceUtils
	{
		boolean useCustomResourceDirectory();
		boolean useAssetDirectory();
		boolean isExist(String path);
		String getBasePath();
		String getPath(String path);
	}

	public static void setAssetCrypt(AssetCrypt assetCrypt)
	{
		KrollAssetHelper.assetCrypt = assetCrypt;
	}
	
	public static void setTiResourceUtils(TiResourceUtils tiResourceUtils)
	{
		KrollAssetHelper.tiResourceUtils = tiResourceUtils;
	}

	public static void init(Context context)
	{
		KrollAssetHelper.manager = new WeakReference<AssetManager>(context.getAssets());
		KrollAssetHelper.packageName = context.getPackageName();
		KrollAssetHelper.cacheDir = context.getCacheDir().getAbsolutePath();
	}
	
	public static String readCustomAsset(String path)
	{
		String resourcePath = path.replace("Resources/", "");
		
		if(tiResourceUtils.useCustomResourceDirectory() && tiResourceUtils.isExist(resourcePath)){
			Log.d(TAG, "Search in folder: "+tiResourceUtils.getBasePath());
			String fullPath = tiResourceUtils.getPath(resourcePath);
			if(tiResourceUtils.useAssetDirectory()){
				return readAsset(fullPath);
			}else{
				return readFile(fullPath);
			}
		}
		return readAsset(path);
	}

	public static String readAsset(String path)
	{
		String resourcePath = path.replace("Resources/", "");

		if (assetCrypt != null) {
			String asset = assetCrypt.readAsset(resourcePath);
			if (asset != null) {
				return asset;
			}
		}

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

	public static String getPackageName()
	{
		return packageName;
	}

	public static String getCacheDir()
	{
		return cacheDir;
	}
}
