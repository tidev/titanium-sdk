/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class TiStreamHelper
{
	private static final String TAG = "TiStreamHelper";
	public static final int DEFAULT_BUFFER_SIZE = 1024;

	public static void pump(InputStream in, OutputStream out)
	{
		pump(in, out, DEFAULT_BUFFER_SIZE);
	}

	public static void pump(InputStream in, OutputStream out, int bufferSize)
	{
		byte buffer[] = new byte[bufferSize];
		int count = 0;
		try {
			while((count = in.read(buffer)) != -1) {
				if (out != null) {
					out.write(buffer, 0, count);
				}
			}
		} catch (IOException e) {
			Log.e(TAG, "IOException pumping streams", e);
		}
	}

	public static String toString(InputStream in)
	{
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		pump(in, out);
		return new String(out.toByteArray());
	}
}
