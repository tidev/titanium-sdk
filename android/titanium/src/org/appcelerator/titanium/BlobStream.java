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


	public BlobStream(TiBlob tiBlob)
	{
		super(tiBlob.getTiContext());
		this.tiBlob = tiBlob;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(BufferProxy bufferProxy) throws IOException
	{
		InputStream inputStream = tiBlob.getInputStream();
		if(inputStream != null) {
			return TiStreamHelper.read(inputStream, bufferProxy);

		} else {
			throw new IOException("Unable to read from blob, IO error");
		}
	}

	@Kroll.method
	public int read(BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		InputStream inputStream = tiBlob.getInputStream();
		if(inputStream != null) {
			return TiStreamHelper.read(inputStream, bufferProxy, offset, length);

		} else {
			throw new IOException("Unable to read from blob, IO error");
		}
	}

	@Kroll.method
	public int write(BufferProxy bufferProxy) throws IOException
	{
		throw new IOException("Unable to write, blob is read only");
	}

	@Kroll.method
	public int write(BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		throw new IOException("Unable to write, blob is read only");
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

