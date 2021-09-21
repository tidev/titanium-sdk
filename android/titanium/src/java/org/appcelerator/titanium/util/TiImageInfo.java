/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.graphics.Bitmap;

public class TiImageInfo
{
	private final int hashCode;
	private final Bitmap bitmap;
	private final TiExifOrientation orientation;

	public TiImageInfo(int hashCode, Bitmap bitmap, TiExifOrientation orientation)
	{
		this.hashCode = hashCode;
		this.bitmap = bitmap;
		this.orientation = orientation;
	}

	@Override
	public boolean equals(Object value)
	{
		if (value instanceof TiImageInfo) {
			return ((TiImageInfo) value).hashCode == this.hashCode;
		}
		return false;
	}

	@Override
	public int hashCode()
	{
		return this.hashCode;
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
