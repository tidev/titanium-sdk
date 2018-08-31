/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.io;

import java.io.File;
import java.util.Date;
import java.util.HashSet;

import org.appcelerator.kroll.common.Log;
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
		TiBaseFile file = null;

		String initial = parts[0];
		Log.d(TAG, "getting initial from parts: " + initial, Log.DEBUG_MODE);

		if (initial.startsWith(TiC.URL_APP_PREFIX)) {
			// This is an "app://" URL.
			String path = initial.substring(TiC.URL_APP_PREFIX.length());
			path = formPath(path, parts);
			path = trimFront(path, '/');
			file = new TiResourceFile(path);
		} else if (initial.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			// This is a "file:///android_asset/Resources/" URL.
			String path = initial.substring(TiC.URL_ANDROID_ASSET_RESOURCES.length());
			path = formPath(path, parts);
			path = trimFront(path, '/');
			file = new TiResourceFile(path);
		} else if (initial.startsWith(APPDATA_URL_PREFIX)) {
			// This is an "appdata://" URL.
			String path = initial.substring(APPDATA_URL_PREFIX.length());
			path = formPath(path, parts);
			File f = new File(getDataDirectory(false), path);
			file = new TiFile(f, APPDATA_URL_PREFIX + path, stream);
		} else if (initial.startsWith(APPDATA_PRIVATE_URL_PREFIX)) {
			// This is an "appdata-private://" URL.
			String path = initial.substring(APPDATA_PRIVATE_URL_PREFIX.length());
			path = formPath(path, parts);
			File f = new File(getDataDirectory(true), path);
			file = new TiFile(f, APPDATA_PRIVATE_URL_PREFIX + path, stream);
		} else if (initial.startsWith(FILE_URL_PREFIX)) {
			// This is a "file://" URL.
			String path = initial.substring(FILE_URL_PREFIX.length());
			path = formPath(path, parts);
			file = new TiFile(new File(path), FILE_URL_PREFIX + path, stream);
		} else if (initial.startsWith(CONTENT_URL_PREFIX)) {
			// This is a "content://" URL.
			String path = initial.substring(CONTENT_URL_PREFIX.length());
			path = formPath(path, parts);
			file = new TitaniumBlob(CONTENT_URL_PREFIX + path);
		} else if (initial.startsWith(ANDROID_RESOURCE_URL_PREFIX)) {
			// This is an "android.resource://" URL.
			String path = initial.substring(ANDROID_RESOURCE_URL_PREFIX.length());
			path = formPath(path, parts);
			file = new TitaniumBlob(ANDROID_RESOURCE_URL_PREFIX + path);
		} else if (initial.startsWith("/")) {
			String path = "";
			path = formPath(path, insertBefore(path, parts));
			file = new TiFile(new File(path), FILE_URL_PREFIX + path, stream);
		} else {
			String path = "";
			path = formPath(path, insertBefore(path, parts));
			File f = new File(getDataDirectory(true), path);
			file = new TiFile(f, APPDATA_PRIVATE_URL_PREFIX + path, stream);
		}

		return file;
	}

	private static String[] insertBefore(String path, String[] parts)
	{
		String[] p = new String[parts.length + 1];
		p[0] = path;
		for (int i = 0; i < parts.length; i++) {
			p[i + 1] = parts[i];
		}
		return p;
	}

	private static String formPath(String path, String parts[])
	{
		if (!path.endsWith("/") && path.length() > 0 && parts.length > 1) {
			path += "/";
		}
		for (int c = 1; c < parts.length; c++) {
			String part = parts[c];
			path += part;
			if (c + 1 < parts.length && !part.endsWith("/")) {
				path += "/";
			}
		}
		return path;
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
