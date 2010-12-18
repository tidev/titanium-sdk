/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.net.URI;
import java.net.URISyntaxException;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;

import android.net.Uri;

/**
 * A normalizer, resolver, and holder for Titanium URLs
 */
public class TiUrl {
	protected static final String TAG = "TiUrl";
	protected static final boolean DBG = TiConfig.LOGD;

	public String baseUrl;
	public String url;

	public TiUrl(String url) {
		this(TiC.URL_APP_PREFIX, url);
	}

	public TiUrl(String baseUrl, String url) {
		this.baseUrl = baseUrl;
		this.url = url;
	}

	protected static String parseRelativeBaseUrl(String path, String baseUrl, boolean checkAppPrefix) {
		String[] right = path.split("/");
		String[] left = null;
		if (baseUrl.contains("://")) {
			if (checkAppPrefix) {
				if (baseUrl.equals(TiC.URL_APP_PREFIX)) {
					left = new String[0];
				} else {
					int idx = baseUrl.indexOf("://");
					left = baseUrl.substring(idx+3).split("/");
				}
			} else {
				String[] tmp = baseUrl.split("://");
				if (tmp.length > 1) {
					left = tmp[1].split("/");
				} else {
					left = new String[0];
				}
			}
		} else {
			left = baseUrl.split("/");
		}

		int rIndex = 0;
		int lIndex = left.length;
		while(right[rIndex].equals("..")) {
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
			sep = "/";
		}
		for (int i = rIndex; i < right.length; i++) {
			sb.append(sep).append(right[i]);
			sep = "/";
		}
		String bUrl = sb.toString();
		if (!bUrl.endsWith("/")) {
			bUrl = bUrl + "/";
		}
		return bUrl;
	}

	public static TiUrl normalizeWindowUrl(String url) {
		int lastSlash = url.lastIndexOf('/');
		String baseUrl = url.substring(0, lastSlash+1);
		if (baseUrl.length() == 0) {
			baseUrl = TiC.URL_APP_PREFIX;
		}
		return normalizeWindowUrl(baseUrl, url);
	}

	public static TiUrl normalizeWindowUrl(String baseUrl, String url) {
		if (DBG) {
			Log.d(TAG, "Window Base URL: " + baseUrl);
			if (url != null) {
				Log.d(TAG, "Window Relative URL: " + url);
			}
		}
		try {
			URI uri = new URI(url);
			String scheme = uri.getScheme();
			if (scheme == null) {
				String path = uri.getPath();
				String fname = null;
				if (path != null && path.startsWith("./")) {
					if (path.length() == 2) {
						path = "";
					} else {
						path = path.substring(2);
					}
				}
				int lastIndex = path.lastIndexOf("/");
				if (lastIndex > 0) {
					fname = path.substring(lastIndex+1);
					path = path.substring(0, lastIndex);
				} else {
					fname = path;
					path = null;
				}

				if (url.startsWith("/")) {
					baseUrl = "app:/" + path;
					url = TiFileHelper2.joinSegments(baseUrl, fname);
				} else if (path == null && fname != null) {
					url = TiFileHelper2.joinSegments(baseUrl, fname);
				} else if (path.startsWith("../")) {
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
			Log.w(TAG, "Error parsing url: " + e.getMessage(), e);
		}
		return new TiUrl(baseUrl, url);
	}

	public String resolve(TiContext context) {
		return resolve(context, baseUrl, url, null);
	}
	public String resolve(TiContext context, String path) {
		return resolve(context, baseUrl, path, null);
	}

	public String resolve(TiContext context, String baseUrl, String path) {
		return resolve(context, baseUrl, path, null);
	}
	
	public String resolve(TiContext context, String baseUrl, String path, String scheme) {
		if (!TiFileFactory.isLocalScheme(path)) {
			return path;
		}

		String result = null;
		if (scheme == null) {
			scheme = "app:";
		}
		if (path.startsWith("./")) {
			if (path.length() == 2) {
				path = "";
			} else {
				path = path.substring(2);
			}
		}
		if (path.startsWith("../")) {
			path = absoluteUrl(scheme, path, baseUrl);
		}

		Uri uri = Uri.parse(path);
		if (uri.getScheme() == null) {
			if (!path.startsWith("/")) {
				result = baseUrl + path;
			} else {
				result = scheme + "/" + path;
			}
		} else {
			result = path;
		}

		if (!result.startsWith("file:")) {
			String[] p = { result };
			TiBaseFile tbf = TiFileFactory.createTitaniumFile(context, p, false);
			result = tbf.nativePath();
		}
		return result;
	}

	public String absoluteUrl(String defaultScheme, String url, String baseUrl) {
		try {
			URI uri = new URI(url);
			String scheme = uri.getScheme();
			if (scheme == null) {
				String path = uri.getPath();
				String fname = null;
				int lastIndex = path.lastIndexOf("/");
				if (lastIndex > 0) {
					fname = path.substring(lastIndex+1);
					path = path.substring(0, lastIndex);
				}
				if (path.startsWith("../") || path.equals("..")) {
					String bUrl = parseRelativeBaseUrl(path, baseUrl, false);
					url = TiFileHelper2.joinSegments(defaultScheme + "//", bUrl, fname);
				}
			}
		} catch (URISyntaxException e) {
			Log.w(TAG, "Error parsing url: " + e.getMessage(), e);
		}
		return url;
	}
}
