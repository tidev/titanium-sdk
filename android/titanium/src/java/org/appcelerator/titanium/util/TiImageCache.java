/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.graphics.Bitmap;
import org.appcelerator.kroll.KrollRuntime;
import java.lang.ref.SoftReference;
import java.util.HashMap;

public final class TiImageCache
{
	private static final HashMap<Integer, SoftReference<Bitmap>> bitmapCollection = new HashMap<>(64);
	private static final HashMap<Integer, TiExifOrientation> orientationCollection = new HashMap<>(64);

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
		if ((imageInfo != null) && (imageInfo.getBitmap() != null)) {
			Bitmap bitmap = imageInfo.getBitmap();
			if ((bitmap != null) && !bitmap.isRecycled()) {
				bitmapCollection.put(imageInfo.hashCode(), new SoftReference<>(imageInfo.getBitmap()));
				orientationCollection.put(imageInfo.hashCode(), imageInfo.getOrientation());
			}
		}
	}

	public static synchronized Bitmap getBitmap(int hashCode)
	{
		var bitmapRef = bitmapCollection.get(hashCode);
		if (bitmapRef != null) {
			var bitmap = bitmapRef.get();
			if ((bitmap != null) && !bitmap.isRecycled()) {
				return bitmap;
			} else {
				remove(hashCode);
			}
		}
		return null;
	}

	public static synchronized TiExifOrientation getOrientation(int hashCode)
	{
		return orientationCollection.get(hashCode);
	}

	public static synchronized void clear()
	{
		bitmapCollection.clear();
		orientationCollection.clear();
	}

	private static synchronized void remove(int hashCode)
	{
		bitmapCollection.remove(hashCode);
		orientationCollection.remove(hashCode);
	}
}
