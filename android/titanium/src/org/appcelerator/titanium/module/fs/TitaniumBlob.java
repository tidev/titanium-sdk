/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.fs;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;

public class TitaniumBlob extends TitaniumBaseFile
{
	protected Context context;
	protected String url;
	protected String name;
	protected String path;

	public TitaniumBlob(Context context, String url) {
		super(TitaniumBaseFile.TYPE_BLOB);
		this.context = context.getApplicationContext();
		this.url = url;
		if (url != null) {
			init();
		}
	}

	public TitaniumBlob(Context context) {
		this(context, null);
	}

	protected void init() {
		String [] projection = {
			MediaStore.Images.ImageColumns.DISPLAY_NAME,
			MediaStore.Images.ImageColumns.DATA
		};
		Cursor c = null;
		try {
			c = context.getContentResolver().query(Uri.parse(url), projection, null, null, null);

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

	@Override
	public String name() {
		return name;
	}

	public File getFile() {
		return new File(path);
	}

	public String getContentType() {
		return context.getContentResolver().getType(Uri.parse(url));
	}

	public InputStream openInputStream()
		throws FileNotFoundException
	{
		return context.getContentResolver().openInputStream(Uri.parse(url));
	}
}
