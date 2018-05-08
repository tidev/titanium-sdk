/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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
import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiFileHelper2;

import android.content.Context;

public class TiResourceFile extends TiBaseFile
{
	private static final String TAG = "TiResourceFile";

	private final String path;
	private boolean statsFetched = false;
	private boolean exists = false;

	public TiResourceFile(String path)
	{
		super(TYPE_RESOURCE);
		this.path = path;
	}

	@Override
	public boolean isDirectory()
	{
		if (statsFetched) {
			return this.exists && this.typeDir;
		}

		fetchStats();
		return this.exists && this.typeDir;
	}

	@Override
	public boolean isFile()
	{
		if (statsFetched) {
			return this.exists && this.typeFile;
		}

		fetchStats();
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
		Context context = TiApplication.getInstance();
		if (context != null) {
			String p = TiFileHelper2.joinSegments("Resources", path);
			return context.getAssets().open(p);
		}
		return null;
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
	public TiBlob read() throws IOException
	{
		return TiBlob.blobFromFile(this);
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
		if (statsFetched) {
			return this.exists;
		}

		fetchStats();
		return this.exists;
	}

	@Override
	public String name()
	{
		int idx = path.lastIndexOf("/");
		if (idx != -1) {
			return path.substring(idx + 1);
		}
		return path;
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
		return TiC.URL_ANDROID_ASSET_RESOURCES + path;
	}

	public long size()
	{
		if (!isFile()) {
			return 0L;
		}

		InputStream is = null;
		try {
			is = getInputStream();
			return is.available();
		} catch (IOException e) {
			Log.w(TAG, "Error while trying to determine file size: " + e.getMessage(), e);
		} finally {
			if (is != null) {
				try {
					is.close();
				} catch (IOException e) {
					Log.w(TAG, e.getMessage(), e, Log.DEBUG_MODE);
				}
			}
		}
		return 0L;
	}

	@Override
	public List<String> getDirectoryListing()
	{
		List<String> listing = new ArrayList<String>();
		try {
			String lpath = TiFileHelper2.getResourcesPath(path);
			if (lpath.endsWith("/")) {
				lpath = lpath.substring(0, lpath.lastIndexOf("/"));
			}

			// list application assets
			String[] names = TiApplication.getInstance().getAssets().list(lpath);
			if (names != null) {
				int len = names.length;
				for (int i = 0; i < len; i++) {
					listing.add(names[i]);
				}
			}

			// list encrypted assets
			String[] assets = KrollAssetHelper.getEncryptedAssets();
			if (assets != null) {
				for (String asset : assets) {
					if (asset.startsWith(path)) {
						String relativePath = asset.substring(path.length());
						int dirIndex = asset.lastIndexOf("/");
						String dir = dirIndex != -1 ? relativePath.substring(0, dirIndex) : "";
						if (dir.length() > 0) {
							if (!listing.contains(dir)) {
								listing.add(dir);
							}
						} else if (relativePath.length() > 0) {
							listing.add(relativePath);
						}
					}
				}
			}

		} catch (IOException e) {
			Log.e(TAG, "Error while getting a directory listing: " + e.getMessage(), e);
		}
		return listing;
	}

	public String toString()
	{
		return toURL();
	}

	private void fetchStats()
	{
		InputStream is = null;
		try {
			is = getInputStream();
			this.typeDir = false;
			this.typeFile = true;
			this.exists = true;
		} catch (IOException e) {
			this.typeFile = false; // definitely not a file
			// getInputStream() will throw a FileNotFoundException if it is a
			// directory. We check if there are directory listings. If there is,
			// we can assume it is a directory and it exists.
			if (!getDirectoryListing().isEmpty()) {
				this.typeDir = true;
				this.exists = true;
			} else {
				// doesn't exist so neither file nor directory
				this.typeDir = false;
				this.exists = false;
			}
		} finally {
			if (is != null) {
				try {
					is.close();
				} catch (IOException e) {
					// Ignore
				}
			}
		}
		statsFetched = true;
	}
}
