/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.appcelerator.titanium.util.TiMimeTypeHelper;

import android.content.Context;

public class TiResourceFile extends TiBaseFile
{
	private static final String LCAT = "TiResourceFile";
	private static final String LOAD_FROM_SD_CARD = "ti.android.loadfromsdcard";
	
	@SuppressWarnings("unused")
	private static final boolean DBG = TiConfig.LOGD;

	private final String path;
	private boolean loadFromSDCard;
	private String sdCardPrefix;
	
	public TiResourceFile(TiContext tiContext, String path)
	{
		super(tiContext, TYPE_RESOURCE);
		this.path = path;
		this.loadFromSDCard = tiContext.getTiApp().getSystemProperties().getBool(LOAD_FROM_SD_CARD, false);
		
		if (loadFromSDCard) {
			Log.d(LCAT, "Loading data from sdcard");
		}
	}
	
	private String getSDCardPath(String path) {
		return TiFileHelper2.joinSegments(TiFileHelper.SD_CARD_PREFIX,
			getTiContext().getTiApp().getAppInfo().getId(), path);
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

		Context context = getTiContext().getActivity();
		if (context != null) {
			String p = TiFileHelper2.joinSegments("Resources", path);
			if (loadFromSDCard) {
				in = new FileInputStream(new File(getSDCardPath(p)));
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
		ByteArrayOutputStream baos = null;
		InputStream in = null;
		try
		{
			baos = new ByteArrayOutputStream();
			in = getInputStream();
			byte buffer [] = new byte[4096];
			while(true)
			{
				int count = in.read(buffer);
				if (count < 0)
				{
					break;
				}
				baos.write(buffer, 0, count);
			}
		}
		finally
		{
			if (in!=null)
			{
				in.close();
			}
		}

		return TiBlob.blobFromData(getTiContext(), baos.toByteArray(), TiMimeTypeHelper.getMimeType(toURL()));
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
			Log.e(LCAT, "Error reading a line from the file: ", e);
		}

		return result;
	}

	@Override
	public boolean exists()
	{
		boolean result = false;
		InputStream is = null;
		try {
			is = getInputStream();
			result = true;
		} catch (IOException e) {
			// Ignore
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
		if (loadFromSDCard) {
			return "file:///"+getSDCardPath("Resources/"+path);
		} else {
			return "file:///android_asset/Resources/" + path;
		}
	}
	public double size()
	{
		long length = 0;
		InputStream is = null;
		try {
			is = getInputStream();
			length = is.skip(Long.MAX_VALUE);
		} catch (IOException e) {
			Log.w(LCAT, "Error while trying to determine file size: " + e.getMessage());
		} finally {
			if (is != null) {
				try {
					is.close();
				} catch (IOException e) {
					//ignore
				}
			}
		}
		return length;
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
			String[] names = getTiContext().getActivity().getAssets().list(lpath);
			if (names != null) {
				int len = names.length;
				for(int i = 0; i < len; i++) {
					listing.add(names[i]);
				}
			}
		} catch (IOException e) {
			Log.e(LCAT, "Error while getting a directory listing: " + e.getMessage(), e);
		}
		return listing;
	}

	public String toString ()
	{
		return toURL();
	}


	// OUTSIDE OF THE API
//	String getPath()
//	{
//		return path;
//	}
}
