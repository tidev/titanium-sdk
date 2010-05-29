/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.InputStream;
import java.io.IOException;

import org.appcelerator.titanium.io.TiBaseFile;

public abstract class TiFile extends TiProxy
{
	public TiFile(TiContext tiContext)
	{
		super(tiContext);
	}
	
	public abstract TiBaseFile getBaseFile();

	public InputStream getInputStream() throws IOException
	{
		return getBaseFile().getInputStream();
	}

	public String toString()
	{
		return "[object TiFile]";
	}
}
