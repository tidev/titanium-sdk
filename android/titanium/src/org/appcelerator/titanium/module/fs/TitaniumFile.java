/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.fs;

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

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.api.TitaniumMemoryBlob;
import org.appcelerator.titanium.util.Log;

public class TitaniumFile extends TitaniumBaseFile
{
	private static final String LCAT = "TiFile";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private final File file;
	private final String path;

	public TitaniumFile(TitaniumModuleManager tmm, File file, String path, boolean stream)
	{
		super(tmm, TitaniumBaseFile.TYPE_FILE);
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
	public void createDirectory(boolean recursive)
	{
		if (recursive)
		{
			file.mkdirs();
		}
		else
		{
			file.mkdir();
		}
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
	{
		return file.getAbsolutePath();
	}

	@Override
	public double size()
	{
		return file.length();
	}

	@Override
	public double spaceAvailable()
	{
		//FIXME
		return 99999999L;
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
	public String read() throws IOException
	{
		String result = null;

		if (file.exists()) {
			if (!stream) {
				StringBuilder builder=new StringBuilder();
				try
				{
					open(MODE_READ, false);

					char buffer [] = new char[4096];
					int count = 0;
					while((count = inreader.read(buffer)) != -1)
					{
						builder.append(buffer, 0, count);
					}
				}
				finally
				{
					close();
				}
				result = builder.toString();
			} else {
				if (!opened) {
					throw new IOException("File must be opened before reading");
				}

				if (binary) {
					byte buffer[] = new byte[4096];
					int count = 0;
					count = instream.read(buffer);
					if (count != -1) {
						result = new String(buffer, "utf-8");
					}
				} else {
					result = inreader.readLine();
				}
			}
		}

		return result;
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

	public void write(int key, boolean append) throws IOException
	{
		if (DBG) {
			Log.d(LCAT,"write called for file = " + file);
		}

		if (!opened) {
			throw new IOException("Must open before calling write");
		}

		TitaniumModuleManager tmm = weakTmm.get();
		if (tmm != null) {
			TitaniumMemoryBlob blob = (TitaniumMemoryBlob) tmm.getObject(key);
			if (blob != null) {
				if (binary) {
					outstream.write(blob.getData());
				} else {
					outwriter.write(new String(blob.getData(),"UTF-8"));
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
