/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.io;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.List;
import javax.crypto.CipherInputStream;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiFileHelper2;

public class TiResourceFile extends TiBaseFile
{
	private static final String TAG = "TiResourceFile";

	private String path;
	private String name;
	private boolean statsFetched = false;
	private boolean exists = false;

	public TiResourceFile(String path)
	{
		super(TYPE_RESOURCE);
		this.path = (path != null) ? path : "";
		fetchName();
	}

	@Override
	public boolean isDirectory()
	{
		if (this.statsFetched == false) {
			fetchStats();
		}
		return this.exists && this.typeDir;
	}

	@Override
	public boolean isFile()
	{
		if (this.statsFetched == false) {
			fetchStats();
		}
		return this.exists && this.typeFile;
	}

	@Override
	public TiBaseFile resolve()
	{
		return this;
	}

	@Override
	public InputStream getInputStream() throws IOException
	{
		String resourcePath = TiFileHelper2.getResourcesPath(this.path);
		return KrollAssetHelper.openAsset(resourcePath);
	}

	@Override
	public OutputStream getOutputStream()
	{
		return null; // read-only;
	}

	@Override
	public File getNativeFile()
	{
		return new File(toURL());
	}

	@Override
	public void write(String data, boolean append) throws IOException
	{
		throw new IOException("read only");
	}

	@Override
	public void open(int mode, boolean binary) throws IOException
	{
		if (mode == MODE_READ) {
			InputStream in = getInputStream();
			if (in != null) {
				if (binary) {
					instream = new BufferedInputStream(in);
				} else {
					inreader = new BufferedReader(new InputStreamReader(in, "utf-8"));
				}
				opened = true;
			} else {
				throw new FileNotFoundException("File does not exist: " + path);
			}
		} else {
			throw new IOException("Resource file may not be written.");
		}
	}

	@Override
	public String readLine() throws IOException
	{
		if (!opened) {
			throw new IOException("Must open before calling readLine");
		}
		if (binary) {
			throw new IOException("File opened in binary mode, readLine not available.");
		}

		try {
			return inreader.readLine();
		} catch (IOException e) {
			Log.e(TAG, "Error reading a line from the file: ", e);
		}

		return null;
	}

	@Override
	public boolean exists()
	{
		if (this.statsFetched == false) {
			fetchStats();
		}
		return this.exists;
	}

	@Override
	public long createTimestamp()
	{
		return modificationTimestamp();
	}

	@Override
	public long modificationTimestamp()
	{
		// Since resource files are embedded within the APK, use the APK file's timestamp.
		try {
			File apkFile = new File(TiApplication.getInstance().getPackageCodePath());
			return apkFile.lastModified();
		} catch (Exception ex) {
		}
		return 0L;
	}

	@Override
	public String name()
	{
		return this.name;
	}

	@Override
	public String extension()
	{
		if (!isFile()) {
			return null;
		}

		int idx = path.lastIndexOf(".");
		if (idx != -1) {
			return path.substring(idx + 1);
		}
		return null;
	}

	@Override
	public String nativePath()
	{
		return toURL();
	}

	@Override
	public long spaceAvailable()
	{
		return 0L;
	}

	public String toURL()
	{
		if (!path.isEmpty() && !path.endsWith("/") && isDirectory()) {
			path += "/";
		}
		return TiC.URL_ANDROID_ASSET_RESOURCES + path;
	}

	@Override
	public long size()
	{
		// Do not continue if referencing a directory.
		if (!isFile()) {
			return 0L;
		}

		// Fetch the number of bytes.
		long size = 0L;
		try (InputStream is = getInputStream()) {
			if (is instanceof CipherInputStream) {
				// CipherInputStream.available() always returns 0
				// Iterate through stream to obtain true size.
				long byteCount = 0;
				long read = 0;
				byte[] buffer = new byte[1024];
				while ((read = is.read(buffer)) != -1) {
					byteCount += read;
				}
				size = byteCount;
			} else {
				size = is.available();
			}
		} catch (IOException e) {
			Log.w(TAG, "Error while trying to determine file size: " + e.getMessage(), e);
		}
		return size;
	}

	@Override
	public List<String> getDirectoryListing()
	{
		String resourcePath = TiFileHelper2.getResourcesPath(this.path);
		return KrollAssetHelper.getDirectoryListing(resourcePath);
	}

	public String toString()
	{
		return toURL();
	}

	private void fetchStats()
	{
		// Do not continue if already fetched.
		if (this.statsFetched) {
			return;
		}

		// Determine if the path references an existing file or directory.
		String resourcePath = TiFileHelper2.getResourcesPath(this.path);
		if (this.path.isEmpty() || this.path.equals("/")) {
			// Path references the root "Resources" directory. (This is an optimization.)
			this.typeFile = false;
			this.typeDir = true;
			this.exists = true;
		} else if (KrollAssetHelper.assetExists(resourcePath)) {
			// Path references an existing file.
			this.typeDir = false;
			this.typeFile = true;
			this.exists = true;
		} else {
			// Path does not reference a file. Check if it references an existing directory.
			this.typeFile = false;
			this.typeDir = KrollAssetHelper.directoryExists(resourcePath);
			this.exists = this.typeDir;
		}

		// Flag that path info has been fetched.
		this.statsFetched = true;
	}

	private void fetchName()
	{
		// Extract the file/directory name from the path.
		// Notes:
		// - An empty path or "/" references the root "Resources" directory.
		// - A directory path may or may not end with a trailing "/".
		String name = "Resources";
		if (this.path.length() > 0) {
			int startIndex = 0;
			int endIndexExclusive = this.path.length();
			if (this.path.charAt(endIndexExclusive - 1) == '/') {
				endIndexExclusive--;
			}
			for (int index = endIndexExclusive - 1; index >= 0; index--) {
				if (this.path.charAt(index) == '/') {
					startIndex = index + 1;
					break;
				}
			}
			if ((startIndex == 0) && (endIndexExclusive == this.path.length())) {
				name = this.path;
			} else if (startIndex < endIndexExclusive) {
				name = this.path.substring(startIndex, endIndexExclusive);
			}
		}
		this.name = name;
	}
}
