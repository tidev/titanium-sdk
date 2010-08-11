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

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.AsyncTask;

/**
 *
 * @author dthorp
 *
 * Overload onPostExecution(Drawable d) to handle the result.
 *
 */
public abstract class TiBackgroundImageLoadTask
	extends AsyncTask<String, Long, Drawable>
{
	private static final String LCAT = "TiBackgroundImageLoadTask";
	private static final boolean DBG = TiConfig.LOGD;

	protected SoftReference<TiContext> softTiContext;
	protected Integer imageHeight;
	protected Integer imageWidth;

	private String url;

	public TiBackgroundImageLoadTask(TiContext tiContext, Integer imageWidth, Integer imageHeight)
	{
		this.softTiContext = new SoftReference<TiContext>(tiContext);
	}

	@Override
	protected Drawable doInBackground(String... arg) {

		Drawable d = null;
		TiContext context = softTiContext.get();
		if (context == null) {
			if (DBG) {
				Log.d(LCAT, "doInBackground exiting early because context already gc'd");
			}
			return null;
		}
		url = context.resolveUrl(null, arg[0]);

		boolean retry = true;
		int retryCount = 3;

		TiFileHelper tfh = new TiFileHelper(context.getTiApp());

		while(retry) {
			retry = false;

			try {
				d = tfh.loadDrawable(url, false);
				if (d != null) {
					BitmapDrawable bd = (BitmapDrawable) d;
					int w = bd.getBitmap().getWidth();
					int h = bd.getBitmap().getHeight();

					if (imageHeight != null || imageWidth != null) {
						if (imageWidth != null) {
							w = imageWidth;
						}
						if (imageHeight != null) {
							h = imageHeight;
						}
						Bitmap b = Bitmap.createScaledBitmap(bd.getBitmap(), w, h, true);
						bd.getBitmap().recycle();
						d = new BitmapDrawable(b);
					}

				} else {
					Log.w(LCAT, "Unable to load image from " + url);
				}
			} catch (OutOfMemoryError e) {
				Log.e(LCAT, "Not enough memory left to load image: " + url + " : " + e.getMessage());
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
			}
		}

		return d;
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
