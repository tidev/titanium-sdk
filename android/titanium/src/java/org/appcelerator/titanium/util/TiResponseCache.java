/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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
import java.net.ResponseCache;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

public class TiResponseCache extends ResponseCache
{
	private static final String TAG = "TiResponseCache";

	private static final String HEADER_SUFFIX = ".hdr";
	private static final String BODY_SUFFIX   = ".bdy";
	private static final String CACHE_SIZE_KEY = "ti.android.cache.size.max";
	private static final int DEFAULT_CACHE_SIZE = 25 * 1024 * 1024; // 25MB
	private static final int INITIAL_DELAY = 10000;
	private static final int CLEANUP_DELAY = 60000;
	private static HashMap<String, ArrayList<CompleteListener>> completeListeners = new HashMap<String, ArrayList<CompleteListener>>();
	private static long maxCacheSize = 0;

	private static ScheduledExecutorService cleanupExecutor = null;
	
	public static interface CompleteListener
	{
		public void cacheCompleted(URI uri);
	}

	private static class TiCacheCleanup implements Runnable
	{
		private File cacheDir;
		private long maxSize;
		public TiCacheCleanup(File cacheDir, long maxSize)
		{
			this.cacheDir  = cacheDir;
			this.maxSize = maxSize;
		}

		// TODO @Override
		public void run()
		{
			// Build up a list of access times
			HashMap<Long, File> lastTime = new HashMap<Long, File>();
			for (File hdrFile : cacheDir.listFiles(new FilenameFilter() {
					// TODO @Override
					public boolean accept(File dir, String name) {
						return name.endsWith(HEADER_SUFFIX);
					}
				}))
			{
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
	
	private static class TiCacheResponse extends CacheResponse {
		private Map<String, List<String>> headers;
		private InputStream istream;
		
		public TiCacheResponse(Map<String, List<String>> hdrs, InputStream istr)
		{
			super();
			headers = hdrs;
			istream = istr;
		}
		
		@Override
		public Map<String, List<String>> getHeaders()
			throws IOException
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
		public TiCacheOutputStream(URI uri, File file)
			throws FileNotFoundException
		{
			super(file);
			this.uri = uri;
		}

		@Override
		public void close()
			throws IOException
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
		public OutputStream getBody()
			throws IOException
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
				if (bFile.exists()) bFile.delete();
				if (hFile.exists()) hFile.delete();
			}
		}
	}

	public static boolean peek(URI uri)
	{
		TiResponseCache rc = (TiResponseCache) TiResponseCache.getDefault();
		if (rc == null) return false;
		if (rc.cacheDir == null) return false;
		
		String hash = DigestUtils.shaHex(uri.toString());
		File hFile = new File(rc.cacheDir, hash + HEADER_SUFFIX);
		File bFile = new File(rc.cacheDir, hash + BODY_SUFFIX);
		if (!bFile.exists() || !hFile.exists()) return false;
		return true;
	}

	public static InputStream openCachedStream(URI uri)
	{
		TiResponseCache rc = (TiResponseCache) TiResponseCache.getDefault();
		if (rc == null) {
			return null;
		}

		if (rc.cacheDir == null) {
			return null;
		}
		
		String hash = DigestUtils.shaHex(uri.toString());
		File hFile = new File(rc.cacheDir, hash + HEADER_SUFFIX);
		File bFile = new File(rc.cacheDir, hash + BODY_SUFFIX);

		if (!bFile.exists() || !hFile.exists()) {
			return null;
		}

		try {
			return new FileInputStream(bFile);
		} catch (FileNotFoundException e) {
			// Fallback to URL download?
			return null;
		}
	}

	public static void addCompleteListener(URI uri, CompleteListener listener)
	{
		synchronized (completeListeners) {
			String hash = DigestUtils.shaHex(uri.toString());
			if (!completeListeners.containsKey(hash)) {
				completeListeners.put(hash, new ArrayList<CompleteListener>());
			}
			completeListeners.get(hash).add(listener);
		}
	}

	private File cacheDir = null;

	public TiResponseCache(File cachedir, TiApplication tiApp) {
		super();
		assert cachedir.isDirectory() : "cachedir MUST be a directory";
		cacheDir = cachedir;

		maxCacheSize = tiApp.getSystemProperties().getInt(CACHE_SIZE_KEY, DEFAULT_CACHE_SIZE) * 1024;
		Log.d(TAG, "max cache size is:" + maxCacheSize, Log.DEBUG_MODE);

		cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
		TiCacheCleanup command = new TiCacheCleanup(cacheDir, maxCacheSize);
		cleanupExecutor.scheduleWithFixedDelay(command, INITIAL_DELAY, CLEANUP_DELAY, TimeUnit.MILLISECONDS);
	}

	@Override
	public CacheResponse get(URI uri, String rqstMethod,
			Map<String, List<String>> rqstHeaders) throws IOException 
	{
		if (uri == null || cacheDir == null) return null;
		
		// Get our key, which is a hash of the URI
		String hash = DigestUtils.shaHex(uri.toString());
		
		// Make our cache files
		File hFile = new File(cacheDir, hash + HEADER_SUFFIX);
		File bFile = new File(cacheDir, hash + BODY_SUFFIX);
		
		if (!bFile.exists() || !hFile.exists()) {
			return null;
		}

		// Read in the headers
		Map<String, List<String>> headers = new HashMap<String, List<String>>();
		BufferedReader rdr = new BufferedReader(new FileReader(hFile), 1024);
		for (String line=rdr.readLine() ; line != null ; line=rdr.readLine()) {
			String keyval[] = line.split("=", 2);
			if (!headers.containsKey(keyval[0])) {
				headers.put(keyval[0], new ArrayList<String>());
			}
			headers.get(keyval[0]).add(keyval[1]);
		}
		rdr.close();
		
		// Update the access log
		hFile.setLastModified(System.currentTimeMillis());
		
		// Respond with the cache
		return new TiCacheResponse(headers, new FileInputStream(bFile));
	}

	protected String getHeader(Map<String, List<String>> headers, String header)
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
			}
		}
		return headers;
	}

	@Override
	public CacheRequest put(URI uri, URLConnection conn) throws IOException
	{
		if (cacheDir == null) return null;
		
		// Make sure the cacheDir exists, in case user clears cache while app is running
		if (!cacheDir.exists()) {
			cacheDir.mkdirs();
		}
		
		// Gingerbread 2.3 bug: getHeaderField tries re-opening the InputStream
		// getHeaderFields() just checks the response itself
		Map<String, List<String>> headers = makeLowerCaseHeaders(conn.getHeaderFields());
		String cacheControl = getHeader(headers, "cache-control");
		if (cacheControl != null && cacheControl.matches("^.*(no-cache|no-store|must-revalidate).*")) {
			return null; // See RFC-2616
		}

		boolean skipTransferEncodingHeader = false;
		String tEncoding = getHeader(headers, "transfer-encoding");
		if (tEncoding != null && tEncoding.toLowerCase().equals("chunked")) {
			skipTransferEncodingHeader = true; // don't put "chunked" transfer-encoding into our header file, else the http connection object that gets our header information will think the data starts with a chunk length specification
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
		} catch (URISyntaxException e) {}
		
		// Get our key, which is a hash of the URI
		String hash = DigestUtils.shaHex(uri.toString());
		
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

		synchronized (this) {
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
		synchronized (completeListeners) {
			String hash = DigestUtils.shaHex(uri.toString());
			if (completeListeners.containsKey(hash)) {
				for (CompleteListener listener : completeListeners.get(hash)) {
					listener.cacheCompleted(uri);
				}
				completeListeners.remove(hash);
			}
		}
	}
}
