/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.IOException;


public interface TiStream
{
	int read(Object args[]) throws IOException;
	int write(Object args[]) throws IOException;
	boolean isWritable();
	boolean isReadable();
	void close() throws IOException;
}

