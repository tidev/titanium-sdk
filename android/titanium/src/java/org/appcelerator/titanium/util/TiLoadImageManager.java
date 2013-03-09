/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.ref.SoftReference;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.view.TiDrawableReference;

import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.util.SparseArray;

/**
 * Manages the asynchronous opening of InputStreams from URIs so that
 * the resources get put into our TiResponseCache.
 */
public class TiLoadImageManager implements Handler.Callback
{
	private static final String TAG = "TiBackgroundTaskManager";
	private static final int MSG_FIRE_LOAD_FINISHED = 1000;
	private static final int MSG_FIRE_LOAD_FAILED = 1001;
	protected static TiLoadImageManager _instance;
	public static final int THREAD_POOL_SIZE = 2;

	protected SparseArray<SoftReference<TiLoadImageListener>> listeners = new SparseArray<SoftReference<TiLoadImageListener>>();
	protected ArrayList<Integer> loadingImageRefs = new ArrayList<Integer>();
	protected ExecutorService threadPool;
	protected Handler handler;

	public static TiLoadImageManager getInstance()
	{
		if (_instance == null) {
			_instance = new TiLoadImageManager();
		}
		return _instance;
	}

	protected TiLoadImageManager()
	{
		handler = new Handler(this);
		threadPool = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
	}

	public void load(TiDrawableReference imageref, TiLoadImageListener listener)
	{
		int hash = imageref.hashCode();
		
		synchronized (listeners) {
			if (listeners.get(hash) == null) {
				listeners.put(hash, new SoftReference<TiLoadImageListener>(listener));
			}
		}
		
		synchronized (loadingImageRefs) {
			if (!loadingImageRefs.contains(hash)) {
				loadingImageRefs.add(hash);
				threadPool.execute(new LoadImageJob(imageref));
			}
		}
	}

	protected void handleLoadFinished(int hash, Bitmap bitmap)
	{
		synchronized (listeners) {
			TiLoadImageListener l = listeners.get(hash).get();
			l.LoadImageFinished(hash, bitmap);
			listeners.delete(hash);
		}
	}

	protected void handleLoadFailed(int hash)
	{
		synchronized (listeners) {
			TiLoadImageListener l = listeners.get(hash).get();
			l.LoadImageFailed();
			listeners.delete(hash);
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_FIRE_LOAD_FINISHED:
				handleLoadFinished((Integer)msg.arg1, (Bitmap)msg.obj);
				return true;
			case MSG_FIRE_LOAD_FAILED:
				handleLoadFailed((Integer)msg.arg1);
				return true;
		}
		return false;
	}

	protected class LoadImageJob implements Runnable
	{
		protected TiDrawableReference imageref;

		public LoadImageJob (TiDrawableReference imageref)
		{
			this.imageref = imageref;
		}

		public void run()
		{
			try {
				Bitmap b = imageref.getBitmap();
				synchronized (loadingImageRefs) {
					loadingImageRefs.remove((Integer)imageref.hashCode());
				}
				Message msg = handler.obtainMessage(MSG_FIRE_LOAD_FINISHED);
				msg.obj = b;
				msg.arg1 = imageref.hashCode();
				msg.sendToTarget();
			} catch (Exception e) {
				// fire a download fail event if we are unable to download
				Log.e(TAG, "Exception loading image: " + e.getLocalizedMessage());
				Message msg = handler.obtainMessage(MSG_FIRE_LOAD_FAILED);
				msg.arg1 = imageref.hashCode();
				msg.sendToTarget();
			}
		}
	}
}
