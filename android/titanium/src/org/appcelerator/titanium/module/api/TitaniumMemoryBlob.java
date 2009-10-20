/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.api;

import java.lang.ref.WeakReference;

public class TitaniumMemoryBlob
{
	private WeakReference<byte[]> weakData;

	public TitaniumMemoryBlob(byte[] data) {
		this.weakData = new WeakReference<byte[]>(data);
	}

	public int getLength() {
		int length = 0;
		byte[] data = weakData.get();
		if (data != null) {
			length = data.length;
		}
		return length;
	}

	public byte[] getData() {
		return weakData.get();
	}

	public void clear() {
		weakData = null;
	}
}
