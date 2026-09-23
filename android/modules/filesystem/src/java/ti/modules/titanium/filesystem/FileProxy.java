/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiFileProxy;

@Kroll.proxy(parentModule = FilesystemModule.class)
public class FileProxy extends TiFileProxy
{

	public FileProxy(String sourceUrl, String[] parts)
	{
		super(sourceUrl, parts, true);
	}

	public FileProxy(String sourceUrl, String[] parts, boolean resolve)
	{
		super(sourceUrl, parts, resolve);
	}

	@Override
	public String getApiName()
	{
		return "Ti.Filesystem.File";
	}
}
