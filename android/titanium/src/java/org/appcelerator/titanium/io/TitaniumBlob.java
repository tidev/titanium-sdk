/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.appcelerator.titanium.TiApplication;

import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;

public class TitaniumBlob extends TiBaseFile
{
	protected String url;
	protected String name;
	protected String path;

	public TitaniumBlob(String url) {
		super(TYPE_BLOB);
		this.url = url;
		if (url != null) {
			init();
		}
	}

	protected void init() {
		String [] projection = {
			MediaStore.Images.ImageColumns.DISPLAY_NAME,
			MediaStore.Images.ImageColumns.DATA
		};
		Cursor c = null;
		try {
			c = TiApplication.getInstance().getContentResolver().query(Uri.parse(url), projection, null, null, null);

			if (c.moveToNext()) {
				name = c.getString(0);
				path = c.getString(1);
			}
		} finally {
			if (c != null) {
				c.close();
			}
		}
	}

	public void setUrl(String url) {
		this.url = url;
		if (url != null) {
			init();
		}
	}

	@Override
	public String nativePath() {
		return url;
	}

	public String toURL() {
		return url;
	}

	@Override
	public String name() {
		return name;
	}

	public File getFile() {
		return new File(path);
	}

	public String getContentType() {
		return TiApplication.getInstance().getContentResolver().getType(Uri.parse(url));
	}

	public InputStream getInputStream()
		throws IOException
	{
		return TiApplication.getInstance().getContentResolver().openInputStream(Uri.parse(url));
	}

	@Override
	public OutputStream getOutputStream() throws IOException {
		return null;
	}

	@Override
	public File getNativeFile() {
		return new File(path);
	}
}
