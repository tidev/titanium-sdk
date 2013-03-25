/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
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
	private static final String TAG = "TiLoadImageManager";
	private static final int MSG_FIRE_LOAD_FINISHED = 1000;
	private static final int MSG_FIRE_LOAD_FAILED = 1001;
	protected static TiLoadImageManager _instance;
	public static final int THREAD_POOL_SIZE = 2;

	protected SparseArray<ArrayList<SoftReference<TiLoadImageListener>>> listeners = new SparseArray<ArrayList<SoftReference<TiLoadImageListener>>>();
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
		ArrayList<SoftReference<TiLoadImageListener>> listenerList = null;
		synchronized (listeners) {
			if (listeners.get(hash) == null) {
				listenerList = new ArrayList<SoftReference<TiLoadImageListener>>();
				listeners.put(hash, listenerList);
			} else {
				listenerList = listeners.get(hash);
			}
			// We don't allow duplicate listeners for the same image.
			for (SoftReference<TiLoadImageListener> l : listenerList) {
				if (l.get() == listener) {
					return;
				}
			}
			listenerList.add(new SoftReference<TiLoadImageListener>(listener));
		}
		
		synchronized (loadingImageRefs) {
			if (!loadingImageRefs.contains(hash)) {
				loadingImageRefs.add(hash);
				threadPool.execute(new LoadImageJob(imageref));
			}
		}
	}

	protected void handleLoadImageMessage(int what, int hash, Bitmap bitmap)
	{
		ArrayList<SoftReference<TiLoadImageListener>> toRemove = new ArrayList<SoftReference<TiLoadImageListener>>();
		synchronized (listeners) {
			ArrayList<SoftReference<TiLoadImageListener>> listenerList = listeners.get(hash);
			for (SoftReference<TiLoadImageListener> listener : listenerList) {
				TiLoadImageListener l = listener.get();
				if (l != null) {
					if (what == MSG_FIRE_LOAD_FINISHED) {
						l.loadImageFinished(hash, bitmap);
					} else {
						l.loadImageFailed();
					}
					toRemove.add(listener);
				}
			}
			for (SoftReference<TiLoadImageListener> listener : toRemove) {
				listenerList.remove(listener);
			}
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_FIRE_LOAD_FINISHED:
				handleLoadImageMessage(MSG_FIRE_LOAD_FINISHED, (Integer)msg.arg1, (Bitmap)msg.obj);
				return true;
			case MSG_FIRE_LOAD_FAILED:
				handleLoadImageMessage(MSG_FIRE_LOAD_FAILED, (Integer)msg.arg1, null);
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
				Bitmap b = imageref.getBitmap(true);
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
