/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.io;

import android.net.Uri;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/** Wraps an invalid or inaccessible file URL reference. Most methods will no-op. */
public class TiMockFile extends TiBaseFile
{
	private String url;
	private File file;

	public TiMockFile(String url)
	{
		super(TYPE_BLOB);

		// Store the given URL.
		this.url = url;

		// Attempt to fetch URL's file path if it exists.
		if (url != null) {
			String path = Uri.parse(url).getSchemeSpecificPart();
			if (path != null) {
				int index = path.indexOf('?');
				if (index >= 0) {
					path = path.substring(0, index);
				}
				if (!path.isEmpty()) {
					this.file = new File(path);
				}
			}
		}
	}

	@Override
	public String nativePath()
	{
		return this.url;
	}

	@Override
	public String name()
	{
		return (this.file != null) ? this.file.getName() : null;
	}

	@Override
	public String extension()
	{
		String fileName = name();
		if (fileName != null) {
			int index = fileName.lastIndexOf('.');
			if (index >= 0) {
				return fileName.substring(index + 1);
			}
		}
		return null;
	}

	@Override
	public File getNativeFile()
	{
		return null;
	}

	@Override
	public InputStream getInputStream() throws IOException
	{
		return null;
	}

	@Override
	public OutputStream getOutputStream() throws IOException
	{
		return null;
	}

	@Override
	public boolean exists()
	{
		return false;
	}

	@Override
	public boolean createDirectory(boolean recursive)
	{
		return false;
	}

	@Override
	public boolean createFile()
	{
		return false;
	}

	@Override
	public boolean isReadonly()
	{
		return false;
	}

	@Override
	public boolean isWriteable()
	{
		return false;
	}

	@Override
	public long size()
	{
		return 0L;
	}
}
