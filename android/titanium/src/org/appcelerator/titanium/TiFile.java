/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.io.TiBaseFile;

public abstract class TiFile extends KrollProxy
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
