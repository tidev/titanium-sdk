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

import ti.modules.titanium.BufferProxy;


public class TiStreamHelper
{
	private static final String LCAT = "TiStreamHelper";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int DEFAULT_BUFFER_SIZE = 1024;


	public static int read(InputStream inputStream, BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		byte[] buffer = bufferProxy.getBuffer();

		if((offset + length) > buffer.length)
		{
			length = buffer.length - offset;
		}

		return inputStream.read(buffer, offset, length);
	}

	public static int write(OutputStream outputStream, BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		byte[] buffer = bufferProxy.getBuffer();

		if((offset + length) > buffer.length)
		{
			length = buffer.length - offset;
		}

		outputStream.write(buffer, offset, length);
		outputStream.flush();

		return length;
	}

	// TODO old stuff begins here - remove everything below this once stream
	// module if finished
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
			Log.e(LCAT, "IOException pumping streams", e);
		}
	}

	public static byte[] toByteArray(InputStream in)
	{
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		pump(in, out);
		return out.toByteArray();
	}

	public static String toString(InputStream in)
	{
		return new String(toByteArray(in));
	}
}
