/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.graphics.Bitmap;
import org.appcelerator.titanium.view.TiDrawableReference;

public class TiImageInfo
{
	private final TiDrawableReference.Key key;
	private final Bitmap bitmap;
	private final TiExifOrientation orientation;

	public TiImageInfo(TiDrawableReference.Key key, Bitmap bitmap, TiExifOrientation orientation)
	{
		this.key = key;
		this.bitmap = bitmap;
		this.orientation = orientation;
	}

	@Override
	public boolean equals(Object value)
	{
		if (value instanceof TiImageInfo) {
			return ((TiImageInfo) value).key.equals(this.key);
		}
		return false;
	}

	@Override
	public int hashCode()
	{
		return (this.key != null) ? this.key.hashCode() : 0;
	}

	public TiDrawableReference.Key getKey()
	{
		return this.key;
	}

	public Bitmap getBitmap()
	{
		return this.bitmap;
	}

	public TiExifOrientation getOrientation()
	{
		return this.orientation;
	}
}
