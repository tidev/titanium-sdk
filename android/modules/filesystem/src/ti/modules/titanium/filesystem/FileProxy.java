/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiFileProxy;

@Kroll.proxy
public class FileProxy extends TiFileProxy
{
	private static final String LCAT = "FileProxy";

	public FileProxy(TiContext tiContext, String[] parts)
	{
		super(tiContext, parts, true);
	}
	
	public FileProxy(TiContext tiContext, String[] parts, boolean resolve)
	{
		super(tiContext, parts, resolve);
	}
}
