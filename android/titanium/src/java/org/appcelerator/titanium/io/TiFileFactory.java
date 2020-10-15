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
	private static final String ANDROID_RESOURCE_URL_PREFIX = ANDROID_RESOURCE_URL_SCHEME + "://";
	private static final String APPDATA_URL_SCHEME = "appdata";
	private static final String APPDATA_URL_PREFIX = APPDATA_URL_SCHEME + "://";
	private static final String APPDATA_PRIVATE_URL_SCHEME = "appdata-private";
	private static final String APPDATA_PRIVATE_URL_PREFIX = APPDATA_PRIVATE_URL_SCHEME + "://";
	private static final String CONTENT_URL_SCHEME = ContentResolver.SCHEME_CONTENT;
	private static final String CONTENT_URL_PREFIX = CONTENT_URL_SCHEME + "://";
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
		String possibleURI = joinPathSegments(parts);
		String scheme = null;
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

		if (TiC.URL_APP_SCHEME.equals(scheme)) {
			return new TiResourceFile(trimFront(path, '/'));
		}

		if (APPDATA_PRIVATE_URL_SCHEME.equals(scheme)) {
			File f = new File(getDataDirectory(true), path);
			return new TiFile(f, possibleURI, stream);
		}

		if (APPDATA_URL_SCHEME.equals(scheme)) {
			File f = new File(getDataDirectory(false), path);
			return new TiFile(f, possibleURI, stream);
		}

		if (CONTENT_URL_SCHEME.equals(scheme) || ANDROID_RESOURCE_URL_SCHEME.equals(scheme)) {
			return new TiContentFile(possibleURI); // TODO: Forward along the actual URI instance?
		}

		if (FILE_URL_SCHEME.equals(scheme)) {
			// check for fake "file:///android_asset/Resources/" URL, treat like app:
			if (path.startsWith(ANDROID_ASSET_RESOURCES)) {
				// Strip this fake base path
				path = path.substring(ANDROID_ASSET_RESOURCES.length());
				return new TiResourceFile(trimFront(path, '/')); // remove leading '/' characters
			}

			// Normal file
			return new TiFile(new File(path), possibleURI, stream);
		}

		if (TI_URL_SCHEME.equals(scheme)) { // treat like appdata-private
			// TODO: Do we need to trim leading '/'?
			File f = new File(getDataDirectory(true), path);
			return new TiFile(f, possibleURI, stream);
		}

		// TODO: Throw an exception? Ideally this shouldn't ever happen, but could if an unhandled scheme URI came in here
		// i.e. http:, ftp:, https:, mailto:, etc.
		return null;
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
		TiFileHelper tfh = new TiFileHelper(TiApplication.getInstance());
		return tfh.getDataDirectory(privateStorage);
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
