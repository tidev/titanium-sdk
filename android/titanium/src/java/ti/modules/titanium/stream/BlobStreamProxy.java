/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.stream;

import java.io.IOException;
import java.io.InputStream;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.util.TiStreamHelper;

import ti.modules.titanium.BufferProxy;

@Kroll.proxy(parentModule = StreamModule.class)
public class BlobStreamProxy extends KrollProxy implements TiStream
{
	private static final String TAG = "BlobStream";

	private TiBlob tiBlob;
	private InputStream inputStream = null;
	private boolean isOpen = false;

	public BlobStreamProxy(TiBlob tiBlob)
	{
		this.tiBlob = tiBlob;
		isOpen = true;
	}

	// TiStream interface methods
	@Kroll.method
	public int read(Object args[]) throws Exception
	{
		if (!isOpen) {
			throw new IOException("Unable to read from blob, not open");
		}

		return TiStreamHelper.readTiStream(TAG, getKrollObject(), this, args);
	}

	public int readSync(Object bufferProxy, int offset, int length) throws IOException
	{
		if (inputStream == null) {
			inputStream = tiBlob.getInputStream();
			// TODO set position based on mode
			if (inputStream == null) {
				throw new IOException("Unable to read from blob, input stream is null");
			}
		}

		try {
			return TiStreamHelper.read(inputStream, (BufferProxy) bufferProxy, offset, length);
		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Unable to read from blob, IO error");
		}
	}

	@Kroll.method
	public int write(Object args[]) throws Exception
	{
		return writeSync(null, 0, 0);
	}

	public int writeSync(Object buffer, int offset, int length) throws IOException
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
		return true;
	}

	@Kroll.method
	public void close(Object args[]) throws IOException
	{
		tiBlob = null;
		inputStream.close();
		isOpen = false;
	}

	@Override
	public String getApiName()
	{
		return "Ti.BlobStream";
	}
}
