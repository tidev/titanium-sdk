/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.ref.SoftReference;
import java.util.concurrent.RejectedExecutionException;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.view.TiDrawableReference;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.AsyncTask;
import android.view.View;

public abstract class TiBackgroundImageLoadTask
	extends AsyncTask<String, Long, Drawable>
{
	private static final String TAG = "TiBackgroundImageLoadTask";

	protected SoftReference<View> parent;
	protected TiDimension imageHeight;
	protected TiDimension imageWidth;

	public TiBackgroundImageLoadTask(View parent, TiDimension imageWidth, TiDimension imageHeight)
	{
		this.parent = new SoftReference<View>(parent);
		this.imageWidth = imageWidth;
		this.imageHeight = imageHeight;
	}

	@Override
	protected Drawable doInBackground(String... arg) {

		if (arg.length == 0) {
			Log.w(TAG, "url argument is missing.  Returning null drawable");
			return null;
		}

		String url = arg[0];
		Drawable d = null;
		if (parent.get() == null) {
			Log.d(TAG, "doInBackground exiting early because context already gc'd", Log.DEBUG_MODE);
			return null;
		}

		// TODO - check the parent?  can View.get().getContext() ever not be an activity?
		TiDrawableReference ref = TiDrawableReference.fromUrl(((Activity)parent.get().getContext()), url);
		
		boolean retry = true;
		int retryCount = 3;

		while(retry) {
			retry = false;

			Bitmap b = ref.getBitmap(parent.get(), imageWidth, imageHeight);
			if (b != null) {
				d = new BitmapDrawable(b);
			} else if (ref.outOfMemoryOccurred()) {
				Log.e(TAG, "Not enough memory left to load image: " + url);
				retryCount -= 1;
				if (retryCount > 0) {
					retry = true;
					Log.i(TAG, "Signalling a GC, will retry load.");
					System.gc(); // See if we can force a compaction
					try {
						Thread.sleep(1000);
					} catch (InterruptedException ie) {
						// Ignore
					}
					Log.i(TAG, "Retry #" + (3 - retryCount) + " for " + url);
				}
			} else {
				// ref.getBitmap() returned null and it wasn't because of OOM
				Log.d(TAG, "TiDrawableReference.getBitmap() (url '" + url + "') returned null", Log.DEBUG_MODE);
				return null;
			}
		}

		return d;
	}

	public void load(String url) {
		try {
			execute(url);
		} catch (RejectedExecutionException e) {
			Log.w(TAG, "Thread pool rejected attempt to load image: " + url);
			Log.w(TAG, "ADD Handler for retry");
		}
	}
}