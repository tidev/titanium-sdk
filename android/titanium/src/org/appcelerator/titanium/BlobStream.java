/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.io.StreamModule;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.proxy.BufferProxy;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiStreamHelper;


@Kroll.proxy
public class BlobStream extends KrollProxy implements TiStream
{
	private static final String LCAT = "BlobStream";
	private static final boolean DBG = TiConfig.LOGD;

	private TiBlob tiBlob;
	private int mode = 0;
	private InputStream inputStream = null;


	public BlobStream(TiBlob tiBlob, int mode)
	{
		super(tiBlob.getTiContext());
		this.tiBlob = tiBlob;
		this.mode = mode;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(Object args[]) throws IOException
	{
		if (mode != StreamModule.MODE_READ) {
			throw new IOException("Unable to read on a stream, not opened in read mode");
		}

		BufferProxy bufferProxy = null;
		int offset = 0;
		int length = 0;

		if(args.length == 1 || args.length == 3) {
			if(args.length > 0) {
				if(args[0] instanceof BufferProxy) {
					bufferProxy = (BufferProxy) args[0];
					length = bufferProxy.getLength();

				} else {
					throw new IllegalArgumentException("Invalid buffer argument");
				}
			}

			if(args.length == 3) {
				if(args[1] instanceof Integer) {
					offset = ((Integer)args[1]).intValue();

				} else if(args[1] instanceof Double) {
					offset = ((Double)args[1]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid offset argument");
				}

				if(args[2] instanceof Integer) {
					length = ((Integer)args[2]).intValue();

				} else if(args[2] instanceof Double) {
					length = ((Double)args[2]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid length argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (inputStream == null) {
			inputStream = tiBlob.getInputStream();
		}

		if(inputStream != null) {
			return TiStreamHelper.read(inputStream, bufferProxy, offset, length);

		} else {
			throw new IOException("Unable to read from blob, IO error");
		}
	}

	@Kroll.method
	public int write(Object args[]) throws IOException
	{
		throw new IOException("Unable to write, blob is read only");
	}

	@Kroll.method
	public boolean isWritable()
	{
		return false;
	}

	@Kroll.method
	public boolean isReadable()
	{
		if (mode != StreamModule.MODE_READ) {
			return false;
		}
		return true;
	}
}

