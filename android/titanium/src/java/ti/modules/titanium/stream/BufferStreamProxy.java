/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.stream;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.util.TiStreamHelper;

import ti.modules.titanium.BufferProxy;

@Kroll.proxy(parentModule = StreamModule.class)
public class BufferStreamProxy extends KrollProxy implements TiStream
{
	private static final String TAG = "BufferStream";

	private BufferProxy buffer;
	private int mode = -1;
	private int position = -1;
	private boolean isOpen = false;

	public BufferStreamProxy(BufferProxy buffer, int mode)
	{
		if (mode == StreamModule.MODE_READ) {
			position = 0;

		} else if (mode == StreamModule.MODE_WRITE) {
			position = 0;

		} else if (mode == StreamModule.MODE_APPEND) {
			position = buffer.getLength();

		} else {
			throw new IllegalArgumentException("invalid mode");
		}

		this.buffer = buffer;
		this.mode = mode;
		isOpen = true;
	}

	// TiStream interface methods
	@Kroll.method
	public int read(Object args[]) throws Exception
	{
		if (!isOpen) {
			throw new IOException("Unable to read from buffer, not open");
		}

		if (mode != StreamModule.MODE_READ) {
			throw new IOException("Unable to read on a stream, not opened in read mode");
		}

		return TiStreamHelper.readTiStream(TAG, getKrollObject(), this, args);
	}

	public int readSync(Object bufferProxy, int offset, int length) throws IOException
	{
		ByteArrayInputStream bufferInputStream =
			new ByteArrayInputStream(this.buffer.getBuffer(), this.position, (this.buffer.getLength() - this.position));
		int bytesRead;

		try {
			bytesRead = TiStreamHelper.read(bufferInputStream, (BufferProxy) bufferProxy, offset, length);

			if (bytesRead > -1) {
				this.position += bytesRead;
			}

			return bytesRead;

		} catch (IOException e) {
			Log.e(TAG, "Unable to read from buffer stream, IO error", e);
			throw new IOException("Unable to read from buffer stream, IO error");
		}
	}

	@Kroll.method
	//public void write(BufferProxy buffer)
	//public void write(BufferProxy buffer, KrollFunction resultsCallback)
	//public void write(BufferProxy buffer, int offset, int length)
	//public void write(BufferProxy buffer, int offset, int length, KrollFunction resultsCallback)
	public int write(Object args[]) throws Exception
	{
		if (!isOpen) {
			throw new IOException("Unable to write to buffer, not open");
		}

		if ((mode != StreamModule.MODE_WRITE) && (mode != StreamModule.MODE_APPEND)) {
			throw new IOException("Unable to write on stream, not opened in read or append mode");
		}

		return TiStreamHelper.writeTiStream(TAG, getKrollObject(), this, args);
	}

	public int writeSync(Object bufferProxy, int offset, int length) throws IOException
	{
		int bytesWritten = buffer.write(position, ((BufferProxy) bufferProxy).getBuffer(), offset, length);
		position += bytesWritten;

		return bytesWritten;
	}

	@Kroll.method
	public boolean isWritable()
	{
		if ((mode != StreamModule.MODE_WRITE) && (mode != StreamModule.MODE_APPEND)) {
			return false;
		}
		return true;
	}

	@Kroll.method
	public boolean isReadable()
	{
		if (mode != StreamModule.MODE_READ) {
			return false;
		}
		return true;
	}

	@Kroll.method
	public void close() throws IOException
	{
		buffer = null;
		mode = -1;
		position = -1;
		isOpen = false;
	}

	@Override
	public String getApiName()
	{
		return "Ti.BufferStream";
	}
}
