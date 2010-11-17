package org.appcelerator.titanium.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.codec.digest.DigestUtils;

public class TiResponseCache extends ResponseCache {
	private static final String HEADER_SUFFIX = ".hdr";
	private static final String BODY_SUFFIX   = ".bdy";
	
	private static class TiCacheBodyOutputStream extends FileOutputStream {
		private File hFile;
		private File bFile;
		private Map<String, List<String>> headers;
		public TiCacheBodyOutputStream(File bFile, File hFile, Map<String, List<String>> headers) throws IOException {
			super(bFile);
			this.bFile   = bFile;
			this.hFile   = hFile;
			this.headers = headers;
		}

		@Override
		public void close() throws IOException {
			super.close();

			if (!hFile.createNewFile()) {
				this.abort();
				return;
			}
			
			// Write out the headers
			String newl = System.getProperty("line.separator");
			FileWriter wrtr = new FileWriter(hFile);
			for (String hdr : headers.keySet())
				for (String val : headers.get(hdr))
					wrtr.write(hdr + "=" + val + newl);
			wrtr.close();
		}
		
		public void abort() throws IOException {
			try {
				super.close();
			} finally {
				bFile.delete();
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
		private TiCacheBodyOutputStream ostream;
		public TiCacheRequest(TiCacheBodyOutputStream ostream) {
			super();
			this.ostream = ostream;
		}

		@Override
		public OutputStream getBody() throws IOException {
			return ostream;
		}

		@Override
		public void abort() {
			try {
				ostream.abort();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
	
	public long MAX_CACHE_SIZE = 25 * 1024 * 1024; // 25MB
	public long MAX_CACHE_ITEM = 1024;
	
	private File cacheDir = null;
	public TiResponseCache(File cachedir) {
		super();
		assert cachedir.isDirectory() : "cachedir MUST be a directory";
		cacheDir = cachedir;
	}

	@Override
	public CacheResponse get(URI uri, String rqstMethod,
			Map<String, List<String>> rqstHeaders) throws IOException {
		if (cacheDir == null) return null;
		
		// Get our key, which is a hash of the URI
		String hash = DigestUtils.shaHex(uri.toString());
		
		// Make our cache files
		File hFile = new File(cacheDir, hash + HEADER_SUFFIX);
		File bFile = new File(cacheDir, hash + BODY_SUFFIX);
		
		// Read in the headers
		Map<String, List<String>> headers = new HashMap<String, List<String>>();
		BufferedReader rdr = new BufferedReader(new FileReader(hFile));
		for (String line=rdr.readLine() ; line != null ; line=rdr.readLine()) {
			String keyval[] = line.split("=", 2);
			if (!headers.containsKey(keyval[0]))
				headers.put(keyval[0], new ArrayList<String>());
			headers.get(keyval[0]).add(keyval[1]);
		}
		rdr.close();
		
		// Respond with the cache
		return new TiCacheResponse(headers, new FileInputStream(bFile));
	}

	@Override
	public CacheRequest put(URI uri, URLConnection conn) throws IOException {
		if (cacheDir == null) return null;
		
		String cacheControl = conn.getHeaderField("Cache-Control");
		if (cacheControl != null && cacheControl.matches("(?i:(no-cache|no-store|must-revalidate))"))
			return null; // See RFC-2616
		
		int contentLength = conn.getHeaderFieldInt("Content-Length", 0);
		if (contentLength > 0 && contentLength > MAX_CACHE_SIZE)
			return null;

		// Work around an android bug which gives us the wrong URI
		try {
			uri = conn.getURL().toURI();
		} catch (URISyntaxException e) {
			e.printStackTrace();
		}
		
		// Get our key, which is a hash of the URI
		String hash = DigestUtils.shaHex(uri.toString());
		
		// Make our cache files
		File hFile = new File(cacheDir, hash + HEADER_SUFFIX); 
		File bFile = new File(cacheDir, hash + BODY_SUFFIX);
		
		synchronized (this) { // Don't add it to the cache if its already being written
			if (!hFile.createNewFile())
				return null;
			return new TiCacheRequest(new TiCacheBodyOutputStream(bFile, hFile, conn.getHeaderFields()));
		}
	}
}
