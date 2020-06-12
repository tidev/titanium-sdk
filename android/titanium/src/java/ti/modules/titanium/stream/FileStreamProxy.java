/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
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

@Kroll.proxy(parentModule = StreamModule.class)
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
	public int read(Object[] args) throws Exception
	{
		if (!isOpen) {
			throw new IOException("Unable to read from file, not open");
		}

		return TiStreamHelper.readTiStream(TAG, getKrollObject(), this, args);
	}

	public int readSync(Object bufferProxy, int offset, int length) throws IOException
	{
		try {
			return TiStreamHelper.read(this.fileProxy.getBaseFile().getExistingInputStream(), (BufferProxy) bufferProxy,
									   offset, length);
		} catch (IOException e) {
			Log.e(TAG, "Unable to read from file, IO error", e);
			throw new IOException("Unable to read from file, IO error");
		}
	}

	@Kroll.method
	public int write(Object[] args) throws Exception
	{
		if (!isOpen) {
			throw new IOException("Unable to write to file, not open");
		}

		return TiStreamHelper.writeTiStream(TAG, getKrollObject(), this, args);
	}

	public int writeSync(Object bufferProxy, int offset, int length) throws IOException
	{
		try {
			return TiStreamHelper.write(this.fileProxy.getBaseFile().getExistingOutputStream(),
										(BufferProxy) bufferProxy, offset, length);
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
	public void close(Object args[]) throws IOException
	{
		fileProxy.getBaseFile().close();
		isOpen = false;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Filesystem.FileStream";
	}
}
