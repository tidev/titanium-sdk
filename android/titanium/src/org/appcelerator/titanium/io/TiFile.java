/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.net.Uri;

public class TiFile extends TiBaseFile
{
	private static final String LCAT = "TiFile";
	private static final boolean DBG = TiConfig.LOGD;

	private final File file;
	private final String path;

	public TiFile(TiContext tiContext, File file, String path, boolean stream)
	{
		super(tiContext, TiBaseFile.TYPE_FILE);
		this.file = file;
		this.path = path;
		this.stream = stream;
	}
	@Override
	public boolean isFile()
	{
		return file.isFile();
	}

	@Override
	public boolean isDirectory()
	{
		return file.isDirectory();
	}

	@Override
	public boolean isHidden()
	{
		return file.isHidden();
	}

	@Override
	public boolean isReadonly()
	{
		return file.canRead() && !file.canWrite();
	}

	@Override
	public boolean isWriteable()
	{
		return file.canWrite();
	}

	@Override
	public boolean createDirectory(boolean recursive)
	{
		if (recursive)
		{
			return file.mkdirs();
		}
		else
		{
			return file.mkdir();
		}
	}

	private boolean deleteTree(File d) {
		boolean deleted = true;

		File[] files = d.listFiles();
		
		for (File f : files) {
			if (f.isFile()) {
				deleted = f.delete();
				if (!deleted) {
					break;
				}
			} else {
				if (deleteTree(f)) {
					deleted = f.delete();
				} else {
					break;
				}
			}
		}

		return deleted;
	}

	@Override
	public boolean deleteDirectory(boolean recursive) {
		boolean deleted = false;

		if (recursive) {
			deleted = deleteTree(file);
			if (deleted) {
				deleted = file.delete();
			}
		} else {
			deleted = file.delete();
		}

		return deleted;
	}
	@Override
	public boolean deleteFile()
	{
		return file.delete();
	}

	@Override
	public boolean exists()
	{
		return file.exists();
	}

	@Override
	public double createTimestamp()
	{
		return file.lastModified();
	}

	@Override
	public double modificationTimestamp()
	{
		return file.lastModified();
	}

	@Override
	public String name()
	{
		return file.getName();
	}

	@Override
	public String extension()
	{
		String name = file.getName();
		int idx = name.lastIndexOf(".");
		if (idx != -1)
		{
			return name.substring(idx+1);
		}
		return null;
	}

	@Override
	public String nativePath()
	{	String p = null;
		if (file != null) {
			p = "file://" + file.getAbsolutePath();
		}
		return p;
	}

	public String toURL() {
		String url = null;
		url = Uri.fromFile(file).toString();
		return url;
	}

	@Override
	public double size()
	{
		return file.length();
	}

	@Override
	public double spaceAvailable()
	{
		// only implemented in Java 6.0 :(
		return 0;
	}

	@Override
	public boolean setReadonly()
	{
		file.setReadOnly();
		return isReadonly();
	}

	public String toString()
	{
		return path;
	}

	public File getFile()
	{
		return file;
	}

	@Override
	public InputStream getInputStream() throws IOException {
		return new FileInputStream(file);
	}

	@Override
	public OutputStream getOutputStream() throws IOException {
		return getOutputStream(MODE_WRITE);
	}

	public OutputStream getOutputStream(int mode) throws IOException {
		return new FileOutputStream(file, mode == MODE_APPEND ? true : false);
	}

	public File getNativeFile() {
		return file;
	}

	@Override
	public List<String> getDirectoryListing() {
		File dir = getNativeFile();
		List<String> listing = new ArrayList<String>();

		String[] names = dir.list();
		if (names != null) {
			int len = names.length;
			for (int i = 0; i < len; i++) {
				listing.add(names[i]);
			}
		}

		return listing;
	}


	@Override
	public TiBaseFile getParent()
	{
		TiBaseFile parentFile = null;

		File f = getNativeFile();
		if (f != null) {
			File p = f.getParentFile();

			if (p != null) {
				parentFile = TiFileFactory.createTitaniumFile(getTiContext(), "file://" + p.getAbsolutePath(), false);
			}
		}

		return parentFile;
	}

	@Override
	public void open(int mode, boolean binary) throws IOException
	{
		this.binary = binary;

		if (mode == MODE_READ) {
			if (!file.exists()) {
				throw new FileNotFoundException(file.getAbsolutePath());
			}
			if (binary) {
				instream = new BufferedInputStream(getInputStream());
			} else {
				inreader = new BufferedReader(new InputStreamReader(new FileInputStream(file), "utf-8"));
			}
		} else {
			OutputStream os = getOutputStream(mode);
			if (binary) {
				outstream = new BufferedOutputStream(os);
			} else {
				outwriter = new BufferedWriter(new OutputStreamWriter(os));
			}
			os = null;
		}

		opened = true; // no exception getting here.
	}

	@Override
	public TiBlob read() throws IOException
	{
		return TiBlob.blobFromFile(getTiContext(), this);
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

	public void write(TiBlob blob, boolean append) throws IOException
	{
		if (DBG) {
			Log.d(LCAT,"write called for file = " + file);
		}

		if (blob != null) {
			if (!stream) {
				try {
					open(append ? MODE_APPEND : MODE_WRITE, true);
					outstream.write(blob.getBytes());
				} finally {
					close();
				}
			} else {

				if (!opened) {
					throw new IOException("Must open before calling write");
				}

				if (binary) {
					outstream.write(blob.getBytes());
				} else {
					outwriter.write(new String(blob.getBytes(),"UTF-8"));
				}
			}
		}
	}

	public void writeFromUrl(String url, boolean append) throws IOException
	{
		if (DBG) {
			Log.d(LCAT,"write called for file = " + file);
		}
		TiContext tiContext = getTiContext();
		if (tiContext != null) {
			String[] parts = { url };

			TiBaseFile f = TiFileFactory.createTitaniumFile(tiContext, parts, append);

			if (f != null) {
				if (!stream) {
					InputStream is = null;
					try {
						open(append ? MODE_APPEND : MODE_WRITE, true);
						is = f.getInputStream();
						copyStream(is, outstream);
					} finally {
						if (is != null) {
							is.close();
						}
						close();
					}
				} else {

					if (!opened) {
						throw new IOException("Must open before calling write");
					}

					if (binary) {
						InputStream is = null;
						try {
							is = f.getInputStream();
							copyStream(is, outstream);
						} finally {
							if (is != null) {
								is.close();
							}
						}
					} else {
						BufferedReader ir = null;
						try {
							ir = new BufferedReader(new InputStreamReader(f.getInputStream(), "utf-8"));
							copyStream(ir, outwriter);
						} finally {
							if(ir != null) {
								ir.close();
							}
						}
					}
				}
			}
		}
	}

	@Override
	public void write(String data, boolean append) throws IOException
	{
		if (DBG) {
			Log.d(LCAT,"write called for file = " + file);
		}
		if (!stream) {
			try {
				open(append ? MODE_APPEND : MODE_WRITE, false);
				outwriter.write(data);
			} finally {
				close();
			}
		} else {
			if (!opened) {
				throw new IOException("Must open before calling write");
			}

			if (binary) {
				outstream.write(data.getBytes());
			} else {
				outwriter.write(data);
			}
		}
	}

	@Override
	public void writeLine(String data) throws IOException
	{
		if (!opened) {
			throw new IOException("Must open before calling readLine");
		}
		if (binary) {
			throw new IOException("File opened in binary mode, writeLine not available.");
		}

		outwriter.write(data);
		outwriter.write("\n");
	}
}
