/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.appcelerator.kroll.common.Log;

/**
 * Helper methods for InputStream / OutputStream
 */
public class KrollStreamHelper
{
	private static final String TAG = "KrollStreamHelper";

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
			while ((count = in.read(buffer)) != -1) {
				if (out != null) {
					out.write(buffer, 0, count);
				}
			}
		} catch (IOException e) {
			Log.e(TAG, "IOException pumping streams", e);
		}
	}

	public static void pumpCount(InputStream in, OutputStream out, int byteCount)
	{
		pumpCount(in, out, byteCount, DEFAULT_BUFFER_SIZE);
	}

	public static void pumpCount(InputStream in, OutputStream out, int byteCount, int bufferSize)
	{
		byte buffer[] = new byte[bufferSize];
		int totalCount = 0;
		try {
			while (totalCount < byteCount) {
				int leftOver = Math.min(bufferSize, byteCount - totalCount);
				int count = in.read(buffer, 0, leftOver);
				if (count == -1) {
					break;
				}

				totalCount += count;
				if (out != null) {
					out.write(buffer, 0, count);
				}
			}
		} catch (IOException e) {
			Log.e(TAG, "IOException pumping streams", e);
		}
	}

	public static byte[] toByteArray(InputStream in)
	{
		return toByteArray(in, 32);
	}

	public static byte[] toByteArray(InputStream in, int size)
	{
		ByteArrayOutputStream out = new ByteArrayOutputStream(size);
		pump(in, out);
		return out.toByteArray();
	}

	public static String toString(InputStream in)
	{
		if (in == null) {
			return null;
		}
		return new String(toByteArray(in));
	}
}
