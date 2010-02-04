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
}
