/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper2;

import android.net.Uri;

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
