/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TiC;

import android.graphics.Bitmap;
import android.support.v4.util.LruCache;

public class TiBlobLruCache extends LruCache<String, Bitmap>
{
	// Get max available VM memory, exceeding this amount will throw an
	// OutOfMemory exception. Stored in kilobytes as LruCache takes an
	// int in its constructor.
	private static final int maxMemory = (int) (Runtime.getRuntime().maxMemory() / 1024);

	// Use 1/8th of the available memory for this memory cache.
	private static final int cacheSize = maxMemory / 8;

	protected static TiBlobLruCache _instance;

	public static TiBlobLruCache getInstance()
	{
		if (_instance == null) {
			_instance = new TiBlobLruCache();
		}
		return _instance;
	}

	public TiBlobLruCache()
	{
		super(cacheSize);
	}

	@Override
	protected int sizeOf(String key, Bitmap bitmap)
	{
		int byteCount = bitmap.getRowBytes() * bitmap.getHeight();
		return byteCount / 1024;
	}
	
	public void addBitmapToMemoryCache(String key, Bitmap bitmap) {
	    if (getBitmapFromMemCache(key) == null) {
	        _instance.put(key, bitmap);
	    }
	}

	public Bitmap getBitmapFromMemCache(String key) {
	    return _instance.get(key);
	}
}
