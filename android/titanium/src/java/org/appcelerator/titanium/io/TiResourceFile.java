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
import org.appcelerator.kroll.common.TiFastDev;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiFileHelper2;

import android.content.Context;

public class TiResourceFile extends TiBaseFile
{
	private static final String TAG = "TiResourceFile";

	private final String path;

	public TiResourceFile(String path)
	{
		super(TYPE_RESOURCE);
		this.path = path;
	}

	@Override
	public TiBaseFile resolve()
	{
		return this;
	}

	@Override
	public InputStream getInputStream() throws IOException
	{
		InputStream in = null;

		Context context = TiApplication.getInstance();
		if (context != null) {
			String p = TiFileHelper2.joinSegments("Resources", path);
			if (TiFastDev.isFastDevEnabled()) {
				in = TiFastDev.getInstance().openInputStream(path);
			} else {
				in = context.getAssets().open(p);
			}
		}
		return in;
	}

	@Override
	public OutputStream getOutputStream() {
		return null; // read-only;
	}

	@Override
	public File getNativeFile() {
		return new File(toURL());
	}

	@Override
	public void write(String data, boolean append) throws IOException
	{
		throw new IOException("read only");
	}

	@Override
	public void open(int mode, boolean binary) throws IOException {
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
		String result = null;

		if (!opened) {
			throw new IOException("Must open before calling readLine");
		}
		if (binary) {
			throw new IOException("File opened in binary mode, readLine not available.");
		}

		try {
			result = inreader.readLine();
		} catch (IOException e) {
			Log.e(TAG, "Error reading a line from the file: ", e);
		}

		return result;
	}

	@Override
	public boolean exists()
	{
		boolean result = false;
		InputStream is = null;
		try {
			if (TiFastDev.isFastDevEnabled()) {
				result = TiFastDev.getInstance().fileExists(path);
			} else {
				is = getInputStream();
				result = (is != null);
			}
		} catch (IOException e) {
			// getInputStream() will throw a FileNotFoundException if it is a
			// directory. We check if there are directory listings. If there is,
			// we can assume it is a directory and it exists.
			if (!getDirectoryListing().isEmpty()) {
				result = true;
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

		return result;
	}

	@Override
	public String name()
	{
		int idx = path.lastIndexOf("/");
		if (idx != -1)
		{
			return path.substring(idx);
		}
		return path;
	}

	@Override
	public String extension()
	{
		int idx = path.lastIndexOf(".");
		if (idx != -1)
		{
			return path.substring(idx+1);
		}
		return null;
	}

	@Override
	public String nativePath()
	{
		return toURL();
	}

	@Override
	public double spaceAvailable() {
		return 0;
	}

	public String toURL() {
		return TiC.URL_ANDROID_ASSET_RESOURCES + path;
	}

	public long size()
	{
		if (TiFastDev.isFastDevEnabled()) {
			return TiFastDev.getInstance().getLength(path);
		} else {
			long length = 0;
			InputStream is = null;
			try {
				is = getInputStream();
				length = is.available();
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
			return length;
		}
	}

	@Override
	public List<String> getDirectoryListing()
	{
		List<String> listing = new ArrayList<String>();
		try {
			String lpath = TiFileHelper2.joinSegments("Resources", path);
			if (lpath.endsWith("/")) {
				lpath = lpath.substring(0, lpath.lastIndexOf("/"));
			}
			String[] names = TiApplication.getInstance().getAssets().list(lpath);
			if (names != null) {
				int len = names.length;
				for(int i = 0; i < len; i++) {
					listing.add(names[i]);
				}
			}
		} catch (IOException e) {
			Log.e(TAG, "Error while getting a directory listing: " + e.getMessage(), e);
		}
		return listing;
	}

	public String toString ()
	{
		return toURL();
	}
}
