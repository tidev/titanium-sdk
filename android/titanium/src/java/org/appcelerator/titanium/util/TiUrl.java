/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.net.URI;
import java.net.URISyntaxException;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;

import android.net.Uri;

/**
 * A normalizer, resolver, and holder for Titanium URLs
 */
public class TiUrl
{
	protected static final String TAG = "TiUrl";

	public static final String PATH_SEPARATOR = "/";
	public static final String SCHEME_SUFFIX = "://";
	public static final String PARENT_PATH = "..";
	public static final String CURRENT_PATH = ".";
	public static final String PARENT_PATH_WITH_SEPARATOR = "../";
	public static final String CURRENT_PATH_WITH_SEPARATOR = "./";
    

	public String baseUrl;
	public String url;

	public TiUrl(String url)
	{
		this(TiC.URL_APP_PREFIX, url);
	}

	public TiUrl(String baseUrl, String url)
	{
		this.baseUrl = (baseUrl == null) ? TiC.URL_APP_PREFIX : baseUrl;
		this.url = (url == null) ? "" : url;
	}

	public String getNormalizedUrl()
	{
		return normalizeWindowUrl(baseUrl, url).url;
	}

	protected static String parseRelativeBaseUrl(String path, String baseUrl, boolean checkAppPrefix) 
	{
		String[] right = path.split(PATH_SEPARATOR);
		String[] left = null;
		if (baseUrl.contains(SCHEME_SUFFIX)) {
			if (checkAppPrefix) {
				if (baseUrl.equals(TiC.URL_APP_PREFIX)) {
					left = new String[0];
				} else {
					int idx = baseUrl.indexOf(SCHEME_SUFFIX);
					left = baseUrl.substring(idx+3).split(PATH_SEPARATOR);
				}
			} else {
				String[] tmp = baseUrl.split(SCHEME_SUFFIX);
				if (tmp.length > 1) {
					left = tmp[1].split(PATH_SEPARATOR);
				} else {
					left = new String[0];
				}
			}
		} else {
			left = baseUrl.split(PATH_SEPARATOR);
		}

		int rIndex = 0;
		int lIndex = left.length;
		while(right[rIndex].equals(PARENT_PATH)) {
			lIndex--;
			rIndex++;
			if (rIndex > right.length-1) {
				break;
			}
		}
		String sep = "";
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < lIndex; i++) {
			sb.append(sep).append(left[i]);
			sep = PATH_SEPARATOR;
		}
		for (int i = rIndex; i < right.length; i++) {
			sb.append(sep).append(right[i]);
			sep = PATH_SEPARATOR;
		}
		String bUrl = sb.toString();
		if (!bUrl.endsWith(PATH_SEPARATOR)) {
			bUrl = bUrl + PATH_SEPARATOR;
		}
		return bUrl;
	}

	public static TiUrl createProxyUrl(String url)
	{
		if (url == null) {
			return new TiUrl(null);
		}

		int lastSlash = url.lastIndexOf(PATH_SEPARATOR);
		String baseUrl = url.substring(0, lastSlash + 1);
		if (baseUrl.length() == 0) {
			baseUrl = TiC.URL_APP_PREFIX;
		}

		String path = url.substring(lastSlash + 1);
		return new TiUrl(baseUrl, path);
	}

	public static TiUrl normalizeWindowUrl(String url) 
	{
		int lastSlash = url.lastIndexOf(PATH_SEPARATOR);
		String baseUrl = url.substring(0, lastSlash+1);
		if (baseUrl.length() == 0) {
			baseUrl = TiC.URL_APP_PREFIX;
		}
		return normalizeWindowUrl(baseUrl, url);
	}

	public static TiUrl normalizeWindowUrl(String baseUrl, String url)
	{
		Log.d(TAG, "Window Base URL: " + baseUrl, Log.DEBUG_MODE);
		if (url != null) {
			Log.d(TAG, "Window Relative URL: " + url, Log.DEBUG_MODE);
		}
		try {
			URI uri = new URI(url);
			String scheme = uri.getScheme();
			if (scheme == null) {
				String path = uri.getPath();
				String fname = null;
				if (path != null && path.startsWith(CURRENT_PATH_WITH_SEPARATOR)) {
					if (path.length() == 2) {
						path = "";
					} else {
						path = path.substring(2);
					}
				}
				int lastIndex = path.lastIndexOf(PATH_SEPARATOR);
				if (lastIndex > 0) {
					fname = path.substring(lastIndex+1);
					path = path.substring(0, lastIndex);
				} else {
					fname = path;
					path = null;
				}

				if (url.startsWith(PATH_SEPARATOR)) {
					baseUrl = path == null ? TiC.URL_APP_PREFIX : "app:/" + path;
					url = TiFileHelper2.joinSegments(baseUrl, fname);
				} else if (path == null && fname != null) {
					url = TiFileHelper2.joinSegments(baseUrl, fname);
				} else if (path.startsWith(PARENT_PATH_WITH_SEPARATOR)) {
					baseUrl = parseRelativeBaseUrl(path, baseUrl, true);
					baseUrl = TiC.URL_APP_PREFIX + baseUrl;
					url = TiFileHelper2.joinSegments(baseUrl, fname);
				} else {
					baseUrl = TiC.URL_APP_PREFIX + path;
					url = TiFileHelper2.joinSegments(baseUrl, fname);
				}
			} else if (TiC.URL_APP_SCHEME.equals(scheme)) {
				baseUrl = url;
			} else {
				throw new IllegalArgumentException("Scheme not implemented for " + url);
			}
		} catch (URISyntaxException e) {
			Log.w(TAG, "Error parsing url: " + e.getMessage());
		}
		return new TiUrl(baseUrl, url);
	}

	public String resolve()
	{
		return resolve(baseUrl, url, null);
	}

	public String resolve(String path)
	{
		return resolve(baseUrl, path, null);
	}

	public String resolve(String baseUrl, String path)
	{
		return resolve(baseUrl, path, null);
	}
	
	public static String resolve(String baseUrl, String path, String scheme)
	{
		if (!TiFileFactory.isLocalScheme(path)) {
			return path;
		}

		String result = null;
		if (scheme == null) {
			scheme = "app:";
		}
		if (path.startsWith(CURRENT_PATH_WITH_SEPARATOR)) {
			if (path.length() == 2) {
				path = "";
			} else {
				path = path.substring(2);
			}
		}
		if (path.contains(PARENT_PATH_WITH_SEPARATOR) || path.contains(CURRENT_PATH_WITH_SEPARATOR)) {
			path = absoluteUrl(scheme, path, baseUrl);
		}

		Uri uri = Uri.parse(path);
		if (uri.getScheme() == null) {
			if (!path.startsWith(PATH_SEPARATOR)) {
				result = baseUrl + path;
			} else {
				result = scheme + PATH_SEPARATOR + path;
			}
		} else {
			result = path;
		}

		if (!result.startsWith("file:")) {
			String[] p = { result };
			TiBaseFile tbf = TiFileFactory.createTitaniumFile(p, false);
			result = tbf.nativePath();
		}
		return result;
	}

	public static String absoluteUrl(String defaultScheme, String url, String baseUrl)
	{
		try {
			if ((baseUrl == null || baseUrl.length() == 0) && (url == null || url.length() == 0)) {
				return defaultScheme == null ? "" : defaultScheme + "//";
			}
			String combined = "";
			if (baseUrl == null || baseUrl.length() == 0) {
				combined = url;
			} else if (url == null || url.length() == 0) {
				combined = baseUrl;
			} else {
				URI uri = new URI(url);
				if (uri.getScheme() != null) {
					// the url already has a scheme, so we ignore the
					// baseUrl completely.
					combined = url;
				} else if (baseUrl.endsWith(PATH_SEPARATOR) && url.startsWith(PATH_SEPARATOR) 
						&& !baseUrl.equals("file://")) {
					if (baseUrl.length() == 1 && url.length() == 1) {
						combined = PATH_SEPARATOR;
					} else if (baseUrl.length() == 1) {
						combined = url;
					} else if (url.length() == 1) {
						combined = baseUrl;
					} else {
						combined = baseUrl + url.substring(1);
					}
				} else if (!baseUrl.endsWith(PATH_SEPARATOR) && !url.startsWith(PATH_SEPARATOR)) {
					combined = baseUrl + PATH_SEPARATOR + url;
				} else {
					combined = baseUrl + url;
				}
			}
			URI uri = new URI(combined);
			if (uri.getScheme() == null) {
				uri = uri.normalize();
			} else {
				String scheme = uri.getScheme() + "://";
				combined = combined.replace(scheme, "");
				uri = new URI(combined).normalize();
				uri = new URI(scheme + uri.toString());
			}
			if (uri.getScheme() == null) {
				return defaultScheme != null ? defaultScheme + "//" + uri.toString() : uri.toString();
			} else {
				return uri.toString();
			}
		} catch (URISyntaxException e) {
			Log.w(TAG, "Error parsing url: " + e.getMessage());
			return url;
		}
	}
	
	public static Uri getCleanUri(String argString) 
	{
		try {
			if (argString == null) {
				return null;
			}
			
			Uri base = Uri.parse(argString);
	
			Uri.Builder builder = base.buildUpon();
			builder.encodedQuery(Uri.encode(Uri.decode(base.getQuery()), "&="));
			String encodedAuthority = Uri.encode(Uri.decode(base.getAuthority()),"/:@");
			int firstAt = encodedAuthority.indexOf('@');
			if (firstAt >= 0) {
				int lastAt = encodedAuthority.lastIndexOf('@');
				if (lastAt > firstAt) {
					// We have a situation that might be like this:
					// http://user@domain.com:password@api.mickey.com
					// i.e., the user name is user@domain.com, and the host
					// is api.mickey.com.  We need all at-signs prior to the final one (which
					// indicates the host) to be encoded.
					encodedAuthority = Uri.encode(encodedAuthority.substring(0, lastAt), "/:") + encodedAuthority.substring(lastAt);
				}
			}
			builder.encodedAuthority(encodedAuthority);
			builder.encodedPath(Uri.encode(Uri.decode(base.getPath()), "/"));
			return builder.build();
		} catch (Exception e) {
			Log.e(TAG, "Exception in getCleanUri argString= " + argString);
			return null;
		}
	}
}
