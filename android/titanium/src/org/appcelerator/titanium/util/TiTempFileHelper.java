/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.File;
import java.io.IOException;
import java.nio.channels.FileLockInterruptionException;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

import org.appcelerator.titanium.TiApplication;

import android.os.Environment;

/**
 * This class helps create and delete temporary files in the app's external cache directory.
 * 
 * Temporary files will be automatically deleted the next time the application starts, or whenever
 * {@link #cleanTempDir} is called
 */
public class TiTempFileHelper
{
	private static final String TAG = "TiTempFileHelper";
	private static final boolean DBG = TiConfig.DEBUG;

	public static final String TEMPDIR = "_tmp";
	public static final int DEFAULT_CLEAN_TIMEOUT = 5; // The number of seconds the async cleanup method uses for scheduling

	protected File tempDir;
	protected ArrayList<String> createdThisSession = new ArrayList<String>();

	public TiTempFileHelper(TiApplication app)
	{
		// See http://developer.android.com/guide/topics/data/data-storage.html#ExternalCache
		// getExternalCacheDir() isn't available until API 8
		File extStorage = Environment.getExternalStorageDirectory();
		File dataDir = new File(new File(extStorage, "Android"), "data");
		File externalCacheDir = new File(new File(dataDir, app.getPackageName()), "cache");
		tempDir = new File(externalCacheDir, TEMPDIR);

		// go ahead and make sure the temp directory exists
		String extState = Environment.getExternalStorageState();
		if (Environment.MEDIA_MOUNTED.equals(extState)) {
			if (!tempDir.exists()) {
				tempDir.mkdirs();
			}
		} else {
			// TODO this needs further discussion regarding what to do with temp files 
			// when SD card is removed
			Log.e(TAG, "External storage not mounted for writing");
		}
	}

	/**
	 * Create a temporary file inside the external cache directory
	 * @see File#createTempFile(String, String)
	 * @throws IOException when the external storage state is either unmounted or read only 
	 */
	public File createTempFile(String prefix, String suffix)
		throws IOException
	{
		String extState = Environment.getExternalStorageState();
		if (Environment.MEDIA_MOUNTED.equals(extState)) {
			File tempFile = File.createTempFile(prefix, suffix, tempDir);
			synchronized (createdThisSession) {
				createdThisSession.add(tempFile.getAbsolutePath());
			}
			return tempFile;
		} else {
			throw new IOException("External storage not mounted for writing");
		}
	}

	/**
	 * This method is equivalent to
	 * <pre>scheduleCleanTempDir(TiTempFileHelper.DEFAULT_CLEAN_TIMEOUT, TimeUnit.SECONDS)</pre>
	 */
	public void scheduleCleanTempDir()
	{
		scheduleCleanTempDir(DEFAULT_CLEAN_TIMEOUT, TimeUnit.SECONDS);
	}

	/**
	 * Walks the temporary directory and deletes all of the files.
	 * This method runs asynchronously in a low priority thread, using the 
	 * passed in timeout and time units.
	 */
	public void scheduleCleanTempDir(long delay, TimeUnit timeUnit)
	{
		if (!tempDir.exists()) {
			Log.w(TAG, "The external temp directory doesn't exist, skipping cleanup");
			return;
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
			cleanTempDir();
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
	 * Cleans the temporary directory synchronously.
	 * Issues a warning if the external storage is not mounted
	 * or is read-only.
	 */
	public void cleanTempDir()
	{
		String extState = Environment.getExternalStorageState();
		if (Environment.MEDIA_MOUNTED.equals(extState)) {
			doCleanTempDir();
		} else {
			Log.w(TAG, "External storage not mounted, skipping clean up.");
		}
	}

	protected void doCleanTempDir()
	{
		if (!tempDir.exists()) {
			Log.w(TAG, "The external temp directory doesn't exist, skipping cleanup");
			return;
		}
		for (File file : tempDir.listFiles())
		{
			String absolutePath = file.getAbsolutePath();
			synchronized (createdThisSession) {
				if (createdThisSession.contains(absolutePath)) {
					continue;
				}
			}

			if (DBG) {
				Log.d(TAG, "Deleting temporary file " + absolutePath);
			}
			try {
				file.delete();
			} catch (Exception e) {
				Log.w(TAG, "Exception trying to delete " + absolutePath + ", skipping", e);
			}
		}
	}

	public File getTempDirectory()
	{
		return tempDir;
	}
}
