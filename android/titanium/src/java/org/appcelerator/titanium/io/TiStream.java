/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.IOException;

/**
 * An interface designed to represent a Stream.
 */
public interface TiStream {
	/**
	 * Implementing classes should use this method to read data into a buffer.
	 * Refer to <a href="https://wiki.appcelerator.org/display/guides/Stream+Spec">Stream Spec</a> for more details.
	 * @param args  arguments passed in. Must match the arguments listed in the <a href="https://wiki.appcelerator.org/display/guides/Stream+Spec">Stream Spec</a>.
	 * @return number of bytes read, -1 if no data is available.
	 * @throws Exception on error.
	 */
	int read(Object[] args) throws Exception;

	/**
	 * [readSync description]
	 * @param  bufferProxy Expected to be a BufferProxy, but due to dependency cycle declared as Object
	 * @param  offset      [description]
	 * @param  length      [description]
	 * @return             [description]
	 * @throws IOException [description]
	 */
	int readSync(Object bufferProxy, int offset, int length) throws IOException;

	/**
	 * Implementing classes should use this method to write data from a buffer to this stream.
	 * Refer to <a href="https://wiki.appcelerator.org/display/guides/Stream+Spec">Stream Spec</a> for more details.
	 * @param args arguments passed in. Must match the arguments listed in the <a href="https://wiki.appcelerator.org/display/guides/Stream+Spec">Stream Spec</a>.
	 * @return number of bytes written, -1 if no data is available.
	 * @throws Exception on error.
	 */
	int write(Object[] args) throws Exception;

	/**
	 * [writeSync description]
	 * @param  bufferProxy Expected to be a BufferProxy, but due to dependency cycle declared as Object
	 * @param  offset      [description]
	 * @param  length      [description]
	 * @return             [description]
	 * @throws IOException [description]
	 */
	int writeSync(Object bufferProxy, int offset, int length) throws IOException;

	/**
	 * @return true if the stream is writable, false otherwise.
	 */
	boolean isWritable();

	/**
	 * @return true if the stream is readable, false otherwise.
	 */
	boolean isReadable();

	/**
	 * Implementing classes should use this method to close the stream.
	 * @throws IOException the thrown exception.
	 */
	void close(Object args[]) throws IOException;
}
