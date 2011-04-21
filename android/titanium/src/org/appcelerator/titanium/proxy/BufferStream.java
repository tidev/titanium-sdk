/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.proxy;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiStreamHelper;


@Kroll.proxy
public class BufferStream extends KrollProxy implements TiStream
{
	private static final String LCAT = "BlobStream";
	private static final boolean DBG = TiConfig.LOGD;

	private BufferProxy buffer;
	private int bytesRead = 0;


	public BufferStream(BufferProxy buffer)
	{
		super(buffer.getTiContext());
		this.buffer = buffer;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(Object args[]) throws IOException
	{
		BufferProxy bufferProxy = null;
		int offset = 0;
		int length = 0;

		if(args.length == 1 || args.length == 3) {
			if(args.length == 1) {
				if(args[0] instanceof BufferProxy) {
					bufferProxy = (BufferProxy) args[0];
					length = bufferProxy.getLength();

				} else {
					throw new IllegalArgumentException("Invalid buffer argument");
				}
			}

			if(args.length == 3) {
				if(args[1] instanceof Double) {
					offset = ((Double)args[1]).intValue();

				} else{
					throw new IllegalArgumentException("Invalid offset argument");
				}

				if(args[2] instanceof Double) {
					length = ((Double)args[2]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid length argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		ByteArrayInputStream bufferInputStream = new ByteArrayInputStream(buffer.getBuffer(), bytesRead, (buffer.getLength() - bytesRead));
		bytesRead += TiStreamHelper.read(bufferInputStream, bufferProxy, offset, length);

		return bytesRead;
	}

	@Kroll.method
	public int write(Object args[]) throws IOException
	{
		BufferProxy bufferProxy = null;
		int offset = 0;
		int length = 0;

		if(args.length == 1 || args.length == 3) {
			if(args.length == 1) {
				if(args[0] instanceof BufferProxy) {
					bufferProxy = (BufferProxy) args[0];
					length = bufferProxy.getLength();

				} else {
					throw new IllegalArgumentException("Invalid buffer argument");
				}
			}

			if(args.length == 3) {
				if(args[1] instanceof Double) {
					offset = ((Double)args[1]).intValue();

				} else{
					throw new IllegalArgumentException("Invalid offset argument");
				}

				if(args[2] instanceof Double) {
					length = ((Double)args[2]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid length argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		return buffer.append(new Object[] {bufferProxy, offset, length});
	}

	@Kroll.method
	public boolean isWriteable()
	{
		return false;
	}

	@Kroll.method
	public boolean isReadable()
	{
		return true;
	}
}

