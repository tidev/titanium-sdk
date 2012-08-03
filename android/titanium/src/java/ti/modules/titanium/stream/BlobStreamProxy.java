/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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

@Kroll.proxy(parentModule=StreamModule.class)
public class BlobStreamProxy extends KrollProxy implements TiStream
{
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
	public int read(Object args[]) throws IOException
	{
		if (!isOpen) {
			throw new IOException("Unable to read from blob, not open");
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
			// TODO set position based on mode
		}

		if(inputStream != null) {
			try {
				return TiStreamHelper.read(inputStream, bufferProxy, offset, length);

			} catch (IOException e) {
				e.printStackTrace();
				throw new IOException("Unable to read from blob, IO error");
			}

		} else {
			throw new IOException("Unable to read from blob, input stream is null");
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
		return true;
	}

	@Kroll.method
	public void close() throws IOException
	{
		tiBlob = null;
		inputStream.close();
		isOpen = false;
	}
}

