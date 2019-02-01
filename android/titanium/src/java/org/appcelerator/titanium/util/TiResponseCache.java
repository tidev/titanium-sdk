/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.CacheRequest;
import java.net.CacheResponse;
import java.net.HttpURLConnection;
import java.net.ResponseCache;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.zip.GZIPInputStream;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.os.Build;

public class TiResponseCache extends ResponseCache
{
	private static final String TAG = "TiResponseCache";

	private static final String HEADER_SUFFIX = ".hdr";
	private static final String BODY_SUFFIX = ".bdy";
	private static final String CACHE_SIZE_KEY = "ti.android.cache.size.max";
	private static final int DEFAULT_CACHE_SIZE = 25 * 1024 * 1024; // 25MB
	private static final int INITIAL_DELAY = 10000;
	private static final int CLEANUP_DELAY = 60000;
	private static HashMap<String, ArrayList<CompleteListener>> completeListeners =
		new HashMap<String, ArrayList<CompleteListener>>();
	private static long maxCacheSize = 0;

	// List of Video Media Formats from http://developer.android.com/guide/appendix/media-formats.html
	private static final List<String> videoFormats =
		new ArrayList<String>(Arrays.asList("mkv", "webm", "3gp", "mp4", "ts"));

	private static ScheduledExecutorService cleanupExecutor = null;

	public static interface CompleteListener {
		public void cacheCompleted(URI uri);
	}

	private static class TiCacheCleanup implements Runnable
	{
		private File cacheDir;
		private long maxSize;
		public TiCacheCleanup(File cacheDir, long maxSize)
		{
			this.cacheDir = cacheDir;
			this.maxSize = maxSize;
		}

		// TODO @Override
		public void run()
		{
			// Build up a list of access times
			HashMap<Long, File> lastTime = new HashMap<Long, File>();
			for (File hdrFile : cacheDir.listFiles(new FilenameFilter() {
					 // TODO @Override
					 public boolean accept(File dir, String name)
					 {
						 return name.endsWith(HEADER_SUFFIX);
					 }
				 })) {
				lastTime.put(hdrFile.lastModified(), hdrFile);
			}

			// Ensure that the cache is under the required size
			List<Long> sz = new ArrayList<Long>(lastTime.keySet());
			Collections.sort(sz);
			Collections.reverse(sz);
			long cacheSize = 0;
			for (Long last : sz) {
				File hdrFile = lastTime.get(last);
				String h = hdrFile.getName().substring(0, hdrFile.getName().lastIndexOf('.')); // Hash
				File bdyFile = new File(cacheDir, h + BODY_SUFFIX);

				cacheSize += hdrFile.length();
				cacheSize += bdyFile.length();
				if (cacheSize > this.maxSize) {
					hdrFile.delete();
					bdyFile.delete();
				}
			}
		}
	}

	private static class TiCacheResponse extends CacheResponse
	{
		private Map<String, List<String>> headers;
		private InputStream istream;

		public TiCacheResponse(Map<String, List<String>> hdrs, InputStream istr)
		{
			super();
			headers = hdrs;
			istream = istr;
		}

		@Override
		public Map<String, List<String>> getHeaders() throws IOException
		{
			return headers;
		}

		@Override
		public InputStream getBody() throws IOException
		{
			return istream;
		}
	}

	private static class TiCacheOutputStream extends FileOutputStream
	{
		private URI uri;
		public TiCacheOutputStream(URI uri, File file) throws FileNotFoundException
		{
			super(file);
			this.uri = uri;
		}

		@Override
		public void close() throws IOException
		{
			super.close();
			fireCacheCompleted(uri);
		}
	}

	private static class TiCacheRequest extends CacheRequest
	{
		private URI uri;
		private File bFile, hFile;
		private long contentLength;

		public TiCacheRequest(URI uri, File bFile, File hFile, long contentLength)
		{
			super();
			this.uri = uri;
			this.bFile = bFile;
			this.hFile = hFile;
			this.contentLength = contentLength;
		}

		@Override
		public OutputStream getBody() throws IOException
		{
			return new TiCacheOutputStream(uri, bFile);
		}

		@Override
		public void abort()
		{
			// Only truly abort if we didn't write the whole length
			// This works around a bug where Android calls abort()
			// whenever the file is closed, successful writes or not
			if (bFile.length() != this.contentLength) {
				Log.e(TAG, "Failed to add item to the cache!");
				if (bFile.exists())
					bFile.delete();
				if (hFile.exists())
					hFile.delete();
			}
		}
	}

	/**
	 * Check whether the content from uri has been cached. This method is optimized for
	 * TiResponseCache. For other kinds of ResponseCache, eg. HttpResponseCache, it only
	 * checks whether the system's default response cache is set.
	 * @param uri
	 * @return true if the content from uri is cached; false otherwise.
	 */
	public static boolean peek(URI uri)
	{
		ResponseCache rcc = TiResponseCache.getDefault();

		if (rcc instanceof TiResponseCache) {
			// The default response cache is set by Titanium
			TiResponseCache rc = (TiResponseCache) rcc;
			if (rc.cacheDir == null) {
				return false;
			}
			String hash = TiDigestUtils.sha1Hex(uri.toString());
			File hFile = new File(rc.cacheDir, hash + HEADER_SUFFIX);
			File bFile = new File(rc.cacheDir, hash + BODY_SUFFIX);
			if (!bFile.exists() || !hFile.exists()) {
				return false;
			}
			return true;

		} else if (rcc != null) {
			// The default response cache is set by other modules/sdks
			return true;
		}

		return false;
	}

	/**
	 * Determines if the given URI's HTTP response has been cached, including the cached endpoint response
	 * of a redirect response.
	 * @param uri The URI to check for a cached response of. Can be null.
	 * @return
	 * Returns true if the system has a cached response for the given URI.
	 * <p>
	 * Returns false if the URI's response is not cached, or if it is a redirect, its redirected response is not cached.
	 * Will also return false if given an invalid argument.
	 */
	public static boolean peekFollowingRedirects(URI uri)
	{
		URI cachedUri = fetchEndpointFollowingRedirects(uri);
		return (cachedUri != null);
	}

	/**
	 * Fetches the cached endpoint for the given URI in case the URI triggers a redirect.
	 * @param uri The URI to fetch the endpoint of. Can be null.
	 * @return
	 * If the given URI is cached and references a redirect response, then the returned URI will
	 * be the redirect's "location" URI.
	 * <p>
	 * If the given URI does not reference a redirect, then the given URI is returned.
	 * <p>
	 * Returns null if given URI is not cached or if given an invalid argument.
	 */
	public static URI fetchEndpointFollowingRedirects(URI uri)
	{
		// Validate.
		if (uri == null) {
			return null;
		}

		// Check if the given URI is cached. If it is, follow its cached redirects if applicable.
		try {
			URI nextUri = uri;
			HashMap<String, List<String>> requestHeaders = new HashMap<String, List<String>>();
			while (TiResponseCache.peek(nextUri)) {
				// Fetch the URI's cached response.
				CacheResponse response = TiResponseCache.getDefault().get(nextUri, "GET", requestHeaders);
				if (response == null) {
					return null;
				}

				// If cached response is a redirect, then acquire its redirect URI.
				URI redirectUri = null;
				try {
					Map<String, List<String>> responseHeaders = response.getHeaders();
					for (Map.Entry<String, List<String>> headerEntry : responseHeaders.entrySet()) {
						// Validate header key/value pair.
						if (headerEntry == null) {
							continue;
						}

						// Fetch the HTTP header name.
						String headerName = headerEntry.getKey();
						if (headerName == null) {
							continue;
						}
						headerName = headerName.toLowerCase().trim();

						// If this is a redirect header, then fetch its URL and stop here.
						if (headerName.equals("location")) {
							List<String> valueList = headerEntry.getValue();
							if ((valueList != null) && !valueList.isEmpty()) {
								try {
									redirectUri = new URI(valueList.get(0));
								} catch (Exception ex) {
								}
								break;
							}
						}
					}
				} finally {
					// Fetching "CacheResponse" auto-opens a stream to the file storing the "body".
					// We must close the file ourselves here.
					try {
						InputStream cachedInputStream = response.getBody();
						if (cachedInputStream != null) {
							cachedInputStream.close();
						}
					} catch (Exception ex) {
					}
				}

				// If we've found a redirect URI, then fetch it's cached response.
				if ((redirectUri != null) && !redirectUri.equals(nextUri)) {
					nextUri = redirectUri;
					continue;
				}

				// Cached response is not a redirect. We're done.
				return nextUri;
			}
		} catch (Exception ex) {
		}

		// Given URI is invalid or its response is not cached.
		return null;
	}

	/**
	 * Get the cached content for uri. It works for all kinds of ResponseCache.
	 * @param uri
	 * @return an InputStream of the cached content
	 */
	public static InputStream openCachedStream(URI uri)
	{
		ResponseCache rcc = TiResponseCache.getDefault();

		if (rcc instanceof TiResponseCache) {
			// The default response cache is set by Titanium
			TiResponseCache rc = (TiResponseCache) rcc;
			if (rc.cacheDir == null) {
				return null;
			}
			String hash = TiDigestUtils.sha1Hex(uri.toString());
			File hFile = new File(rc.cacheDir, hash + HEADER_SUFFIX);
			File bFile = new File(rc.cacheDir, hash + BODY_SUFFIX);
			if (!bFile.exists() || !hFile.exists()) {
				return null;
			}
			try {
				boolean isGZip = false;
				// Read in the headers
				try {
					Map<String, List<String>> headers = readHeaders(hFile);
					String contentEncoding = getHeader(headers, "content-encoding");
					if ("gzip".equalsIgnoreCase(contentEncoding)) {
						isGZip = true;
					}
				} catch (IOException e) {
					// continue with file read?
				}
				if (isGZip) {
					return new GZIPInputStream(new FileInputStream(bFile));
				}
				return new FileInputStream(bFile);
			} catch (FileNotFoundException e) {
				// Fallback to URL download?
				return null;
			} catch (IOException e) {
				return null;
			}

		} else if (rcc != null) {
			// The default response cache is set by other modules/sdks
			try {
				URLConnection urlc = uri.toURL().openConnection();
				urlc.setRequestProperty("Cache-Control", "only-if-cached");
				return urlc.getInputStream();
			} catch (Exception e) {
				// Not cached. Fallback to URL download.
				return null;
			}
		}

		return null;
	}

	public static void addCompleteListener(URI uri, CompleteListener listener)
	{
		synchronized (completeListeners)
		{
			String key = uri.toString();
			if (!completeListeners.containsKey(key)) {
				completeListeners.put(key, new ArrayList<CompleteListener>());
			}
			completeListeners.get(key).add(listener);
		}
	}

	private File cacheDir = null;

	public TiResponseCache(File cachedir, TiApplication tiApp)
	{
		super();
		assert cachedir.isDirectory() : "cachedir MUST be a directory";
		cacheDir = cachedir;

		maxCacheSize = tiApp.getAppProperties().getInt(CACHE_SIZE_KEY, DEFAULT_CACHE_SIZE) * 1024;
		Log.d(TAG, "max cache size is:" + maxCacheSize, Log.DEBUG_MODE);

		cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
		TiCacheCleanup command = new TiCacheCleanup(cacheDir, maxCacheSize);
		cleanupExecutor.scheduleWithFixedDelay(command, INITIAL_DELAY, CLEANUP_DELAY, TimeUnit.MILLISECONDS);
	}

	@Override
	public CacheResponse get(URI uri, String rqstMethod, Map<String, List<String>> rqstHeaders) throws IOException
	{
		if (uri == null || cacheDir == null || rqstMethod == null) {
			return null;
		}

		// We only support caching HTTP "GET" requests. (Apple and Google do not normally cache "HEAD".)
		// Never cache methods which can make server-side changes such as "POST", "PUT", "DELETE", etc.
		if (!rqstMethod.equals("GET")) {
			return null;
		}

		// Workaround for https://jira.appcelerator.org/browse/TIMOB-18913
		// This workaround should be removed when HTTPClient is refactored with HttpUrlConnection
		// and HttpResponseCache is used instead of TiResponseCache.
		// If it is a video, do not use cache. Cache is causing problems for Video Player on Lollipop
		String fileFormat = TiMimeTypeHelper.getFileExtensionFromUrl(uri.toString()).toLowerCase();
		if (videoFormats.contains(fileFormat) && (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)) {
			return null;
		}

		// Get our key, which is a hash of the URI
		String hash = TiDigestUtils.sha1Hex(uri.toString());

		// Make our cache files
		File hFile = new File(cacheDir, hash + HEADER_SUFFIX);
		File bFile = new File(cacheDir, hash + BODY_SUFFIX);

		if (!bFile.exists() || !hFile.exists()) {
			return null;
		}

		// Read in the headers
		Map<String, List<String>> headers = readHeaders(hFile);

		// Update the access log
		hFile.setLastModified(System.currentTimeMillis());

		// Respond with the cache
		return new TiCacheResponse(headers, new FileInputStream(bFile));
	}

	private static Map<String, List<String>> readHeaders(File hFile) throws IOException
	{
		// Read in the headers
		Map<String, List<String>> headers = new HashMap<String, List<String>>();
		BufferedReader rdr = new BufferedReader(new FileReader(hFile), 1024);
		for (String line = rdr.readLine(); line != null; line = rdr.readLine()) {
			String keyval[] = line.split("=", 2);
			if (keyval.length < 2) {
				continue;
			}
			// restore status line key that was stored in makeLowerCaseHeaders()
			if ("null".equals(keyval[0])) {
				keyval[0] = null;
			}

			if (!headers.containsKey(keyval[0])) {
				headers.put(keyval[0], new ArrayList<String>());
			}

			headers.get(keyval[0]).add(keyval[1]);
		}
		rdr.close();
		return headers;
	}

	protected static String getHeader(Map<String, List<String>> headers, String header)
	{
		List<String> values = headers.get(header);
		if (values == null || values.size() == 0) {
			return null;
		}
		return values.get(values.size() - 1);
	}

	protected int getHeaderInt(Map<String, List<String>> headers, String header, int defaultValue)
	{
		String value = getHeader(headers, header);
		if (value == null) {
			return defaultValue;
		}
		try {
			return Integer.parseInt(value);
		} catch (NumberFormatException e) {
			return defaultValue;
		}
	}

	private Map<String, List<String>> makeLowerCaseHeaders(Map<String, List<String>> origHeaders)
	{
		Map<String, List<String>> headers = new HashMap<String, List<String>>(origHeaders.size());
		for (String key : origHeaders.keySet()) {
			if (key != null) {
				headers.put(key.toLowerCase(), origHeaders.get(key));
			} else {
				//status line has null key
				headers.put("null", origHeaders.get(key));
			}
		}
		return headers;
	}

	@Override
	public CacheRequest put(URI uri, URLConnection conn) throws IOException
	{
		if (cacheDir == null) {
			return null;
		}

		// We only support caching HTTP "GET" requests. (Apple and Google do not normally cache "HEAD".)
		// Never cache methods which can make server-side changes such as "POST", "PUT", "DELETE", etc.
		if (conn instanceof HttpURLConnection) {
			String requestMethod = ((HttpURLConnection) conn).getRequestMethod();
			if ((requestMethod == null) || !requestMethod.equals("GET")) {
				return null;
			}
		}

		// Workaround for https://jira.appcelerator.org/browse/TIMOB-18913
		// This workaround should be removed when HTTPClient is refactored with HttpUrlConnection
		// and HttpResponseCache is used instead of TiResponseCache.
		// If it is a video, do not use cache. Cache is causing problems for Video Player on Lollipop
		String fileFormat = TiMimeTypeHelper.getFileExtensionFromUrl(uri.toString()).toLowerCase();
		if (videoFormats.contains(fileFormat) && (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)) {
			return null;
		}

		// Make sure the cacheDir exists, in case user clears cache while app is running
		if (!cacheDir.exists()) {
			cacheDir.mkdirs();
		}

		// Gingerbread 2.3 bug: getHeaderField tries re-opening the InputStream
		// getHeaderFields() just checks the response itself
		Map<String, List<String>> headers = makeLowerCaseHeaders(conn.getHeaderFields());
		String cacheControl = getHeader(headers, "cache-control");
		if (cacheControl != null && cacheControl.matches("^.*(no-cache|no-store|must-revalidate|max-age=0).*")) {
			return null; // See RFC-2616
		}

		boolean skipTransferEncodingHeader = false;
		String tEncoding = getHeader(headers, "transfer-encoding");
		if (tEncoding != null && tEncoding.toLowerCase().equals("chunked")) {
			skipTransferEncodingHeader =
				true; // don't put "chunked" transfer-encoding into our header file, else the http connection object that gets our header information will think the data starts with a chunk length specification
		}

		// Form the headers and generate the content length
		String newl = System.getProperty("line.separator");
		long contentLength = getHeaderInt(headers, "content-length", 0);
		StringBuilder sb = new StringBuilder();
		for (String hdr : headers.keySet()) {
			if (!skipTransferEncodingHeader || !hdr.equals("transfer-encoding")) {
				for (String val : headers.get(hdr)) {
					sb.append(hdr);
					sb.append("=");
					sb.append(val);
					sb.append(newl);
				}
			}
		}
		if (contentLength + sb.length() > maxCacheSize) {
			return null;
		}

		// Work around an android bug which gives us the wrong URI
		try {
			uri = conn.getURL().toURI();
		} catch (URISyntaxException e) {
		}

		// Get our key, which is a hash of the URI
		String hash = TiDigestUtils.sha1Hex(uri.toString());

		// Make our cache files
		File hFile = new File(cacheDir, hash + HEADER_SUFFIX);
		File bFile = new File(cacheDir, hash + BODY_SUFFIX);

		// Write headers synchronously
		FileWriter hWriter = new FileWriter(hFile);
		try {
			hWriter.write(sb.toString());
		} finally {
			hWriter.close();
		}

		synchronized (this)
		{
			// Don't add it to the cache if its already being written
			if (!bFile.createNewFile()) {
				return null;
			}
			return new TiCacheRequest(uri, bFile, hFile, contentLength);
		}
	}

	public void setCacheDir(File dir)
	{
		cacheDir = dir;
	}

	private static final void fireCacheCompleted(URI uri)
	{
		synchronized (completeListeners)
		{
			String key = uri.toString();
			if (completeListeners.containsKey(key)) {
				for (CompleteListener listener : completeListeners.get(key)) {
					listener.cacheCompleted(uri);
				}
				completeListeners.remove(key);
			}
		}
	}
}
