/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2019 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.io;

import java.io.File;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Date;
import java.util.HashSet;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiFileHelper;

import android.content.ContentResolver;
import android.net.Uri;

/**
 * A helper class used to create Titanium files.
 */
public class TiFileFactory
{
	private static final String TAG = "TiFileFactory";
	private static final String ANDROID_RESOURCE_URL_SCHEME = ContentResolver.SCHEME_ANDROID_RESOURCE;
	public static final String APPCACHE_EXTERNAL_URL_SCHEME = "appcache-external";
	public static final String APPDATA_URL_SCHEME = "appdata";
	public static final String APPDATA_PRIVATE_URL_SCHEME = "appdata-private";
	private static final String CONTENT_URL_SCHEME = ContentResolver.SCHEME_CONTENT;
	private static final String FILE_URL_SCHEME = ContentResolver.SCHEME_FILE;
	private static final String FILE_URL_PREFIX = FILE_URL_SCHEME + "://";
	// strip file:// prefix off the special URL we need to handle like app:
	private static final String ANDROID_ASSET_RESOURCES =
		TiC.URL_ANDROID_ASSET_RESOURCES.substring(FILE_URL_PREFIX.length());
	private static final String TI_URL_SCHEME = "ti";
	private static HashSet<String> localSchemeSet;

	static
	{
		localSchemeSet = new HashSet<String>();
		localSchemeSet.add(TiC.URL_APP_SCHEME.toLowerCase());
		localSchemeSet.add(APPCACHE_EXTERNAL_URL_SCHEME.toLowerCase());
		localSchemeSet.add(APPDATA_URL_SCHEME.toLowerCase());
		localSchemeSet.add(APPDATA_PRIVATE_URL_SCHEME.toLowerCase());
		localSchemeSet.add(FILE_URL_SCHEME.toLowerCase());
		localSchemeSet.add(ANDROID_RESOURCE_URL_SCHEME.toLowerCase());
	}

	/**
	 * Identical to {@link #createTitaniumFile(String[], boolean)} except that the path is passed in as a single
	 * string instead of an array of path components.
	 * @param path the path of the file
	 * @param stream this is not being used
	 * @return a TiBaseFile instance
	 * @module.api
	 */
	public static TiBaseFile createTitaniumFile(String path, boolean stream)
	{
		String[] parts = { path };
		return createTitaniumFile(parts, stream);
	}

	/**
	 * Creates a TiBaseFile object given the path. If the URI scheme portion of the passed path is not a member of:
	 * {"app://" , "appdata://" , "appdata-private://" , "file://", "content://", "android.resource://" },
	 * the file will be created in "appdata-private://" + path, where path is the given path.
	 * @param parts A String Array containing parts of a file path.
	 * @param stream this is not being used.
	 * @return a TiBaseFile instance.
	 * @module.api
	 */
	public static TiBaseFile createTitaniumFile(String[] parts, boolean stream)
	{
		// Parse for the URL scheme and file path.
		String possibleURI = joinPathSegments(parts);
		String scheme = "";
		String path = "";
		int colonIndex = possibleURI.indexOf(':');
		if (colonIndex != -1) {
			// probably a URI
			try {
				URI uri = new URI(possibleURI);
				scheme = uri.getScheme().toLowerCase();
				path = uri.getSchemeSpecificPart();
			} catch (URISyntaxException use) {
				// not a valid one!
				// TODO: Maybe we can encode each segment in joinPathSegments to help avoid this?
				// hack to grab scheme and path ourselves
				scheme = possibleURI.substring(0, colonIndex);
				path = possibleURI.substring(colonIndex + 1);
			}
			// if there was a "//" after the scheme, strip it to get path
			if (path.startsWith("//")) {
				path = path.substring(2);
			}
		} else {
			// no ':', so no scheme! make the whole thing the path.
			path = possibleURI;
			if (path.startsWith("/")) { // absolute path, so assume file:
				scheme = FILE_URL_SCHEME;
			} else { // relative looking path, so assume appdata-private:
				scheme = APPDATA_PRIVATE_URL_SCHEME;
			}
		}

		// Create a Titanium file object capable of accessing the file referenced by given URL.
		TiBaseFile tiFile = null;
		switch (scheme) {
			case TiC.URL_APP_SCHEME: {
				tiFile = new TiResourceFile(trimFront(path, '/'));
				break;
			}
			case APPCACHE_EXTERNAL_URL_SCHEME: {
				File cacheDir = TiApplication.getInstance().getExternalCacheDir();
				if (cacheDir != null) {
					File file = new File(cacheDir, path);
					tiFile = new TiFile(file, possibleURI, stream);
				}
				break;
			}
			case APPDATA_URL_SCHEME:            // Use external storage.
			case APPDATA_PRIVATE_URL_SCHEME:    // Use internal storage.
			case TI_URL_SCHEME: {               // Use internal storage.
				boolean isInternal = !scheme.equals(APPDATA_URL_SCHEME);
				File dataDir = getDataDirectory(isInternal);
				if (dataDir != null) {
					File file = new File(dataDir, path);
					tiFile = new TiFile(file, possibleURI, stream);
				}
				break;
			}
			case CONTENT_URL_SCHEME:
			case ANDROID_RESOURCE_URL_SCHEME: {
				tiFile = new TiContentFile(possibleURI);
				break;
			}
			case FILE_URL_SCHEME: {
				if (path.startsWith(ANDROID_ASSET_RESOURCES)) {
					// This is a "file:///android_asset/Resources/" referencing an APK "assets" file.
					path = path.substring(ANDROID_ASSET_RESOURCES.length());
					tiFile = new TiResourceFile(trimFront(path, '/'));
				} else {
					// This is a normal file system path.
					tiFile = new TiFile(new File(path), possibleURI, stream);
				}
				break;
			}
		}

		// Create a mock file object whose methods no-op if we failed to handle given path. Can happen if:
		// - Given an invalid/unknown URL scheme.
		// - Unable to access destination, such as external storage not being available.
		if (tiFile == null) {
			tiFile = new TiMockFile(possibleURI);
		}

		// Return a TiBaseFile wrapping the given path. Will never be null.
		return tiFile;
	}

	private static String joinPathSegments(String[] parts)
	{
		if (parts.length == 1) {
			return parts[0]; // common base case
		}

		StringBuilder path = new StringBuilder();
		for (int c = 0; c < parts.length; c++) {
			String part = parts[c];
			path.append(part);
			// for all but last segment, insert file separator if not already there
			if (c + 1 < parts.length && !part.endsWith("/")) {
				path.append("/");
			}
		}
		return path.toString();
	}

	/**
	 * Removes all characters matching the given "trimCharacter" from the front of given "sourceString"
	 * and returns the result.
	 * @param sourceString The string to have characters trimmed from. Can be empty or null.
	 * @param trimCharacter The character to be trimmed from given "sourceString".
	 * @return
	 * Returns a new string if characters were trimmed from the front.
	 * Returns the same string reference if no characters were trimmed.
	 * Returns null if given a null string.
	 */
	private static String trimFront(String sourceString, char trimCharacter)
	{
		if (sourceString != null) {
			int index = 0;
			while ((index < sourceString.length()) && (sourceString.charAt(index) == trimCharacter)) {
				index++;
			}
			if (index > 0) {
				if (index < sourceString.length()) {
					sourceString = sourceString.substring(index);
				} else {
					sourceString = "";
				}
			}
		}
		return sourceString;
	}

	/**
	 * Retrieves/creates a data directory in which the application can place its own custom data files.
	 * Refer to {@link TiFileFactory#getDataDirectory(boolean)} for more details.
	 * @param privateStorage  determines the location of the data directory. If this is true, the location is internal(app-data://),
	 * and external (SD) otherwise.
	 * @return  the data directory.
	 * @module.api
	 */
	public static File getDataDirectory(boolean privateStorage)
	{
		return TiFileHelper.getInstance().getDataDirectory(privateStorage);
	}

	public static boolean isLocalScheme(String url)
	{
		Uri uri = Uri.parse(url);
		String scheme = uri.getScheme();

		if (scheme == null) {
			return true;
		}

		return TiFileFactory.localSchemeSet.contains(scheme.toLowerCase());
	}

	public static File createDataFile(String prefix, String suffix)
	{
		String filename = prefix + (new Date()).getTime() + suffix;
		return new File(getDataDirectory(true), filename);
	}
}
