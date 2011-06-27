/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiProperties;

import android.os.Environment;

/**
 * This class helps manage and store files in the app's cache directories.
 * 
 * Files stored in these directories will be automatically cleaned when
 * the user uninstalls the application. This class also provides convenience
 * methods for pruning the cache directories based on a configurable maximum size
 */
public class TiCacheHelper
{
	private static final String TAG = "TiCacheHelper";

	public static final String PROPERTY_CACHE_MAX_INTERNAL_SIZE = "ti.android.cache.maxinternalsize";
	public static final String PROPERTY_CACHE_MAX_EXTERNAL_SIZE = "ti.android.cache.maxexternalsize";

	public static final int DEFAULT_CACHE_MAX_INTERNAL_SIZE = 1024 * 1024; // 1MB for internal (private) cache (this should be relatively low)
	public static final int DEFAULT_CACHE_MAX_EXTERNAL_SIZE = 1024 * 1024 * 32; // 32MB for external (public) cache
	public static final int DEFAULT_CLEAN_TIMEOUT = 5; // The number of seconds the async cleanup method uses for scheduling

	protected int maxInternalSize = DEFAULT_CACHE_MAX_INTERNAL_SIZE;
	protected int maxExternalSize = DEFAULT_CACHE_MAX_EXTERNAL_SIZE;
	protected File internalCacheDir, externalCacheDir;

	public TiCacheHelper(TiApplication app)
	{
		TiProperties sysProperties = app.getSystemProperties();
		if (sysProperties != null) {
			maxInternalSize = sysProperties.getInt(PROPERTY_CACHE_MAX_INTERNAL_SIZE, DEFAULT_CACHE_MAX_INTERNAL_SIZE);
			maxExternalSize = sysProperties.getInt(PROPERTY_CACHE_MAX_EXTERNAL_SIZE, DEFAULT_CACHE_MAX_EXTERNAL_SIZE);
		}

		internalCacheDir = app.getApplicationContext().getCacheDir();

		// See http://developer.android.com/guide/topics/data/data-storage.html#ExternalCache
		// getExternalCacheDir() isn't available until API 8
		File extStorage = Environment.getExternalStorageDirectory();
		File dataDir = new File(new File(extStorage, "Android"), "data");
		externalCacheDir = new File(new File(dataDir, app.getPackageName()), "cache");
	}

	/**
	 * Android's internal cache directory for this application.
	 * The maxium size of internal cache should be relatively small, so the default is 1MB
	 */
	public File getInternalCacheDir()
	{
		return internalCacheDir;
	}

	/**
	 * Android's external cache directory for this application.
	 * When using external directories, make sure to use {@link android.os.Environment#getExternalStorageState()}
	 * to check if the external storage is mounted, and writable.
	 * 
	 * The maxium size of external cache can be larger, the default is 32MB.
	 */
	public File getExternalCacheDir()
	{
		return externalCacheDir;
	}

	protected File getFile(File parent, String... parts)
	{
		File f = parent;
		for (String part : parts) {
			f = new File(f, part);
		}
		return f;
	}

	/**
	 * Get a file path inside the internal cache directory
	 */
	public File getInternalFile(String... parts)
	{
		return getFile(internalCacheDir, parts);
	}

	/**
	 * Get a file path inside the external cache directory
	 */
	public File getExternalFile(String... parts)
	{
		return getFile(externalCacheDir, parts);
	}

	/**
	 * Create a temporary file inside the internal cache directory
	 * @see {@link java.io.File#createTempFile(String, String)}
	 * @throws IOException
	 */
	public File createInternalTempFile(String prefix, String suffix)
		throws IOException
	{
		if (!internalCacheDir.exists()) {
			internalCacheDir.mkdirs();
		}

		return File.createTempFile(prefix, suffix, internalCacheDir);
	}

	/**
	 * Create a temporary file inside the external cache directory
	 * @see {@link java.io.File#createTempFile(String, String)}
	 * @throws IOException when the external storage state is either unmounted or read only 
	 */
	public File createExternalTempFile(String prefix, String suffix)
		throws IOException
	{
		String extState = Environment.getExternalStorageState();
		if (Environment.MEDIA_MOUNTED.equals(extState)) {
			if (!externalCacheDir.exists()) {
				externalCacheDir.mkdirs();
			}
			return File.createTempFile(prefix, suffix, externalCacheDir);
		} else {
			throw new IOException("External storage not mounted for writing");
		}
	}

	/**
	 * This method is equivalent to
	 * <pre>scheduleCleanCacheDirs(TiCacheHelper.DEFAULT_CLEAN_TIMEOUT, TimeUnit.SECONDS)</pre>
	 */
	public void scheduleCleanCacheDirs()
	{
		scheduleCleanCacheDirs(DEFAULT_CLEAN_TIMEOUT, TimeUnit.SECONDS);
	}

	/**
	 * Walks the cache directories and prunes down to the maximum allowed limit.
	 * This method runs asynchronously in a low priority thread, using the 
	 * passed in timeout and time units.
	 */
	public void scheduleCleanCacheDirs(long delay, TimeUnit timeUnit)
	{
		if (!internalCacheDir.exists() && !externalCacheDir.exists()) {
			Log.w(TAG, "Neither cache directory exists, skipping cleanup");
		}

		ScheduledExecutorService service = 
			Executors.newSingleThreadScheduledExecutor();

		service.schedule(new AsyncCleanup(service), delay, timeUnit);
	}

	protected class AsyncCleanup implements Runnable, ThreadFactory
	{
		protected ExecutorService service;
		public AsyncCleanup(ExecutorService service)
		{
			this.service = service;
		}

		@Override
		public void run()
		{
			cleanInternalCacheDir();
			cleanExternalCacheDir();
			service.shutdown();
		}

		@Override
		public Thread newThread(Runnable r)
		{
			Thread thread = new Thread(r);
			thread.setPriority(Thread.MIN_PRIORITY);
			return thread;
		}
	}

	/**
	 * Cleans just the internal cache directory
	 */
	public void cleanInternalCacheDir()
	{
		cleanCacheDir(internalCacheDir, maxInternalSize);
	}

	/**
	 * Cleans just the external cache directory.
	 * Issues a warning if the external storage is not mounted
	 * or is read-only.
	 */
	public void cleanExternalCacheDir()
	{
		String extState = Environment.getExternalStorageState();
		if (Environment.MEDIA_MOUNTED.equals(extState)) {
			cleanCacheDir(externalCacheDir, maxExternalSize);
		} else {
			Log.w(TAG, "External storage not mounted, skipping clean up.");
		}
	}

	protected void cleanCacheDir(File cacheDir, int maxSize)
	{
		// Build up a list of access times
		HashMap<Long, File> lastTime = new HashMap<Long, File>();

		for (File file : cacheDir.listFiles())
		{
			lastTime.put(file.lastModified(), file);
		}
		
		// Ensure that the cache is under the required size
		List<Long> sz = new ArrayList<Long>(lastTime.keySet());
		Collections.sort(sz);
		Collections.reverse(sz);

		long cacheSize = 0;
		for (Long last : sz) {
			File file = lastTime.get(last);

			cacheSize += file.length();
			if (cacheSize > maxSize) {
				Log.i(TAG, "Max cache size reached for " + cacheDir.getAbsolutePath() + ", removing " + file.getAbsolutePath());
				file.delete();
			}
		}
	}
}
