/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.filesystem;

import java.io.IOException;
import java.io.InputStream;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.proxy.BufferProxy;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiStreamHelper;


@Kroll.proxy
public class FileStream extends KrollProxy implements TiStream
{
	private static final String LCAT = "FileStream";
	private static final boolean DBG = TiConfig.LOGD;

	private FileProxy fileProxy;
	private InputStream inputStream = null;


	public FileStream(FileProxy fileProxy)
	{
		super(fileProxy.getTiContext());
		this.fileProxy = fileProxy;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(Object args[]) throws IOException
	{
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
			inputStream = fileProxy.getInputStream();
		}

		try {
			return TiStreamHelper.read(inputStream, bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Unable to read from file, IO error");
		}
	}

	@Kroll.method
	public int write(Object args[]) throws IOException
	{
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
			return TiStreamHelper.write(fileProxy.tbf.getOutputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Unable to write to file, IO error");
		}
	}

	@Kroll.method
	public boolean isWritable()
	{
		return (fileProxy.tbf.isOpen() && fileProxy.tbf.isWriteable());
	}

	@Kroll.method
	public boolean isReadable()
	{
		return fileProxy.tbf.isOpen();
	}

	@Kroll.method
	public void close()
	{
		fileProxy.tbf.close();
	}
}

