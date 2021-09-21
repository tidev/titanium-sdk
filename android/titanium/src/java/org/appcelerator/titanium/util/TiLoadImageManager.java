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
import android.os.Looper;
import android.os.Message;
import android.util.SparseArray;

/**
 * Manages the asynchronous opening of InputStreams from URIs so that
 * the resources get put into our TiResponseCache.
 */
public class TiLoadImageManager implements Handler.Callback
{
	public interface Listener {
		void onLoadImageFinished(TiImageInfo imageInfo);
		void onLoadImageFailed();
	}

	private static final String TAG = "TiLoadImageManager";
	private static final int MSG_FIRE_LOAD_FINISHED = 1000;
	private static final int MSG_FIRE_LOAD_FAILED = 1001;
	private static TiLoadImageManager _instance;
	public static final int THREAD_POOL_SIZE = 2;

	private final SparseArray<ArrayList<SoftReference<TiLoadImageManager.Listener>>> listeners = new SparseArray<>();
	private final ArrayList<Integer> loadingImageRefs = new ArrayList<>();
	private final ExecutorService threadPool;
	private final Handler handler;

	public static TiLoadImageManager getInstance()
	{
		if (_instance == null) {
			_instance = new TiLoadImageManager();
		}
		return _instance;
	}

	private TiLoadImageManager()
	{
		handler = new Handler(Looper.getMainLooper(), this);
		threadPool = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
	}

	public void load(TiDrawableReference imageref, TiLoadImageManager.Listener listener)
	{
		int hash = imageref.hashCode();
		ArrayList<SoftReference<TiLoadImageManager.Listener>> listenerList = null;
		synchronized (listeners)
		{
			if (listeners.get(hash) == null) {
				listenerList = new ArrayList<>();
				listeners.put(hash, listenerList);
			} else {
				listenerList = listeners.get(hash);
			}
			// We don't allow duplicate listeners for the same image.
			for (var l : listenerList) {
				if (l.get() == listener) {
					return;
				}
			}
			listenerList.add(new SoftReference<>(listener));
		}

		synchronized (loadingImageRefs)
		{
			if (!loadingImageRefs.contains(hash)) {
				loadingImageRefs.add(hash);
				threadPool.execute(new LoadImageJob(imageref));
			}
		}
	}

	private void handleLoadImageMessage(int what, int hash, TiImageInfo imageInfo)
	{
		ArrayList<SoftReference<TiLoadImageManager.Listener>> toRemove = new ArrayList<>();
		synchronized (listeners)
		{
			var listenerList = listeners.get(hash);
			for (var listener : listenerList) {
				var l = listener.get();
				if (l != null) {
					if ((what == MSG_FIRE_LOAD_FINISHED) && (imageInfo != null)) {
						l.onLoadImageFinished(imageInfo);
					} else {
						l.onLoadImageFailed();
					}
					toRemove.add(listener);
				}
			}
			for (var listener : toRemove) {
				listenerList.remove(listener);
			}
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_FIRE_LOAD_FINISHED:
				handleLoadImageMessage(MSG_FIRE_LOAD_FINISHED, (Integer) msg.arg1, (TiImageInfo) msg.obj);
				return true;
			case MSG_FIRE_LOAD_FAILED:
				handleLoadImageMessage(MSG_FIRE_LOAD_FAILED, (Integer) msg.arg1, null);
				return true;
		}
		return false;
	}

	private class LoadImageJob implements Runnable
	{
		protected TiDrawableReference imageref;

		public LoadImageJob(TiDrawableReference imageref)
		{
			this.imageref = imageref;
		}

		public void run()
		{
			try {
				Bitmap bitmap = imageref.getBitmap(true);
				TiExifOrientation orientation = imageref.getExifOrientation();
				int hashCode = imageref.hashCode();
				synchronized (loadingImageRefs)
				{
					loadingImageRefs.remove((Integer) imageref.hashCode());
				}
				Message msg = handler.obtainMessage(MSG_FIRE_LOAD_FINISHED);
				msg.obj = new TiImageInfo(hashCode, bitmap, orientation);
				msg.arg1 = hashCode;
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
