/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.util.TiUrl;

@Kroll.proxy(parentModule=FilesystemModule.class)
public class FileProxy extends TiFileProxy
{
	private static final String LCAT = "FileProxy";

	public FileProxy(String sourceUrl, String[] parts)
	{
		super(sourceUrl, parts, true);
	}
	
	public FileProxy(String sourceUrl, String[] parts, boolean resolve)
	{
		super(sourceUrl, parts, resolve);
	}
}
