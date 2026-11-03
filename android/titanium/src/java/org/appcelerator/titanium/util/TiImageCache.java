/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.graphics.Bitmap;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.titanium.view.TiDrawableReference;
import java.lang.ref.SoftReference;
import java.util.HashMap;

public final class TiImageCache
{
	private static final HashMap<TiDrawableReference.Key, SoftReference<Bitmap>> bitmapCollection = new HashMap<>(64);
	private static final HashMap<TiDrawableReference.Key, TiExifOrientation> orientationCollection = new HashMap<>(64);

	static
	{
		KrollRuntime.addOnDisposingListener((KrollRuntime runtime) -> {
			clear();
		});
	}

	private TiImageCache()
	{
	}

	public static synchronized void add(TiImageInfo imageInfo)
	{
		if ((imageInfo != null) && (imageInfo.getKey() != null) && (imageInfo.getBitmap() != null)) {
			Bitmap bitmap = imageInfo.getBitmap();
			if ((bitmap != null) && !bitmap.isRecycled()) {
				bitmapCollection.put(imageInfo.getKey(), new SoftReference<>(imageInfo.getBitmap()));
				orientationCollection.put(imageInfo.getKey(), imageInfo.getOrientation());
			}
		}
	}

	public static synchronized Bitmap getBitmap(TiDrawableReference.Key key)
	{
		var bitmapRef = bitmapCollection.get(key);
		if (bitmapRef != null) {
			var bitmap = bitmapRef.get();
			if ((bitmap != null) && !bitmap.isRecycled()) {
				return bitmap;
			} else {
				remove(key);
			}
		}
		return null;
	}

	public static synchronized TiExifOrientation getOrientation(TiDrawableReference.Key key)
	{
		return orientationCollection.get(key);
	}

	public static synchronized void clear()
	{
		bitmapCollection.clear();
		orientationCollection.clear();
	}

	private static synchronized void remove(TiDrawableReference.Key key)
	{
		bitmapCollection.remove(key);
		orientationCollection.remove(key);
	}
}
