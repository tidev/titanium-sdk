/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.ref.SoftReference;
import java.util.concurrent.RejectedExecutionException;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiDrawableReference.Bounds;

import android.os.AsyncTask;
import android.view.View;

/**
 *
 * @author dthorp
 *
 * Overload onPostExecution(Drawable d) to handle the result.
 *
 */
public abstract class TiBackgroundImageLoadTask
	extends AsyncTask<String, Long, Boolean>
{
	private static final String LCAT = "TiBackgroundImageLoadTask";
	private static final boolean DBG = TiConfig.LOGD;

	protected SoftReference<TiContext> softTiContext;

	public TiBackgroundImageLoadTask(TiContext tiContext)
	{
		this.softTiContext = new SoftReference<TiContext>(tiContext);
	}

	@Override
	protected Boolean doInBackground(String... arg) {

		if (arg.length == 0) {
			Log.w(LCAT, "url argument is missing.  Returning null drawable");
			return null;
		}
		
		String url = arg[0];
		boolean downloaded = false;
		TiContext context = softTiContext.get();
		if (context == null) {
			if (DBG) {
				Log.d(LCAT, "doInBackground exiting early because context already gc'd");
			}
			return null;
		}
		
		TiDrawableReference ref = TiDrawableReference.fromUrl(context, 	url);
		
		boolean retry = true;
		int retryCount = 3;

		while(retry) {
			retry = false;

			Bounds bounds = ref.peakBounds();
			if (bounds.getWidth() > 0 && bounds.getHeight() > 0) {
				downloaded = true;
			} else if (ref.outOfMemoryOccurred()) {
				Log.e(LCAT, "Not enough memory left to load image: " + url);
				retryCount -= 1;
				if (retryCount > 0) {
					retry = true;
					Log.i(LCAT, "Signalling a GC, will retry load.");
					System.gc(); // See if we can force a compaction
					try {
						Thread.sleep(1000);
					} catch (InterruptedException ie) {
						// Ignore
					}
					Log.i(LCAT, "Retry #" + (3 - retryCount) + " for " + url);
				}
				
			} else {
				// ref.getBitmap() returned null and it wasn't because of OOM
				if (DBG) {
					Log.d(LCAT, "TiDrawableReference.getBitmap() (url '" + url + "') returned null");
				}
			}
		}
		
		return downloaded;
	}

	public void load(String url) {
		try {
			execute(url);
		} catch (RejectedExecutionException e) {
			Log.w(LCAT, "Thread pool rejected attempt to load image: " + url);
			Log.w(LCAT, "ADD Handler for retry");
		}
	}
}
