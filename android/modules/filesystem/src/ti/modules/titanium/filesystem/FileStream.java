/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.filesystem;

import java.io.IOException;

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


	public FileStream(FileProxy fileProxy)
	{
		super(fileProxy.getTiContext());
		this.fileProxy = fileProxy;
	}


	// TiStream interface methods
	@Kroll.method
	public int read(BufferProxy bufferProxy) throws IOException
	{
		try{
			return TiStreamHelper.read(fileProxy.getInputStream(), bufferProxy);

		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Unable to read from file, IO error");
		}
	}

	@Kroll.method
	public int read(BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		try {
			return TiStreamHelper.read(fileProxy.getInputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Unable to read from file, IO error");
		}
	}

	@Kroll.method
	public int write(BufferProxy bufferProxy) throws IOException
	{
		try {
			return TiStreamHelper.write(fileProxy.tbf.getOutputStream(), bufferProxy);

		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Unable to write to file, IO error");
		}
	}

	@Kroll.method
	public int write(BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		try {
			return TiStreamHelper.write(fileProxy.tbf.getOutputStream(), bufferProxy, offset, length);

		} catch (IOException e) {
			e.printStackTrace();
			throw new IOException("Unable to write to file, IO error");
		}
	}

	@Kroll.method
	public boolean isWriteable()
	{
		return (fileProxy.tbf.isOpen() && fileProxy.tbf.isWriteable());
	}

	@Kroll.method
	public boolean isReadable()
	{
		return fileProxy.tbf.isOpen();
	}
}

