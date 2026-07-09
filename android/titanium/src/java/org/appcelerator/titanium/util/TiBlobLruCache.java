/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.graphics.Bitmap;
import androidx.collection.LruCache;

import java.util.concurrent.ConcurrentHashMap;

public class TiBlobLruCache extends LruCache<String, Bitmap>
{
	// Get max available VM memory, exceeding this amount will throw an
	// OutOfMemory exception. Stored in kilobytes as LruCache takes an
	// int in its constructor.
	private static final int maxMemory = (int) (Runtime.getRuntime().maxMemory() / 1024);

	// Use 1/8th of the available memory for this memory cache.
	private static final int cacheSize = maxMemory / 8;

	// Track original bitmap sizes so sizeOf() returns consistent values
	// even after a bitmap has been recycled externally. LruCache requires
	// sizeOf() to be consistent for the lifetime of an entry; returning 0
	// for recycled bitmaps causes the internal size accounting to break,
	// leading to "sizeOf() is reporting inconsistent results!" crashes
	// when evictAll() or trimToSize() is called under memory pressure.
	private final ConcurrentHashMap<String, Integer> sizeMap = new ConcurrentHashMap<>();

	private static class InstanceHolder
	{
		private static final TiBlobLruCache INSTANCE = new TiBlobLruCache();
	}

	public static TiBlobLruCache getInstance()
	{
		return InstanceHolder.INSTANCE;
	}

	public TiBlobLruCache()
	{
		super(cacheSize);
	}

	@Override
	protected int sizeOf(String key, Bitmap bitmap)
	{
		// Return the cached size if available. This ensures consistency
		// even if the bitmap has been recycled since it was added.
		Integer cachedSize = sizeMap.get(key);
		if (cachedSize != null) {
			return cachedSize;
		}

		// Bitmap is recycled and was never tracked (shouldn't happen in
		// normal use, but guard against it defensively).
		if (bitmap.isRecycled()) {
			return 0;
		}

		int byteCount = (bitmap.getRowBytes() * bitmap.getHeight()) / 1024;
		sizeMap.put(key, byteCount);
		return byteCount;
	}

	@Override
	protected void entryRemoved(boolean evicted, String key, Bitmap oldValue, Bitmap newValue)
	{
		// Clean up tracked size when an entry is fully removed.
		// When newValue is non-null this is a replacement and the new
		// entry's size will be tracked by the next sizeOf() call.
		if (newValue == null) {
			sizeMap.remove(key);
		}
	}

	public void addBitmapToMemoryCache(String key, Bitmap bitmap)
	{
		if (getBitmapFromMemCache(key) == null) {
			getInstance().put(key, bitmap);
		}
	}

	public Bitmap getBitmapFromMemCache(String key)
	{
		return getInstance().get(key);
	}
}
