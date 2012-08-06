/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiFileProxy;

@Kroll.proxy(parentModule=FilesystemModule.class)
public class FileProxy extends TiFileProxy
{

	public FileProxy(String sourceUrl, String[] parts)
	{
		super(sourceUrl, parts, true);
	}

	public FileProxy(TiContext tiContext, String[] parts)
	{
		super(tiContext.getBaseUrl(), parts, true);
	}

	public FileProxy(String sourceUrl, String[] parts, boolean resolve)
	{
		super(sourceUrl, parts, resolve);
	}

	public FileProxy(TiContext tiContext, String[] parts, boolean resolve)
	{
		super(tiContext.getBaseUrl(), parts, resolve);
	}
}
