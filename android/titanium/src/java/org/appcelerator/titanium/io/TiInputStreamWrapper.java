/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.IOException;
import java.io.InputStream;

/**
 * Wraps an input stream, passing the calls through from this wrapper to the wrapped stream.
 * <p>
 * Can be assigned a "ClosedListener" which will be invoked when the stream wrapper is closed,
 * allowing the creator of the wrapper to perform additional cleanup. For example, the listener
 * could close an "HttpURLConnection" or "ZipFile" after the stream has been closed.
 */
public class TiInputStreamWrapper extends InputStream
{
	/** The input stream that is being wrapped. Can be null. */
	private InputStream inputStream;

	/** The listener to be invoked after the input stream has been closed. Can be null. */
	private ClosedListener closedListener;

	/** Listener to be invoked after the input stream has been closed. */
	public interface ClosedListener {
		/** Called "after" the input stream has been closed. */
		void onClosed();
	}

	/**
	 * Creates a new input stream wrapping the given input stream.
	 * @param inputStream The stream to be wrapped. Can be null, in which case, this wrapper's methods will no-op.
	 * @param closedListener Listener to be invoked after the stream has been closed. Can be null.
	 */
	public TiInputStreamWrapper(InputStream inputStream, ClosedListener closedListener)
	{
		super();

		this.inputStream = inputStream;
		this.closedListener = closedListener;
	}

	/**
	 * Gets an estimate of the number of bytes that can be read from the stream.
	 * @return
	 * Returns an estimate of the number of bytes that can be read.
	 * <p>
	 * Returns zero if the number of bytes are unknown, if the stream is closed,
	 * or if the wrapper was given a null stream reference.
	 */
	@Override
	public int available() throws IOException
	{
		if (this.inputStream != null) {
			return this.inputStream.available();
		}
		return 0;
	}

	/** Closes the input stream and releases any resources associated with it. */
	@Override
	public void close() throws IOException
	{
		// Close the input stream.
		if (this.inputStream != null) {
			this.inputStream.close();
		}

		// Notify the owner of this wrapper that the stream was closed.
		if (this.closedListener != null) {
			this.closedListener.onClosed();
		}
	}

	/**
	 * Marks the current position in the input stream so that a call to the reset() method will
	 * reposition the stream back to the given marked position.
	 * <p>
	 * This method does nothing if the stream's markSupported() method returns false.
	 * @param The maximum number of bytes that can be read before the mark position becomes invalid.
	 */
	@Override
	public void mark(int readLimit)
	{
		if (this.inputStream != null) {
			this.inputStream.mark(readLimit);
		}
	}

	/**
	 * Determines if the stream supports the mark() and reset() methods.
	 * @return Returns true if the mark() and reset() methods are supported. Returns false if not.
	 */
	@Override
	public boolean markSupported()
	{
		if (this.inputStream != null) {
			return this.inputStream.markSupported();
		}
		return false;
	}

	/**
	 * Reads and returns the next byte in the stream.
	 * Also moves the current position in the stream by one byte.
	 * @return
	 * Returns a value ranging between 0-255 if the next byte was successfully read.
	 * <p>
	 * Returns -1 if the end of the stream was reached or if the wrapper was given a null stream reference.
	 */
	@Override
	public int read() throws IOException
	{
		if (this.inputStream != null) {
			return this.inputStream.read();
		}
		return -1;
	}

	/**
	 * Reads bytes from the stream and copies them to the given byte array.
	 * @param byteBuffer The byte buffer to copy the read bytes to. Cannot be null or else an exception will be thrown.
	 * @param offset
	 * Index in the given "byteBuffer" array argument. This is the starting point where bytes will be copied to.
	 * Set to zero to copy bytes to the beginning of the array.
	 * <p>
	 * An "IndexOutOfBoundsException" will be thrown if this index goes beyond the bounds of the array.
	 * @param length
	 * The maximum number of bytes to read from stream. Note that the actual bytes read can be less than this.
	 * <p>
	 * Cannot be set less than zero or else an exception will be thrown.
	 * @return
	 * Returns the actual number of bytes read from the stream and copied to the given byte buffer array.
	 * Note that this value can be less than or equal to the given "length" argument.
	 * <p>
	 * Returns -1 if there is no more data to be read from the stream.
	 */
	@Override
	public int read(byte[] byteBuffer, int offset, int length)
		throws IOException, NullPointerException, IndexOutOfBoundsException
	{
		if (this.inputStream != null) {
			return this.inputStream.read(byteBuffer, offset, length);
		}
		return -1;
	}

	/**
	 * Reads bytes from the stream and copies them to the given byte array.
	 * @param byteBuffer The byte buffer to copy the read bytes to. Cannot be null or else an exception will be thrown.
	 * @return
	 * Returns the actual number of bytes read from the stream and copied to the given byte buffer array.
	 * Note that this value can be less than the length of the given array.
	 * <p>
	 * Returns -1 if there is no more data to be read from the stream.
	 */
	@Override
	public int read(byte[] byteBuffer) throws IOException, NullPointerException
	{
		if (this.inputStream != null) {
			return this.inputStream.read(byteBuffer);
		}
		return -1;
	}

	/**
	 * Moves the current position in the stream to the last marked position set using the mark() method.
	 * <p>
	 * This method does nothing if the stream's markSupported() method returns false.
	 */
	@Override
	public void reset() throws IOException
	{
		if (this.inputStream != null) {
			this.inputStream.reset();
		}
	}

	/**
	 * Skips over the given number of bytes in the stream.
	 * @param byteCount The number of bytes in the stream to skip.
	 * @return
	 * Returns the actual number of bytes skipped in the stream. This can be less than the number
	 * given in the argument if the end was reached or if not all bytes in the stream have been received yet.
	 * <p>
	 * Returns zero if give count is less than or equal to zero.
	 * Will also return zero if this wrapper was given a null stream reference.
	 */
	@Override
	public long skip(long byteCount) throws IOException
	{
		if (this.inputStream != null) {
			return this.inputStream.skip(byteCount);
		}
		return 0;
	}
}
