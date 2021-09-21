/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013-2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.view.TiDrawableReference;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Looper;

/**
 * Manages the asynchronous opening of InputStreams from URIs so that
 * the resources get put into our TiResponseCache.
 */
public class TiLoadImageManager
{
	public interface Listener {
		void onLoadImageFinished(TiImageInfo imageInfo);
		void onLoadImageFailed();
	}

	private static final String TAG = "TiLoadImageManager";
	private static TiLoadImageManager _instance;

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
		handler = new Handler(Looper.getMainLooper());
		threadPool = Executors.newFixedThreadPool(2);
	}

	public void load(TiDrawableReference imageref, TiLoadImageManager.Listener listener)
	{
		this.threadPool.execute(() -> {
			TiImageInfo imageInfo = null;
			try {
				Bitmap bitmap = imageref.getBitmap(true);
				TiExifOrientation orientation = imageref.getExifOrientation();
				imageInfo = new TiImageInfo(imageref.getKey(), bitmap, orientation);
			} catch (Exception ex) {
				Log.e(TAG, "Exception loading image: " + ex.getLocalizedMessage());
			}

			if (listener != null) {
				final TiImageInfo finalImageInfo = imageInfo;
				handler.post(() -> {
					if (finalImageInfo != null) {
						listener.onLoadImageFinished(finalImageInfo);
					} else {
						listener.onLoadImageFailed();
					}
				});
			}
		});
	}
}
