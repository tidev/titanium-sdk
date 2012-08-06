/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.io;

import java.io.File;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiFileHelper;

import android.net.Uri;

/**
 * A helper class used to create Titanium files.
 */
public class TiFileFactory
{
	private static final String TAG = "TiFileFactory";

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
	 * {"app://" , "appdata://" , "appdata-private://" , "file://", "content://" }, 
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

		if (initial.startsWith("app://")) {
			String path = initial.substring(6);
			path = formPath(path,parts);
			file = new TiResourceFile(path);
		} else if (initial.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			String path = initial.substring(32);
			path = formPath(path,parts);
			file = new TiResourceFile(path);
		} else if (initial.startsWith("appdata://")) {
			String path = initial.substring(10);
			path = formPath(path,parts);
			if (path != null && path.length() > 0 && path.charAt(0)=='/')
			{
				path = path.substring(1);
			}
			File f = new File(getDataDirectory(false),path);
			file = new TiFile(f, "appdata://"+path, stream);
		} else if (initial.startsWith("appdata-private://")) {
			String path = initial.substring(18);
			path = formPath(path,parts);
			File f = new File(getDataDirectory(true),path);
			file = new TiFile(f, "appdata-private://"+path, stream);
		} else if (initial.startsWith("file://")) {
			String path = initial.substring(7);
			path = formPath(path, parts);
			file = new TiFile(new File(path), "file://" + path, stream);
		} else if (initial.startsWith("content://")) {
			String path = initial.substring(10);
			path = formPath(path, parts);
			file = new TitaniumBlob("content://" + path);
		} else if (initial.startsWith("/")) {
			String path = "";

			path = formPath(path, insertBefore(path,parts));
			file = new TiFile(new File(path), "file://" + path, stream);
		} else {
			String path = "";
			path = formPath(path,insertBefore(path,parts));
			File f = new File(getDataDirectory(true),path);
			file = new TiFile(f, "appdata-private://"+path, stream);
		}

		return file;
	}

	private static String[] insertBefore(String path, String[] parts) {
		String[] p = new String[parts.length + 1];
		p[0] = path;
		for(int i = 0; i < parts.length; i++) {
			p[i+1] = parts[i];
		}
		return p;
	}

	private static String formPath(String path, String parts[])
	{
		if (!path.endsWith("/") && path.length() > 0 && parts.length > 1)
		{
			path+="/";
		}
		for (int c=1;c<parts.length;c++)
		{
			String part = parts[c];
			path += part;
			if (c+1<parts.length && !part.endsWith("/"))
			{
				path+="/";
			}
		}
		return path;
	}

	/**
	 * Retrieves/creates a data directory in which the application can place its own custom data files.
	 * Refer to {@link TiFileFactory#getDataDirectory(boolean)} for more details.
	 * @param privateStorage  determines the location of the data directory. If this is true, the location is internal(app-data://),
	 * and external (SD) otherwise.
	 * @return  the data directory.
	 * @module.api
	 */
	public static File getDataDirectory (boolean privateStorage)
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

		scheme = scheme.toLowerCase();
		if ("app".equals(scheme) || "appdata".equals(scheme) || "appdata-private".equals(scheme) ||
			"file".equals(scheme) || "content".equals(scheme))
		{
			return true;
		}

		return false;
	}

}
