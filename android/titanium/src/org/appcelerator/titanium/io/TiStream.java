/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.IOException;

import org.appcelerator.titanium.proxy.BufferProxy;


public interface TiStream
{
	int read(BufferProxy buffer) throws IOException;
	int read(BufferProxy buffer, int offset, int length) throws IOException;
	int write(BufferProxy buffer) throws IOException;
	int write(BufferProxy buffer, int offset, int length) throws IOException;
	boolean isWriteable();
	boolean isReadable();
}

