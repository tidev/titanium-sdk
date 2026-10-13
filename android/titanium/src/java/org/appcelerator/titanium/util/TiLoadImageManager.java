/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.view.TiDrawableReference;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

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

	public interface AsyncListener<T> {
		void onResult(@Nullable T result);
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

	/**
	 * Runs the given task on this manager's background thread pool and delivers its
	 * result to the given listener on the main UI thread. Delivers null if the task throws.
	 */
	public <T> void load(@NonNull Callable<T> task, @NonNull AsyncListener<T> listener)
	{
		this.threadPool.execute(() -> {
			T result = null;
			try {
				result = task.call();
			} catch (Exception ex) {
				Log.e(TAG, "Exception loading resource: " + ex.getLocalizedMessage());
			}
			final T finalResult = result;
			handler.post(() -> listener.onResult(finalResult));
		});
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
