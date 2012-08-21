/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.utils;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

@Kroll.proxy(creatableInModule = UtilsModule.class, propertyAccessors = { TiC.PROPERTY_URL })
public class ExifDataProxy extends KrollProxy
{
	TiExifData exifData;

	public ExifDataProxy()
	{
		exifData = new TiExifData(this);
		setModelListener(exifData);
	}

	@Kroll.method
	public String getAttribute(String attribute)
	{
		return getExifData().getAttribute(attribute);
	}

	protected TiExifData getExifData()
	{
		if (exifData == null) {
			exifData = new TiExifData(this);
			setModelListener(exifData);
		}
		return exifData;
	}
}
