/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.MediaStore;

public class TitaniumBlob extends TiBaseFile
{
	private static final String TAG = "TitaniumBlob";

	protected String url;
	protected String name;
	protected String path;
	protected long size;

	public TitaniumBlob(String url)
	{
		super(TYPE_BLOB);
		this.url = url;
		init();
	}

	protected void init()
	{
		// Initialize file related member variables.
		this.name = null;
		this.path = null;
		this.size = -1L;

		// Do not continue if not provided a valid URL. (Nothing to fetch from content provider.)
		if (this.url == null) {
			return;
		}

		// Get ready to fetch URL's description, path, and file size via content provider.
		String[] projection = { MediaStore.Images.ImageColumns.DISPLAY_NAME, MediaStore.Images.ImageColumns.DATA,
								MediaStore.Images.ImageColumns.SIZE };
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		// First, attempt to fetch an absolute path to the file, if publicly available.
		if (url.startsWith("content://com.android.providers.media.documents")) {
			// This is a media scanned file.
			String id = null;
			try (Cursor cursor = contentResolver.query(Uri.parse(url), null, null, null, null)) {
				if (cursor != null) {
					cursor.moveToFirst();
					id = getStringFrom(cursor, 0);
					if (id != null) {
						id = id.substring(id.lastIndexOf(":") + 1);
					}
				}
			} catch (Exception ex) {
			}
			if (id != null) {
				Uri uri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
				String queryString = MediaStore.Images.Media._ID + " = ? ";
				try (Cursor cursor = contentResolver.query(uri, projection, queryString, new String[] { id }, null)) {
					if ((cursor != null) && cursor.moveToNext()) {
						this.name = getStringFrom(cursor, 0);
						this.path = getStringFrom(cursor, 1);
					}
				} catch (Exception ex) {
				}
			}
		} else if (url.startsWith("content://com.android.providers.downloads.documents")) {
			// This was a file downloaded from the Google cloud.
			String id = DocumentsContract.getDocumentId(Uri.parse(url));
			try {
				if (id.startsWith("raw:")) {
					this.path = id.substring(4);
					this.name = this.path.substring(this.path.lastIndexOf(File.pathSeparatorChar) + 1);
				} else {
					Uri uri =
						ContentUris.withAppendedId(Uri.parse("content://downloads/public_downloads"), Long.valueOf(id));
					Cursor cursor = contentResolver.query(uri, projection, null, null, null);
					if ((cursor != null) && cursor.moveToNext()) {
						this.name = getStringFrom(cursor, 0);
						this.path = getStringFrom(cursor, 1);
					}
				}
			} catch (Exception ex) {
			}
		}
		if (canReadFromFile(this.path) == false) {
			// We don't have permission to read from the file system path retrieved above.
			this.path = null;
		}

		// If the above didn't give us direct file system access, then query content provider normally.
		if (this.path == null) {
			try (Cursor cursor = contentResolver.query(Uri.parse(url), projection, null, null, null)) {
				if ((cursor != null) && cursor.moveToNext()) {
					// Fetch the file's description.
					this.name = getStringFrom(cursor, 0);

					// Attempt to fetch the file system path, if accessible.
					this.path = getStringFrom(cursor, 1);
					if (canReadFromFile(this.path) == false) {
						this.path = null;
					}

					// Only fetch file size from content provider if we don't have file system access.
					if ((this.path == null) && (cursor.getType(2) == Cursor.FIELD_TYPE_INTEGER)) {
						this.size = cursor.getLong(2);
					}
				}
			} catch (Exception ex) {
				Log.e(TAG, "Error reading from ContentResolver for url:" + url, ex);
			}
		}
	}

	public void setUrl(String url)
	{
		this.url = url;
		init();
	}

	@Override
	public String nativePath()
	{
		return url;
	}

	public String toURL()
	{
		return url;
	}

	@Override
	public String name()
	{
		return name;
	}

	public File getFile()
	{
		return getNativeFile();
	}

	public String getContentType()
	{
		if (url == null) {
			return null;
		}
		return TiApplication.getInstance().getContentResolver().getType(Uri.parse(url));
	}

	@Override
	public InputStream getInputStream() throws IOException
	{
		if (url == null) {
			return null;
		}
		return TiApplication.getInstance().getContentResolver().openInputStream(Uri.parse(url));
	}

	@Override
	public OutputStream getOutputStream() throws IOException
	{
		return null;
	}

	@Override
	public File getNativeFile()
	{
		if (path == null) {
			return null;
		}
		return new File(path);
	}

	public String getNativePath()
	{
		return path;
	}

	@Override
	public long size()
	{
		// If we've successfully fetched file size from content provider, then return it.
		if (this.size >= 0) {
			return this.size;
		}

		// Attempt to fetch file size via direct file system access.
		File file = getNativeFile();
		if (file != null) {
			return file.length();
		}

		// Log a warning stating file size was not obtainable.
		return super.size();
	}

	private String getStringFrom(Cursor cursor, int columnIndex)
	{
		String result = null;
		if ((cursor != null) && (columnIndex >= 0)) {
			try {
				if (cursor.getType(columnIndex) == Cursor.FIELD_TYPE_STRING) {
					result = cursor.getString(columnIndex);
				}
			} catch (Exception ex) {
			}
		}
		return result;
	}

	private boolean canReadFromFile(String path)
	{
		boolean canRead = false;
		if ((path != null) && !path.isEmpty()) {
			try {
				File file = new File(path);
				canRead = file.canRead();
			} catch (Exception ex) {
			}
		}
		return canRead;
	}
}
