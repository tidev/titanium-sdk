/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.proxy;

import java.util.Arrays;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.TitaniumModule;


@Kroll.proxy(creatableInModule=TitaniumModule.class)
public class BufferProxy extends KrollProxy
{
	private static final String LCAT = "BufferProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private byte[] buffer;


	public BufferProxy(TiContext context)
	{
		super(context);
	}

	public BufferProxy(TiContext context, int bufferSize)
	{
		super(context);
		buffer = new byte[bufferSize];
	}

	public BufferProxy(TiContext context, byte[] existingBuffer)
	{
		super(context);
		buffer = existingBuffer;
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);

		int length = 0;

		Object lengthProperty = getProperty("length");
		if((lengthProperty != null)) {
			length = TiConvert.toInt(lengthProperty);
		}
		buffer = new byte[length];
	}

	public byte[] getBuffer()
	{
		return buffer;
	}

	@Kroll.method
	public int append(BufferProxy sourceBufferProxy)
	{
		int destBufferLength = buffer.length;
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();

		buffer = Arrays.copyOf(buffer, (destBufferLength + sourceBuffer.length));
		System.arraycopy(sourceBuffer, 0, buffer, destBufferLength, sourceBuffer.length);

		return sourceBuffer.length;
	}

	@Kroll.method
	public int append(BufferProxy sourceBufferProxy, int sourceOffset, int sourceLength)
	{
		int destBufferLength = buffer.length;
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();

		buffer = Arrays.copyOf(buffer, (destBufferLength + sourceBuffer.length));
		System.arraycopy(sourceBuffer, sourceOffset, buffer, destBufferLength, sourceLength);

		return sourceLength;
	}

	@Kroll.method
	public int insert(BufferProxy sourceBufferProxy, int offset)
	{
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();
		byte[] preInsertBuffer = Arrays.copyOf(buffer, offset);
		byte[] postInsertBuffer = Arrays.copyOfRange(buffer, offset, buffer.length);

		buffer = new byte[(preInsertBuffer.length + sourceBuffer.length + postInsertBuffer.length)];
		System.arraycopy(preInsertBuffer, 0, buffer, 0, preInsertBuffer.length);
		System.arraycopy(sourceBuffer, 0, buffer, preInsertBuffer.length, sourceBuffer.length);
		System.arraycopy(postInsertBuffer, 0, buffer, (preInsertBuffer.length + sourceBuffer.length), postInsertBuffer.length);

		return buffer.length;
	}

	@Kroll.method
	public int insert(BufferProxy sourceBufferProxy, int offset, int sourceOffset, int sourceLength)
	{
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();
		byte[] preInsertBuffer = Arrays.copyOf(buffer, offset);
		byte[] postInsertBuffer = Arrays.copyOfRange(buffer, offset, buffer.length);

		buffer = new byte[(preInsertBuffer.length + sourceLength + postInsertBuffer.length)];
		System.arraycopy(preInsertBuffer, 0, buffer, 0, preInsertBuffer.length);
		System.arraycopy(sourceBuffer, sourceOffset, buffer, preInsertBuffer.length, sourceLength);
		System.arraycopy(postInsertBuffer, 0, buffer, (preInsertBuffer.length + sourceLength), postInsertBuffer.length);

		return buffer.length;
	}

	@Kroll.method
	public int copy(BufferProxy sourceBufferProxy, int offset)
	{
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();
		System.arraycopy(sourceBuffer, 0, buffer, offset, sourceBuffer.length);

		return (sourceBuffer.length - offset);
	}

	@Kroll.method
	public int copy(BufferProxy sourceBufferProxy, int offset, int sourceOffset, int sourceLength)
	{
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();
		System.arraycopy(sourceBuffer, sourceOffset, buffer, offset, sourceLength);

		return (sourceBuffer.length - offset);
	}

	@Kroll.method
	public BufferProxy clone()
	{
		return (new BufferProxy(context, Arrays.copyOf(buffer, buffer.length)));
	}

	@Kroll.method
	public BufferProxy clone(int offset, int length)
	{
		return (new BufferProxy(context, Arrays.copyOfRange(buffer, offset, length)));
	}

	@Kroll.method
	public void fill(int fillByte)
	{
		Arrays.fill(buffer, (byte)fillByte);
	}

	@Kroll.method
	public void fill(int fillByte, int offset, int length)
	{
		Arrays.fill(buffer, offset, (offset + length), (byte)fillByte);
	}

	@Kroll.method
	public boolean clear()
	{
		Arrays.fill(buffer, (byte)0);
		return true;
	}

	@Kroll.method
	public boolean release()
	{
		buffer = new byte[0];
		return true;
	}

	@Kroll.method
	public String toString()
	{
		return (new String(buffer));
	}

	@Kroll.method
	public TiBlob toBlob()
	{
		return TiBlob.blobFromData(context, buffer);
	}

	@Kroll.setProperty @Kroll.method
	public int getLength()
	{
		return buffer.length;
	}

	@Kroll.setProperty @Kroll.method
	public void setLength(int length)
	{
		buffer = Arrays.copyOf(buffer, length);
	}

	public void resize(int length)
	{
		buffer = Arrays.copyOf(buffer, length);
	}
}

