/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.util.HashMap;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
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
					left = baseUrl.substring(idx + 3).split(PATH_SEPARATOR);
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
		while (right[rIndex].equals(PARENT_PATH)) {
			lIndex--;
			rIndex++;
			if (rIndex > right.length - 1) {
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

	private static final HashMap<String, TiUrl> proxyUrlCache = new HashMap<>(5);
	public static TiUrl createProxyUrl(String url)
	{
		if (proxyUrlCache.containsKey(url)) {
			return proxyUrlCache.get(url);
		}

		if (url == null) {
			return new TiUrl(null);
		}

		int lastSlash = url.lastIndexOf(PATH_SEPARATOR);
		String baseUrl = url.substring(0, lastSlash + 1);
		if (baseUrl.length() == 0) {
			baseUrl = TiC.URL_APP_PREFIX;
		}

		String path = url.substring(lastSlash + 1);
		TiUrl result = new TiUrl(baseUrl, path);
		proxyUrlCache.put(url, result);
		return result;
	}

	public static TiUrl normalizeWindowUrl(String url)
	{
		int lastSlash = url.lastIndexOf(PATH_SEPARATOR);
		String baseUrl = url.substring(0, lastSlash + 1);
		if (baseUrl.length() == 0) {
			baseUrl = TiC.URL_APP_PREFIX;
		}
		return normalizeWindowUrl(baseUrl, url);
	}

	public static TiUrl normalizeWindowUrl(String baseUrl, String url)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Window Base URL: " + baseUrl, Log.DEBUG_MODE);
			if (url != null) {
				Log.d(TAG, "Window Relative URL: " + url, Log.DEBUG_MODE);
			}
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
					fname = path.substring(lastIndex + 1);
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

		if (path.startsWith("android.resource://" + TiApplication.getInstance().getPackageName() + "/raw/")) {
			Uri upath = Uri.parse(path);
			String fileName = upath.getLastPathSegment();

			int lastPeriodPos = fileName.lastIndexOf('.');
			String fileNameWithoutExt;
			if (lastPeriodPos <= 0) {
				fileNameWithoutExt = fileName;
			} else {
				fileNameWithoutExt = fileName.substring(0, lastPeriodPos);
			}
			String newPath = path.substring(0, path.length() - fileName.length()) + fileNameWithoutExt;
			return newPath;
		}

		String result = null;
		if (scheme == null) {
			scheme = "app:";
		}
		while (path.startsWith(CURRENT_PATH_WITH_SEPARATOR)) {
			if (path.length() <= CURRENT_PATH_WITH_SEPARATOR.length()) {
				path = "";
			} else {
				path = path.substring(CURRENT_PATH_WITH_SEPARATOR.length());
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
					// The URL already has a scheme. So, we ignore the base URL completely.
					combined = url;
				} else if (url.startsWith(PATH_SEPARATOR)) {
					// The URL is an absolute path. Not relative to base URL.
					// Note: A "file:///" URL needs 3 slashes to reference localhost.
					if (defaultScheme != null) {
						combined = defaultScheme + PATH_SEPARATOR;
						if (defaultScheme.equals("file:")) {
							combined += PATH_SEPARATOR;
						}
						combined += url;
					} else {
						combined = url;
					}
				} else if (!baseUrl.endsWith(PATH_SEPARATOR)) {
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

	/**
	 * Converts the given URL string to a "Uri" object.
	 * <p>
	 * Will automatically encode characters in the given URL except for lone '%' characters.
	 * '%' characters must be encoded by the caller as "%25". This method will also accept
	 * a URL already containing %-encoded characters in it and they will be unaltered.
	 * @param argString URL in string form.
	 * @return
	 * Returns the given URL string as a Uri encoded object.
	 * <p>
	 * Returns null if given an invalid URL or if the string is null/empty.
	 */
	public static Uri getCleanUri(String argString)
	{
		// Validate argument.
		if ((argString == null) || (argString.length() <= 0)) {
			return null;
		}

		// Attempt to auto-encode and convert the given URL string to a Uri object.
		// Note: The below should NEVER decode %-encoded characters in the given URL.
		//       We can preserve the original %-encoded characters by allowing their '%' signs
		//       to be encoded to "%25" and then doing a substring replace of "%25" back to '%'.
		Uri encodedUri = null;
		try {
			// Parse the given URL string.
			Uri uri = Uri.parse(argString);

			// Start generating an encoded Uri.
			Uri.Builder uriBuilder = new Uri.Builder();

			// Copy the given URL scheme as-is.
			uriBuilder.scheme(uri.getScheme());

			// Copy and encode the "username:password@host:port" part of the URL.
			String authority = uri.getEncodedAuthority();
			if (authority != null) {
				// We need to extract the following components from the URL's authority string.
				// This is because they need to be encoded separately.
				// Also because Google's "Uri" class parses these components incorrectly for IPv6 URLs.
				String userInfoString = null;
				String hostName = null;
				String portNumberString = null;

				// Copy the authority string to a mutable string builder.
				// We do this because extracted URL compents will be deleted from this string builder.
				StringBuilder stringBuilder = new StringBuilder(authority);

				// Extract the optional "username:password" part.
				// Note: This might be an e-mail address such as "http://user@domain.com:pwd@host.com".
				//       This means we need to look for the last '@' sign in the authority string.
				int index = stringBuilder.lastIndexOf("@");
				if (index >= 0) {
					userInfoString = (index > 0) ? stringBuilder.substring(0, index) : "";
					stringBuilder.delete(0, index + 1);
				}

				// Extract the optional port number at the end of the authority string.
				// Note: Make sure the ':' is to the right of an IPv6 address. Ex: "http://[::1]:80"
				index = stringBuilder.lastIndexOf(":");
				if ((index >= 0) && (stringBuilder.indexOf("]", index) < 0)) {
					if ((index + 1) < stringBuilder.length()) {
						portNumberString = stringBuilder.substring(index + 1);
					}
					stringBuilder.delete(index, stringBuilder.length());
				}

				// Extract the host name from the URL. (This must be done last.)
				hostName = stringBuilder.toString();

				// Clear the string builder and copy the authority part back to it in encoded form.
				stringBuilder.delete(0, stringBuilder.length());
				if (userInfoString != null) {
					// Append the "username:password" part in encoded form.
					// This will also encode an e-mail account's '@' sign, which is extremly important.
					// Example: "user@domain.com:password@" -> "user%40domain.com:password@"
					userInfoString = Uri.encode(userInfoString, "!$&'()*+,;=:");
					userInfoString = userInfoString.replace("%25", "%"); // Restore %-encoded chars.
					stringBuilder.append(userInfoString);
					stringBuilder.append('@');
				}
				if (hostName != null) {
					// Append the host name in encoded form.
					// Do not encode IPv6 URL characters. Example: http://[2001:db8:a0b:12f0::1]
					hostName = Uri.encode(hostName, ":[]");
					hostName = hostName.replace("%25", "%"); // Restore %-encoded chars in original URL.
					stringBuilder.append(hostName);
				}
				if (portNumberString != null) {
					// Append the port number as-is.
					stringBuilder.append(':');
					stringBuilder.append(portNumberString);
				}
				uriBuilder.encodedAuthority(stringBuilder.toString());
			}

			// Copy and encode the URL's path.
			// Example: <Scheme>://<Authority>/<Path>?<AueryParams>#<Fragment>
			String path = uri.getEncodedPath();
			if ((path != null) && (path.length() > 0)) {
				// Encode the given path.
				path = Uri.encode(path, "!$&'()*+,;=:@/");
				path = path.replace("%25", "%"); // Restore %-encoded chars in original URL.
				uriBuilder.encodedPath(path);
			} else if (uri.getEncodedQuery() != null) {
				// The URL has query params, but no path or slash. Inject a '/' before the '?'.
				// --------------------------------------------------------------------------------
				// This works-around a Java URL parsing bug where...
				// > "http://test.com?test=abc/xyz"
				// ...will be transmitted like this...
				// > "http://test.com/xyz?test=abc/xyz"
				// --------------------------------------------------------------------------------
				uriBuilder.encodedPath("/");
			}

			// Copy and encode the URL's anchor tag.
			// This is the part that proceeds the '#' part of the URL.
			String fragment = uri.getEncodedFragment();
			if (fragment != null) {
				fragment = Uri.encode(fragment, "!$&'()*+,;=:@/?");
				fragment = fragment.replace("%25", "%"); // Restore %-encoded chars in original URL.
				uriBuilder.encodedFragment(fragment);
			}

			// Copy and encode the URL's query parameters.
			// Note: Do not use Uri.encode() here. It encodes URL paths according to "RFC 2396".
			//       Query parameters must be encoded via Java's URLEncoder instead which
			//       encodes according to the "application/x-www-form-urlencoded" MIME format.
			String queryString = uri.getEncodedQuery();
			if ((queryString != null) && (queryString.length() > 0)) {
				// Encode the query parameters string.
				queryString = URLEncoder.encode(queryString, "utf8");

				// The above is overly aggressive and encodes "legal" characters. Convert them back.
				// This is important because some servers won't accept these characters in encoded form.
				queryString = queryString.replace("%21", "!");
				queryString = queryString.replace("%24", "$");
				queryString = queryString.replace("%26", "&");
				queryString = queryString.replace("%27", "'");
				queryString = queryString.replace("%28", "(");
				queryString = queryString.replace("%29", ")");
				queryString = queryString.replace("%2B", "+");
				queryString = queryString.replace("%2b", "+");
				queryString = queryString.replace("%2C", ",");
				queryString = queryString.replace("%2c", ",");
				queryString = queryString.replace("%2F", "/");
				queryString = queryString.replace("%2f", "/");
				queryString = queryString.replace("%3A", ":");
				queryString = queryString.replace("%3a", ":");
				queryString = queryString.replace("%3B", ";");
				queryString = queryString.replace("%3b", ";");
				queryString = queryString.replace("%3D", "=");
				queryString = queryString.replace("%3d", "=");
				queryString = queryString.replace("%3F", "?");
				queryString = queryString.replace("%3f", "?");
				queryString = queryString.replace("%40", "@");

				// Convert encoded '%' signs back. (This must be done after the conversions above.)
				// This preserves the encoded characters in the original URL string.
				queryString = queryString.replace("%25", "%");

				// Copy the encoded query parameters to the URI builder.
				uriBuilder.encodedQuery(queryString);
			}

			// Create an encoded Uri object.
			encodedUri = uriBuilder.build();
		} catch (Exception ex) {
			Log.e(TAG, "Exception in getCleanUri argString= " + argString);
		}
		return encodedUri;
	}
}
