/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.util;

import java.util.HashMap;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;

import org.json.JSONArray;

public class KrollAssetCache
{
	private static final String TAG = "TiAssetCache";

	private static HashMap<String, byte[]> cache = new HashMap<>();

	/**
     * Asynchronous task to load specified assets into cache.
     */
	private static class CacheTask extends AsyncTask<String[], Void, Void>
	{
		protected Void doInBackground(String[]... args)
		{
			final String[] paths = args[0];
			for (String path : paths) {
				byte[] bytes = KrollAssetHelper.readAssetBytes(path);
				if (bytes != null) {
					cache.put(path, bytes);
				}
			}
			return null;
		}
	}

	private static final CacheTask task = new CacheTask();

	/**
     * Initialize KrollAssetCache class by parsing 'cache.json'
     * then loading the asset cache from a background thread.
     * @param context Application context.
     */
	public static void init(Context context)
	{
		// Make sure KrollAssetHelper is initialized.
		KrollAssetHelper.init(context);

		String[] assets = null;
		try {

			// Attempt to read and parse 'cache.json'.
			String cacheJsonString = KrollAssetHelper.readAsset("cache.json");
			if (cacheJsonString != null) {
				JSONArray cacheJsonArray = new JSONArray(cacheJsonString);
				assets = new String[cacheJsonArray.length()];

				// Add entries to assets array.
				for (int i = 0; i < assets.length; i++) {
					assets[i] = cacheJsonArray.getString(i);
				}

				// Execute cache task on background thread.
				if (assets != null) {
					task.execute(assets);
				}
			}
		} catch (Exception e) {
			Log.e(TAG, "Failed to parse 'cache.json'.");
		}
	}

	/**
     * Determine if cache contains specified asset.
     * @param path Asset to check.
     * @return boolean of result.
     */
	public static boolean has(String path)
	{
		return cache.containsKey(path);
	}

	/**
     * Obtain cached byte array for specified asset.
     * Cache is relieved after first call.
     * @param path Asset to obtain.
     * @return byte array of asset.
     */
	public static byte[] get(String path)
	{
		byte[] bytes = cache.get(path);
		cache.remove(path);
		return bytes;
	}
}
