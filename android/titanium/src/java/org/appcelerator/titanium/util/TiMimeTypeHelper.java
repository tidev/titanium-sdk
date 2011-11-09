/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.HashMap;

import android.webkit.MimeTypeMap;

public class TiMimeTypeHelper
{
	public static final String MIME_TYPE_JAVASCRIPT = "text/javascript";
	public static final String MIME_TYPE_HTML = "text/html";
	public static final HashMap<String, String> EXTRA_MIMETYPES = new HashMap<String, String>();
	static {
		EXTRA_MIMETYPES.put("js", MIME_TYPE_JAVASCRIPT);
		EXTRA_MIMETYPES.put("html", MIME_TYPE_HTML);
		EXTRA_MIMETYPES.put("htm", MIME_TYPE_HTML);
	}
	
	public static String getMimeType(String url) {
		return getMimeType(url, "application/octet-stream");
	}
	
	public static String getMimeTypeFromFileExtension(String extension, String defaultType) {
		MimeTypeMap mtm = MimeTypeMap.getSingleton();
		String mimetype = defaultType;

		if (extension != null) {
			String type = mtm.getMimeTypeFromExtension(extension);
			if (type != null) {
				mimetype = type;
			} else {
				String lowerExtension = extension.toLowerCase();
				if (EXTRA_MIMETYPES.containsKey(lowerExtension)) {
					mimetype = EXTRA_MIMETYPES.get(lowerExtension);
				}
			}
		}

		return mimetype;
	}
	
	public static String getMimeType(String url, String defaultType)
	{
		String extension = MimeTypeMap.getFileExtensionFromUrl(url);
		return getMimeTypeFromFileExtension(extension, defaultType);
	}
	
	public static String getFileExtensionFromMimeType(String mimeType, String defaultExtension)
	{
		String result = defaultExtension;
		String extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType);
		if (extension != null) {
			result = extension;
		} else {
			for (String ext : EXTRA_MIMETYPES.keySet()) {
				if (EXTRA_MIMETYPES.get(ext).equalsIgnoreCase(mimeType)) {
					return ext;
				}
			}
		}
		
		return result;
	}
	
	public static boolean isBinaryMimeType(String mimeType) {
		if (mimeType != null) {
			String parts[] = mimeType.split(";");
			mimeType = parts[0];
			
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
