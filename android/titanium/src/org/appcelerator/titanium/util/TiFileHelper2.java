/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TiC;

public class TiFileHelper2
{
	public static final String APP_SCHEME= "app://";

	/**
	 * Joins a path with a relative "Resources" folder
	 * @param path The path under Resources to get
	 * @return joinSegments("Resources", path)
	 */
	public static String getResourcesPath(String path)
	{
		return joinSegments("Resources", path);
	}

	/**
	 * Joins many String path segments into one path
	 * @param segments A vararg (or String array) of path segments
	 * @return The passed-in segements normalized and joined by "/"
	 */
	public static String joinSegments(String... segments)
	{
		if (segments.length <= 0) {
			return "";
		}

		String s1 = segments[0];
		for(int i = 1; i < segments.length; i++) {
			String s2 = segments[i];
			if (s1.endsWith("/")) {
				if (s2.startsWith("/")) {
					s1 = s1 + s2.substring(1);
				} else {
					s1 = s1 + s2;
				}
			} else {
				if (s2.startsWith("/")) {
					s1 = s1 + s2;
				} else {
					s1 = s1 + "/" + s2;
				}
			}
		}
		return s1;
	}

	/**
	 * Returns the "Resources" relative path of the passed in URL
	 * @param url A URL in either app:// or file:///android_asset/Resources form
	 * @return The path relative to the "Resources" folder, or null if the URL doesn't start with one of these prefixes
	 */
	public static String getResourceRelativePath(String url)
	{
		String relativePath = url;
		if (relativePath.startsWith(APP_SCHEME)) {
			relativePath = relativePath.substring(APP_SCHEME.length());

			// In some cases we might have a leading slash after the app:// URL
			// normalize by trimming the leading slash
			if (relativePath.length() > 0 && relativePath.charAt(0) == '/') {
				return relativePath.substring(1);
			} else {
				return relativePath;
			}
		} else if (relativePath.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			return relativePath.substring(TiC.URL_ANDROID_ASSET_RESOURCES.length());
		}
		return null;
	}

}
