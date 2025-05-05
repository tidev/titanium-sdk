/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
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
import androidx.annotation.NonNull;

/**
 * Manages the asynchronous opening of InputStreams from URIs so that
 * the resources get put into our TiResponseCache.
 */
public class TiLoadImageManager
{
	public interface Listener {
		void onLoadImageFinished(@NonNull TiDrawableReference drawableRef, @NonNull TiImageInfo imageInfo);
		void onLoadImageFailed(@NonNull TiDrawableReference drawableRef);
	}

	private static final String TAG = "TiLoadImageManager";

	private final ExecutorService threadPool;
	private final Handler handler;

	private static class InstanceHolder
	{
		private static final TiLoadImageManager INSTANCE = new TiLoadImageManager();
	}

	public static TiLoadImageManager getInstance()
	{
		return InstanceHolder.INSTANCE;
	}

	private TiLoadImageManager()
	{
		handler = new Handler(Looper.getMainLooper());
		threadPool = Executors.newFixedThreadPool(Math.max(Runtime.getRuntime().availableProcessors(), 2));
	}

	public void load(TiDrawableReference drawableRef, TiLoadImageManager.Listener listener)
	{
		if (drawableRef == null) {
			return;
		}

		this.threadPool.execute(() -> {
			TiImageInfo imageInfo = null;
			try {
				Bitmap bitmap = drawableRef.getBitmap(true);
				if (bitmap != null) {
					TiExifOrientation orientation = drawableRef.getExifOrientation();
					imageInfo = new TiImageInfo(drawableRef.getKey(), bitmap, orientation);
				}
			} catch (Exception ex) {
				Log.e(TAG, "Exception loading image: " + ex.getLocalizedMessage());
			}

			if (listener != null) {
				final TiImageInfo finalImageInfo = imageInfo;
				handler.post(() -> {
					if (finalImageInfo != null) {
						listener.onLoadImageFinished(drawableRef, finalImageInfo);
					} else {
						listener.onLoadImageFailed(drawableRef);
					}
				});
			}
		});
	}
}
