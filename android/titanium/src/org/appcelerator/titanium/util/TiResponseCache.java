package org.appcelerator.titanium.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
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

import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.titanium.TiApplication;

public class TiResponseCache extends ResponseCache {
	private static final String HEADER_SUFFIX = ".hdr";
	private static final String BODY_SUFFIX   = ".bdy";
	private static final String CACHE_SIZE_KEY = "ti.android.cache.size.max";
	private static final int    MAX_CACHE_SIZE = 25 * 1024 * 1024; // 25MB
	private static final String LCAT = "TiResponseCache"; 
	
	private static class TiCacheCleanup implements Runnable {
		private File cacheDir;
		private long maxSize;
		private long contentLength;
		private File hdrFile;
		
		public TiCacheCleanup(File cacheDir, long maxSize, File hdrFile, long contentLength) {
			this.cacheDir  = cacheDir;
			this.maxSize = maxSize;
			this.contentLength = contentLength;
			this.hdrFile = hdrFile;
		}

		@Override
		public void run() {
			// Build up a list of access times
			HashMap<Long, File> lastTime = new HashMap<Long, File>();
			for (File hdrFile : cacheDir.listFiles(new FilenameFilter() {
														@Override
														public boolean accept(File dir, String name) {
															return name.endsWith(HEADER_SUFFIX);
														}
													})) {
				if (hdrFile.equals(this.hdrFile)) { continue; }
				lastTime.put(hdrFile.lastModified(), hdrFile);
			}
			
			// Ensure that the cache is under the required size
			List<Long> sz = new ArrayList<Long>(lastTime.keySet());
			Collections.sort(sz);
			Collections.reverse(sz);
			long cacheSize = contentLength;
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
		private InputStream               istream;
		public TiCacheResponse(Map<String, List<String>> hdrs, InputStream istr) {
			super();
			headers = hdrs;
			istream = istr;
		}
		
		@Override
		public Map<String, List<String>> getHeaders() throws IOException {
			return headers;
		}
		
		@Override
		public InputStream getBody() throws IOException {
			return istream;
		}
	}
	
	private static class TiCacheRequest extends CacheRequest {
		private File    hFile;
		private File    bFile;
		private String  headers;
		private long    contentLength;
		public TiCacheRequest(File bFile, File hFile, String headers, long contentLength) {
			super();
			this.bFile   = bFile;
			this.hFile   = hFile;
			this.headers = headers;
			this.contentLength = contentLength;
		}

		@Override
		public OutputStream getBody() throws IOException {
			return new FileOutputStream(bFile);
		}

		@Override
		public void abort() {
			// Only truly abort if we didn't write the whole length
			// This works around a bug where Android calls abort()
			// whenever the file is closed, successful writes or not
			try {
				if (bFile.length() != this.contentLength) {
					throw new IOException("Invalid file length!");
				} else {
					// Write out the headers
					FileWriter wrtr = new FileWriter(hFile);
					try     {  wrtr.write(headers); }
					finally {  wrtr.close();        }
				}
			} catch (IOException e) {
				Log.e(LCAT, "Failed to add item to the cache!");
				if (bFile.exists()) bFile.delete();
				if (hFile.exists()) hFile.delete();
			}
		}
	}
	
	public static boolean peek(URI uri) {
		TiResponseCache rc = (TiResponseCache) TiResponseCache.getDefault();
		if (rc == null) return false;
		if (rc.cacheDir == null) return false;
		
		String hash = DigestUtils.shaHex(uri.toString());
		File hFile = new File(rc.cacheDir, hash + HEADER_SUFFIX);
		File bFile = new File(rc.cacheDir, hash + BODY_SUFFIX);
		if (!bFile.exists() || !hFile.exists()) return false;
		return true;
	}
	
	private File cacheDir = null;
	
	public TiResponseCache(File cachedir) {
		super();
		assert cachedir.isDirectory() : "cachedir MUST be a directory";
		cacheDir = cachedir;
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
		BufferedReader rdr = new BufferedReader(new FileReader(hFile));
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

	@Override
	public CacheRequest put(URI uri, URLConnection conn) throws IOException {
		if (cacheDir == null) return null;
		
		String cacheControl = conn.getHeaderField("Cache-Control");
		if (cacheControl != null && cacheControl.matches("(?i:(no-cache|no-store|must-revalidate))")) {
			return null; // See RFC-2616
		}
		
		// Form the headers and generate the content length
		String newl = System.getProperty("line.separator");
		long contentLength = conn.getHeaderFieldInt("Content-Length", 0);
		StringBuilder sb = new StringBuilder();
		for (String hdr : conn.getHeaderFields().keySet()) {
			for (String val : conn.getHeaderFields().get(hdr)) {
				sb.append(hdr);
				sb.append("=");
				sb.append(val);
				sb.append(newl);
			}
		}
		if (contentLength + sb.length() > MAX_CACHE_SIZE) {
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

		// Cleanup asynchronously
		int cacheSize = TiApplication.getInstance().getSystemProperties().getInt(CACHE_SIZE_KEY, MAX_CACHE_SIZE);
		TiBackgroundExecutor.execute(new TiCacheCleanup(cacheDir, cacheSize, hFile, contentLength + sb.length()));
		
		synchronized (this) {
			// Don't add it to the cache if its already being written
			if (!bFile.createNewFile()) {
				return null;
			}
			return new TiCacheRequest(bFile, hFile, sb.toString(), contentLength);
		}
	}
}
