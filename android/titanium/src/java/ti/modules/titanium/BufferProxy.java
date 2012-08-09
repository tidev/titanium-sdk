/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium;

import java.io.UnsupportedEncodingException;
import java.util.Arrays;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.codec.CodecModule;

/**
 * A proxy that wraps a primitive byte array buffer
 */
@Kroll.proxy(creatableInModule=TitaniumModule.class, propertyAccessors = {
	TiC.PROPERTY_BYTE_ORDER,
	TiC.PROPERTY_TYPE,
	TiC.PROPERTY_VALUE
})
public class BufferProxy extends KrollProxy
{
	private static final String TAG = "BufferProxy";

	private byte[] buffer;

	public BufferProxy()
	{
	}

	public BufferProxy(int bufferSize)
	{
		buffer = new byte[bufferSize];
	}

	public BufferProxy(byte[] existingBuffer)
	{
		buffer = existingBuffer;
	}

	@Override
	public void handleCreationArgs(KrollModule createdInModule, Object[] args)
	{
		// If no arguments are provided in create, allocate an empty buffer.
		if (args.length == 0) {
			buffer = new byte[0];
		} else {
			super.handleCreationArgs(createdInModule, args);
		}
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);

		int length = 0;
		Object lengthProperty = dict.get(TiC.PROPERTY_LENGTH);
		if (lengthProperty != null) {
			length = TiConvert.toInt(lengthProperty);
		}

		if (!hasProperty(TiC.PROPERTY_BYTE_ORDER)) {
			// If no byte order is specified we need to default to the system byte order
			// CodecModule.getByteOrder will return the system byte order when null is passed in.
			setProperty(TiC.PROPERTY_BYTE_ORDER, CodecModule.getByteOrder(null));
		}

		buffer = new byte[length];
		Object value = dict.get(TiC.PROPERTY_VALUE);
		if (value instanceof Number) {
			encodeNumber((Number) value, dict);
		} else if (value instanceof String) {
			encodeString((String) value, dict);
		}
	}

	protected void encodeNumber(Number value, KrollDict dict)
	{
		String type = TiConvert.toString(dict, TiC.PROPERTY_TYPE);
		if (type == null) {
			throw new IllegalArgumentException("data is a Number, but no type was given");
		}

		if (buffer.length == 0) {
			buffer = new byte[CodecModule.getWidth(type)];
		}

		int byteOrder = CodecModule.getByteOrder(dict.get(TiC.PROPERTY_BYTE_ORDER));
		CodecModule.encodeNumber(value, type, buffer, 0, byteOrder);
	}

	protected void encodeString(String value, KrollDict dict)
	{
		String type = TiConvert.toString(dict, TiC.PROPERTY_TYPE);
		if (type == null) {
			type = CodecModule.CHARSET_UTF8;
		}

		String charset = CodecModule.getCharset(type);
		try {
			byte bytes[] = value.getBytes(charset);
			if (buffer.length == 0) {
				buffer = bytes;
			} else {
				System.arraycopy(bytes, 0, buffer, 0, bytes.length);
			}
		} catch (UnsupportedEncodingException e) {
			Log.w(TAG, e.getMessage(), e);
			throw new IllegalArgumentException("Unsupported Encoding: " + charset);
		}
	}

	/**
	 * @return The native buffer for this proxy
	 * @module.api
	 */
	public byte[] getBuffer()
	{
		return buffer;
	}

	@Override
	public Object getIndexedProperty(int index)
	{
		return buffer[index] & 0xFF;
	}

	@Override
	public void setIndexedProperty(int index, Object value)
	{
		if (value instanceof Number) {
			buffer[index] = ((Number)value).byteValue();
		} else {
			super.setIndexedProperty(index, value);
		}
	}

	protected byte[] copyOf(byte[] array, int newLength)
	{
		byte newArray[] = new byte[newLength];
		int length = newLength;
		if (length > array.length) {
			length = array.length;
		}
		System.arraycopy(array, 0, newArray, 0, length);
		return newArray;
	}

	protected byte[] copyOfRange(byte[] array, int from, int to)
	{
		int length = to - from;
		byte newArray[] = new byte[length];
		System.arraycopy(array, from, newArray, 0, length);
		return newArray;
	}

	protected void validateOffsetAndLength(int offset, int length, int bufferLength)
	{
		if (length > offset + bufferLength) {
			throw new IllegalArgumentException("offset of " + offset + " and length of " + length + " is larger than the buffer length: " + bufferLength);
		}
	}

	/**
	 * Writes data from sourceBuffer into this.
	 * @param position the offset position of this buffer.
	 * @param sourceBuffer the source buffer to write from.
	 * @param sourceOffset the offset position of the sourceBuffer.
	 * @param sourceLength the length of the sourceBuffer.
	 * @return number of bytes written, -1 if no data is available.
	 * @module.api
	 */
	public int write(int position, byte[] sourceBuffer, int sourceOffset, int sourceLength)
	{
		if ((position + sourceLength) > buffer.length) {
			buffer = copyOf(buffer, (position + sourceLength));
		}

		System.arraycopy(sourceBuffer, sourceOffset, buffer, position, sourceLength);

		return sourceLength;
	}

	@Kroll.method
	public int append(Object[] args)
	{
		int destLength = buffer.length;
		BufferProxy src = (BufferProxy) args[0];
		byte[] sourceBuffer = src.getBuffer();

		int offset = 0;
		if (args.length > 1 && args[1] != null) {
			offset = TiConvert.toInt(args[1]);
		}

		int sourceLength = sourceBuffer.length;
		if (args.length > 2 && args[2] != null) {
			sourceLength = TiConvert.toInt(args[2]);
		}

		validateOffsetAndLength(offset, sourceLength, sourceBuffer.length);

		buffer = copyOf(buffer, (destLength + sourceLength));
		System.arraycopy(sourceBuffer, offset, buffer, destLength, sourceLength);
		return sourceLength;
	}

	@Kroll.method
	public int insert(Object[] args)
	{
		if (args.length < 2) {
			throw new IllegalArgumentException("At least 2 arguments required for insert: src, offset");
		}
		BufferProxy sourceBufferProxy = (BufferProxy) args[0];
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();
		int offset = TiConvert.toInt(args[1]);

		int sourceOffset = 0;
		if (args.length > 2 && args[2] != null) {
			sourceOffset = TiConvert.toInt(args[2]);
		}

		int sourceLength = sourceBuffer.length;
		if (args.length > 3 && args[3] != null) {
			sourceLength = TiConvert.toInt(args[3]);
		}

		validateOffsetAndLength(sourceOffset, sourceLength, sourceBuffer.length);

		byte[] preInsertBuffer = copyOf(buffer, offset);
		byte[] postInsertBuffer = copyOfRange(buffer, offset, buffer.length);

		buffer = new byte[(preInsertBuffer.length + sourceLength + postInsertBuffer.length)];
		System.arraycopy(preInsertBuffer, 0, buffer, 0, preInsertBuffer.length);
		System.arraycopy(sourceBuffer, sourceOffset, buffer, preInsertBuffer.length, sourceLength);
		System.arraycopy(postInsertBuffer, 0, buffer, (preInsertBuffer.length + sourceLength), postInsertBuffer.length);

		return sourceLength;
	}

	@Kroll.method
	public int copy(Object[] args)
	{
		if (args.length < 1) {
			throw new IllegalArgumentException("At least 1 argument required for copy: srcBuffer");
		}

		BufferProxy sourceBufferProxy = (BufferProxy) args[0];
		byte[] sourceBuffer = sourceBufferProxy.getBuffer();

		int offset = 0;
		if (args.length > 1 && args[1] != null) {
			offset = TiConvert.toInt(args[1]);
		}

		int sourceOffset = 0;
		if (args.length > 2 && args[2] != null) {
			sourceOffset = TiConvert.toInt(args[2]);
		}

		int sourceLength = sourceBuffer.length;
		if (args.length > 3 && args[3] != null) {
			sourceLength = TiConvert.toInt(args[3]);
		}

		validateOffsetAndLength(sourceOffset, sourceLength, sourceBuffer.length);

		System.arraycopy(sourceBuffer, sourceOffset, buffer, offset, sourceLength);
		return sourceLength;
	}

	@Kroll.method
	public BufferProxy clone(Object[] args)
	{
		int offset = 0;
		if (args.length > 0 && args[0] != null) {
			offset = TiConvert.toInt(args[0]);
		}

		int length = buffer.length;
		if (args.length > 1 && args[1] != null) {
			length = TiConvert.toInt(args[1]);
		}

		validateOffsetAndLength(offset, length, buffer.length);

		return new BufferProxy(copyOfRange(buffer, offset, offset+length));
	}

	@Kroll.method
	public void fill(Object[] args)
	{
		if (args.length < 1) {
			throw new IllegalArgumentException("fill requires at least 1 argument: fillByte");
		}

		int fillByte = TiConvert.toInt(args[0]);
		int offset = 0;
		if (args.length > 1 && args[1] != null) {
			offset = TiConvert.toInt(args[1]);
		}

		int length = buffer.length;
		if (args.length > 2 && args[2] != null) {
			length = TiConvert.toInt(args[2]);
		}

		validateOffsetAndLength(offset, length, buffer.length);

		Arrays.fill(buffer, offset, (offset + length), (byte)fillByte);
	}

	@Kroll.method
	public void clear()
	{
		Arrays.fill(buffer, (byte)0);
	}

	@Kroll.method
	public void release()
	{
		buffer = new byte[0];
	}

	@Kroll.method
	public String toString()
	{
		return new String(buffer);
	}

	@Kroll.method
	public TiBlob toBlob()
	{
		return TiBlob.blobFromData(buffer);
	}

	/**
	 * @return The length of this buffer in bytes
	 * @module.api
	 */
	@Kroll.getProperty @Kroll.method
	public int getLength()
	{
		return buffer.length;
	}

	/**
	 * Sets the length of this buffer proxy by either growing or shrinking
	 * the allocated buffer space
	 * @param length The new length of this buffer proxy in bytes
	 * @module.api
	 */
	@Kroll.setProperty @Kroll.method
	public void setLength(int length)
	{
		resize(length);
	}

	public void resize(int length)
	{
		buffer = copyOf(buffer, length);
	}
}

