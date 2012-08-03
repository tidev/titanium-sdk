/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.util;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

import org.appcelerator.kroll.common.Log;

import android.app.Application;
import android.os.Environment;

/**
 * This class helps create and delete temporary files in the app's external cache directory.
 * Temporary files will be automatically deleted the next time the application starts, or whenever {@link #scheduleCleanTempDir()}
 * is called
 */
public class TiTempFileHelper
{
	private static final String TAG = "TiTempFileHelper";

	public static final String TEMPDIR = "_tmp";
	public static final int DEFAULT_CLEAN_TIMEOUT = 5; // The number of seconds the async cleanup method uses for

	protected File tempDir;
	protected ArrayList<String> createdThisSession = new ArrayList<String>();

	private String previousExternalStorageState;
	private String appPackageName;
	private File internalCacheDir;

	public TiTempFileHelper(Application app)
	{
		appPackageName = app.getPackageName();
		internalCacheDir = app.getCacheDir();

		updateTempDir();
	}

	/**
	 * Create a temporary file inside the external cache directory
	 * 
	 * @see File#createTempFile(String, String)
	 * @throws IOException
	 *             when the external storage state is either unmounted or read only
	 */
	public File createTempFile(String prefix, String suffix) throws IOException
	{
		updateTempDir();
		File tempFile = File.createTempFile(prefix, suffix, tempDir);
		excludeFileOnCleanup(tempFile);
		return tempFile;

	}

	/**
	 * This method is equivalent to
	 * 
	 * <pre>
	 * scheduleCleanTempDir(TiTempFileHelper.DEFAULT_CLEAN_TIMEOUT, TimeUnit.SECONDS)
	 * </pre>
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

		ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();

		service.schedule(new AsyncCleanup(service), delay, timeUnit);
	}

	protected class AsyncCleanup implements Runnable, ThreadFactory
	{
		protected ExecutorService service;

		public AsyncCleanup(ExecutorService service)
		{
			this.service = service;
		}

		// TODO @Override
		public void run()
		{
			doCleanTempDir();
			service.shutdown();
		}

		// TODO @Override
		public Thread newThread(Runnable r)
		{
			Thread thread = new Thread(r);
			thread.setPriority(Thread.MIN_PRIORITY);
			return thread;
		}
	}

	/**
	 * Adds file to the list of temp files created during this session. It will only be added to the list if the file
	 * is located in the temp folder. This file will not be wiped during cleanup.
	 */
	public void excludeFileOnCleanup(File f)
	{
		if (f != null && tempDir.equals(f.getParentFile())) {
			synchronized (createdThisSession) {
				createdThisSession.add(f.getAbsolutePath());
			}
		}
	}

	protected void doCleanTempDir()
	{
		if (!tempDir.exists()) {
			Log.w(TAG, "The temp directory doesn't exist, skipping cleanup");
			return;
		}
		for (File file : tempDir.listFiles()) {
			String absolutePath = file.getAbsolutePath();
			synchronized (createdThisSession) {
				if (createdThisSession.contains(absolutePath)) {
					continue;
				}
			}

			Log.d(TAG, "Deleting temporary file " + absolutePath, Log.DEBUG_MODE);
			try {
				file.delete();
			} catch (Exception e) {
				Log.w(TAG, "Exception trying to delete " + absolutePath + ", skipping", e, Log.DEBUG_MODE);
			}
		}
	}

	public File getTempDirectory()
	{
		updateTempDir();
		return tempDir;
	}

	private void updateTempDir()
	{
		String extState = Environment.getExternalStorageState();
		if (!extState.equals(previousExternalStorageState)) {
			if (Environment.MEDIA_MOUNTED.equals(extState)) {

				// See http://developer.android.com/guide/topics/data/data-storage.html#ExternalCache
				// getExternalCacheDir() isn't available until API 8
				File extStorage = Environment.getExternalStorageDirectory();
				File dataDir = new File(new File(extStorage, "Android"), "data");
				File externalCacheDir = new File(new File(dataDir, appPackageName), "cache");
				tempDir = new File(externalCacheDir, TEMPDIR);
			} else {
				// Use internal storage cache if SD card is removed
				tempDir = new File(internalCacheDir, TEMPDIR);
			}

			// go ahead and make sure the temp directory exists
			if (!tempDir.exists()) {
				tempDir.mkdirs();
			}

		}
		previousExternalStorageState = extState;
	}
}
