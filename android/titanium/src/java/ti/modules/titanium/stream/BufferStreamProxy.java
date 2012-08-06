/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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


@Kroll.proxy(parentModule=StreamModule.class)
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
	public int read(Object args[]) throws IOException
	{
		if (!isOpen) {
			throw new IOException("Unable to read from buffer, not open");
		}

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

		ByteArrayInputStream bufferInputStream = new ByteArrayInputStream(buffer.getBuffer(), position, (buffer.getLength() - position));
		int bytesRead;

		try {
			bytesRead = TiStreamHelper.read(bufferInputStream, bufferProxy, offset, length);

			if (bytesRead > -1) {
				position += bytesRead;
			}

			return bytesRead;

		} catch (IOException e) {
			Log.e(TAG, "Unable to read from buffer stream, IO error", e);
			throw new IOException("Unable to read from buffer stream, IO error");
		}
	}

	@Kroll.method
	public int write(Object args[]) throws IOException
	{
		if (!isOpen) {
			throw new IOException("Unable to write to buffer, not open");
		}

		if ((mode != StreamModule.MODE_WRITE) && (mode != StreamModule.MODE_APPEND)) {
			throw new IOException("Unable to write on stream, not opened in read or append mode");
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

		int bytesWritten = buffer.write(position, bufferProxy.getBuffer(), offset, length);
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
}

