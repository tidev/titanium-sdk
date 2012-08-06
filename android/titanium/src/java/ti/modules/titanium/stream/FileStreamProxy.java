/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.stream;

import java.io.IOException;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.util.TiStreamHelper;

import ti.modules.titanium.BufferProxy;

@Kroll.proxy(parentModule=StreamModule.class)
public class FileStreamProxy extends KrollProxy implements TiStream
{
	private static final String TAG = "FileStream";

	private TiFileProxy fileProxy;
	private boolean isOpen = false;


	public FileStreamProxy(TiFileProxy fileProxy)
	{
		this.fileProxy = fileProxy;
		isOpen = true;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(Object args[]) throws IOException
	{
		if (!isOpen) {
			throw new IOException("Unable to read from file, not open");
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

		try {
			return TiStreamHelper.read(fileProxy.getBaseFile().getExistingInputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			Log.e(TAG, "Unable to read from file, IO error", e);
			throw new IOException("Unable to read from file, IO error");
		}
	}

	@Kroll.method
	public int write(Object args[]) throws IOException
	{
		if (!isOpen) {
			throw new IOException("Unable to write to file, not open");
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

		try {
			return TiStreamHelper.write(fileProxy.getBaseFile().getExistingOutputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			Log.e(TAG, "Unable to write to file, IO error", e);
			throw new IOException("Unable to write to file, IO error");
		}
	}

	@Kroll.method
	public boolean isWritable()
	{
		return (fileProxy.getBaseFile().isOpen() && fileProxy.getBaseFile().isWriteable());
	}

	@Kroll.method
	public boolean isReadable()
	{
		return fileProxy.getBaseFile().isOpen();
	}

	@Kroll.method
	public void close() throws IOException
	{
		fileProxy.getBaseFile().close();
		isOpen = false;
	}
}

