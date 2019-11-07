/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashMap;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.io.TiFileProvider;

import android.content.ContentResolver;
import android.content.res.AssetFileDescriptor;
import android.graphics.BitmapFactory;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.webkit.MimeTypeMap;

public class TiMimeTypeHelper
{
	private static final String DEFAULT_MIME_TYPE = "application/octet-stream";
	public static final String MIME_TYPE_OCTET_STREAM = DEFAULT_MIME_TYPE;
	public static final String MIME_TYPE_JAVASCRIPT = "text/javascript";
	public static final String MIME_TYPE_HTML = "text/html";
	public static final HashMap<String, String> EXTRA_MIMETYPES = new HashMap<String, String>();
	static
	{
		EXTRA_MIMETYPES.put("js", MIME_TYPE_JAVASCRIPT);
		EXTRA_MIMETYPES.put("html", MIME_TYPE_HTML);
		EXTRA_MIMETYPES.put("htm", MIME_TYPE_HTML);
	}

	public static String getMimeType(String url)
	{
		return getMimeType(url, DEFAULT_MIME_TYPE);
	}

	public static String getMimeType(Uri uri)
	{
		return getMimeType(uri, DEFAULT_MIME_TYPE);
	}

	public static String getMimeTypeFromFileExtension(String extension, String defaultType)
	{
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

	public static String getFileExtensionFromUrl(String url)
	{
		if (url == null) {
			return null;
		}
		return getFileExtensionFrom(Uri.parse(url));
	}

	public static String getFileExtensionFrom(Uri uri)
	{
		// Validate argument.
		if (uri == null) {
			return null;
		}

		// Extract and decode the file path part of the URI. This will:
		// - Exclude the scheme, domain, anchor tag, and query parameters.
		// - Will decode the %-encoded characters in the URI.
		String path = uri.getPath();
		if (path == null) {
			return "";
		}

		// Extract the file extension, if it exists.
		// Note: Do not use the MimeTypeMap.getFileExtensionFromUrl() method here.
		//       It wrongly parses past the directory separator '/' character,
		//       which is an issue for "android.resource://" URIs used to access the APK's "res" files.
		int periodIndex = path.lastIndexOf('.');
		if ((periodIndex >= 0) && ((periodIndex + 1) < path.length())) {
			int slashIndex = path.lastIndexOf('/');
			if (slashIndex < periodIndex) {
				return path.substring(periodIndex + 1);
			}
		}
		return "";
	}

	public static String getMimeType(String url, String defaultType)
	{
		if ((url == null) || url.isEmpty()) {
			return defaultType;
		}
		return getMimeType(Uri.parse(url), defaultType);
	}

	public static String getMimeType(Uri uri, String defaultType)
	{
		// Validate.
		if (uri == null) {
			return defaultType;
		}

		// Determine if given URI references a file accessible via a ContentResolver/Provider or the file system.
		boolean isContent = false;
		boolean isExternalFile = false;
		String scheme = uri.getScheme();
		if (scheme == null) {
			// Assume we were given a file system path since the URI does not have a scheme.
			isExternalFile = true;
		} else if (scheme.equals(ContentResolver.SCHEME_FILE)) {
			// This is a "file://" URI.
			isExternalFile = true;
		} else if (scheme.equals(ContentResolver.SCHEME_CONTENT)) {
			// This is a "content://" URI.
			isContent = true;
		} else if (scheme.equals(ContentResolver.SCHEME_ANDROID_RESOURCE)) {
			// This is an "android.resource://" URI for APK "res" files. Can be accessed via ContentResolver.
			isContent = true;
		}

		// If given a "content://" URI, then attempt to fetch the mime type via ContentResolver/ContentProvider.
		// Note: Don't do this if given a TiFileProvider "content://" URI. It would trigger infinite recursion.
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		if (isContent && !TiFileProvider.isMyUri(uri)) {
			try {
				String mimeType = contentResolver.getType(uri);
				if (mimeType != null) {
					return mimeType;
				}
			} catch (Exception ex) {
			}
		}

		// Attempt to determine mime type from file extension, if it has one.
		String fileExtension = getFileExtensionFrom(uri);
		if ((fileExtension != null) && !fileExtension.isEmpty()) {
			String mimeType = getMimeTypeFromFileExtension(fileExtension, defaultType);
			if (mimeType != null) {
				return mimeType;
			}
		}

		// *** Given URI does not have a file extension. We don't know the file type. ***

		// Attempt to determine the file's mime type by scanning its binary.
		// This is worst-case scenario and typically only happens for URI's referencing APK "res" files.
		if (isContent || isExternalFile) {
			// If referencing an image file, the below will acquire the mime type.
			InputStream stream = null;
			try {
				if (isContent) {
					stream = contentResolver.openInputStream(uri);
				} else {
					stream = new FileInputStream(uri.getPath());
				}
				BitmapFactory.Options options = new BitmapFactory.Options();
				options.inJustDecodeBounds = true;
				BitmapFactory.decodeStream(stream, null, options);
				if (options.outMimeType != null) {
					return options.outMimeType;
				}
			} catch (Exception ex) {
			} finally {
				if (stream != null) {
					try {
						stream.close();
					} catch (Exception ex) {
					}
				}
			}

			// If referencing a video or audio file, the below will extract the mime type.
			MediaMetadataRetriever mediaRetriever = new MediaMetadataRetriever();
			try {
				if (isContent) {
					try (AssetFileDescriptor descriptor = contentResolver.openAssetFileDescriptor(uri, "r")) {
						if (descriptor != null) {
							mediaRetriever.setDataSource(descriptor.getFileDescriptor(), descriptor.getStartOffset(),
														 descriptor.getLength());
							String mimeType =
								mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_MIMETYPE);
							if (mimeType != null) {
								return mimeType;
							}
						}
					} catch (Exception ex) {
					}
					try (ParcelFileDescriptor descriptor = contentResolver.openFileDescriptor(uri, "r")) {
						if (descriptor != null) {
							mediaRetriever.setDataSource(descriptor.getFileDescriptor());
							String mimeType =
								mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_MIMETYPE);
							if (mimeType != null) {
								return mimeType;
							}
						}
					} catch (Exception ex) {
					}
				} else {
					mediaRetriever.setDataSource(uri.getPath());
					String mimeType = mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_MIMETYPE);
					if (mimeType != null) {
						return mimeType;
					}
				}
			} catch (Exception ex) {
			} finally {
				mediaRetriever.release();
			}
		}

		// Failed to determine the file's mime type. Return the given default.
		return defaultType;
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

	public static boolean isBinaryMimeType(String mimeType)
	{
		boolean isBinary = false;
		if ((mimeType != null) && !mimeType.isEmpty()) {
			String parts[] = mimeType.split(";");
			mimeType = parts[0];

			if (mimeType.startsWith("application/")) {
				if (!mimeType.endsWith("xml") && !mimeType.endsWith("json")) {
					isBinary = true;
				}
			} else if (mimeType.startsWith("image/")) {
				if (!mimeType.endsWith("xml")) {
					isBinary = true;
				}
			} else if (mimeType.startsWith("audio/")) {
				isBinary = true;
			} else if (mimeType.startsWith("font/")) {
				isBinary = true;
			} else if (mimeType.startsWith("video/")) {
				isBinary = true;
			}
		}
		return isBinary;
	}
}
