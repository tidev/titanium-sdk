/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import ti.modules.titanium.BufferProxy;

public class TiStreamHelper
{

	public static int read(InputStream inputStream, BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		byte[] buffer = bufferProxy.getBuffer();

		if ((offset + length) > buffer.length) {
			length = buffer.length - offset;
		}

		return inputStream.read(buffer, offset, length);
	}

	public static int write(OutputStream outputStream, BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		byte[] buffer = bufferProxy.getBuffer();

		if ((offset + length) > buffer.length) {
			length = buffer.length - offset;
		}

		outputStream.write(buffer, offset, length);
		outputStream.flush();

		return length;
	}

}
