/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.IOException;

/**
 * An interface designed to read/write from a stream object.
 */
public interface TiStream
{
	/**
	 * Implementing classes should use this method to read data from a stream into a buffer.
	 * This should be done asynchronously.
	 * @param args  arguments should include a stream object to read from and a buffer object to read into.
	 * @return an int.
	 * @throws IOException
	 */
	int read(Object args[]) throws IOException;
	
	/**
	 * Implementing classes should use this method to write data from a buffer into an outputStream.
	 * This should be done asynchronously.
	 * @param args the args should include a stream object to write into and a buffer object to write from
	 * @return an int.
	 * @throws IOException
	 */
	int write(Object args[]) throws IOException;
	
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
	void close() throws IOException;
}

