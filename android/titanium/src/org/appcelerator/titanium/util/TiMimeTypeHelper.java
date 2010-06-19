/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.webkit.MimeTypeMap;

public class TiMimeTypeHelper
{
	public static String getMimeType(String url) {
		return getMimeType(url, "application/octet-stream");
	}
	
	public static String getMimeType(String url, String defaultType)
	{
 		MimeTypeMap mtm = MimeTypeMap.getSingleton();
		String extension = MimeTypeMap.getFileExtensionFromUrl(url);
		String mimetype = defaultType;

		if (extension != null) {
			String type = mtm.getMimeTypeFromExtension(extension);
			if (type != null) {
				mimetype = type;
			}
		}

		return mimetype;
	}
	
	public static String getFileExtensionFromMimeType(String mimeType, String defaultExtension)
	{
		String result = defaultExtension; 		
		String extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType);
		if (extension != null) {
			result = extension;
		}
		
		return result;
	}
	
	
	
	public static boolean isBinaryMimeType(String mimeType) {
		if (mimeType != null) {
			if (mimeType.startsWith("application/") && !mimeType.endsWith("xml"))
			{
				return true;
			}
			else if (mimeType.startsWith("image/") && !mimeType.endsWith("xml"))
			{
				return true;
			}
			else if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) 
			{
				return true;
			}
			else return false;
		}
		return false;
	}
}
