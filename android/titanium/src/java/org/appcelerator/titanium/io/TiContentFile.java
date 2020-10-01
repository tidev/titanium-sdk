/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;

/**
 * Uses a ContentResolver/ContentProvider to access a file referenced by a "content://" or "android.resource://" URL.
 * Typically used to expose file access between apps or to provide access to a file embedded within a file.
 */
public class TiContentFile extends TiBaseFile
{
	private static final String TAG = "TiContentFile";

	/** The "content://" URI referencing the file. Can be null. */
	private Uri uri;

	/** The file name (including extension) referenced by the content URI. Can be null. */
	private String name;

	/** Absolute path to the file. Can be null if not accessible via the file system. */
	private String path;

	/** The file size in bytes. Will be negative if size is unknown. */
	private long size = -1L;

	/** The file's creation time in milliseconds since 1970. Will be negative if unknown. */
	private long createdTime = -1L;

	/** The file's modfication time in milliseconds since 1970. Will be negative if unknown. */
	private long modifiedTime = -1L;

	/**
	 * Creates an object used to access a file via a ContentResolver/ContentProvider.
	 * @param url Reference to a file via a "content://" or "android.resource://" scheme. Can be null.
	 */
	public TiContentFile(String url)
	{
		super(TYPE_BLOB);
		this.uri = (url != null) ? Uri.parse(url) : null;
		init();
	}

	/**
	 * Creates an object used to access a file via a ContentResolver/ContentProvider.
	 * @param uri Reference to a file via a "content://" or "android.resource://" scheme. Can be null.
	 */
	public TiContentFile(Uri uri)
	{
		super(TYPE_BLOB);
		this.uri = uri;
		init();
	}

	private void init()
	{
		// Initialize file related member variables.
		this.name = null;
		this.path = null;
		this.size = -1L;
		this.createdTime = -1L;
		this.modifiedTime = -1L;

		// Do not continue if not provided a valid URI. (Nothing to fetch from content provider.)
		if (this.uri == null) {
			return;
		}

		// Get ready to fetch URL's description, path, file size, and timestamps via content provider.
		String[] projection = {
			MediaStore.MediaColumns.DISPLAY_NAME,
			MediaStore.MediaColumns.DATA,
			MediaStore.MediaColumns.SIZE,
			MediaStore.MediaColumns.DATE_ADDED,
			MediaStore.MediaColumns.DATE_MODIFIED
		};
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();

		// First, attempt to fetch an absolute path to the file, if publicly available.
		String url = this.uri.toString();
		if (url.startsWith("content://com.android.providers.media.documents")) {
			// This is a media scanned file.
			String id = null;
			try (Cursor cursor = contentResolver.query(this.uri, null, null, null, null)) {
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
				Uri queryUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
				String queryString = MediaStore.Images.Media._ID + " = ? ";
				String[] valueArray = new String[] { id };
				try (Cursor cursor = contentResolver.query(queryUri, projection, queryString, valueArray, null)) {
					if ((cursor != null) && cursor.moveToNext()) {
						this.name = getStringFrom(cursor, 0);
						this.path = getStringFrom(cursor, 1);
					}
				} catch (Exception ex) {
				}
			}
		} else if (url.startsWith("content://com.android.providers.downloads.documents")) {
			// This was a file downloaded from the Google cloud.
			String id = DocumentsContract.getDocumentId(this.uri);
			try {
				if (id.startsWith("raw:")) {
					this.path = id.substring(4);
					this.name = this.path.substring(this.path.lastIndexOf(File.pathSeparatorChar) + 1);
				} else {
					Uri queryUri = ContentUris.withAppendedId(
						Uri.parse("content://downloads/public_downloads"), Long.valueOf(id));
					try (Cursor cursor = contentResolver.query(queryUri, projection, null, null, null)) {
						if ((cursor != null) && cursor.moveToNext()) {
							this.name = getStringFrom(cursor, 0);
							this.path = getStringFrom(cursor, 1);
						}
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
			try (Cursor cursor = contentResolver.query(this.uri, projection, null, null, null)) {
				if ((cursor != null) && cursor.moveToNext()) {
					// Fetch the file's description.
					this.name = getStringFrom(cursor, 0);

					// Attempt to fetch the file system path, if accessible.
					File tiFile = TiFileProvider.getFileFrom(this.uri);
					if (tiFile != null) {
						this.path = tiFile.getAbsolutePath();
					} else {
						this.path = getStringFrom(cursor, 1);
					}
					if (canReadFromFile(this.path) == false) {
						this.path = null;
					}

					// Only fetch the following info if we don't have file system access.
					if (this.path == null) {
						// Fetch file size.
						if ((cursor.getType(2) == Cursor.FIELD_TYPE_INTEGER)) {
							this.size = cursor.getLong(2);
						}

						// Fetch file creation/modification times in milliseconds since 1970.
						// Note: These are returned in seconds. We must convert.
						if (cursor.getType(3) == Cursor.FIELD_TYPE_INTEGER) {
							this.createdTime = cursor.getLong(3) * 1000L;
						}
						if (cursor.getType(4) == Cursor.FIELD_TYPE_INTEGER) {
							this.modifiedTime = cursor.getLong(4) * 1000L;
						}
					}
				}
			} catch (Exception ex) {
				Log.e(TAG, "Error reading from ContentResolver for url:" + url, ex);
			}
		}
	}

	@Override
	public String nativePath()
	{
		return (this.uri != null) ? this.uri.toString() : null;
	}

	@Override
	public String name()
	{
		return this.name;
	}

	@Override
	public String extension()
	{
		String filePath = (this.path != null) ? this.path : this.name;
		if (filePath != null) {
			int periodIndex = filePath.lastIndexOf('.');
			if (periodIndex >= 0) {
				int slashIndex = filePath.indexOf(File.separatorChar, periodIndex);
				if (slashIndex < periodIndex) {
					return filePath.substring(periodIndex + 1);
				}
			}
		}
		return null;
	}

	@Override
	public File getNativeFile()
	{
		if (this.path == null) {
			return null;
		}
		return new File(path);
	}

	@Override
	public InputStream getInputStream() throws IOException
	{
		if (this.uri == null) {
			return null;
		}
		return TiApplication.getInstance().getContentResolver().openInputStream(this.uri);
	}

	@Override
	public OutputStream getOutputStream() throws IOException
	{
		if (this.uri == null) {
			return null;
		}
		return TiApplication.getInstance().getContentResolver().openOutputStream(this.uri);
	}

	@Override
	public void write(TiBlob blob, boolean append) throws IOException
	{
		// Validate.
		if ((this.uri == null) || (blob == null)) {
			return;
		}

		// Write given blob's bytes to this blob.
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		String modeString = append ? "wa" : "w";
		try (InputStream inputStream = blob.getInputStream();
			 OutputStream outputStream = contentResolver.openOutputStream(this.uri, modeString)) {
			if ((inputStream != null) && (outputStream != null)) {
				copyStream(inputStream, outputStream);
			}
		}
	}

	@Override
	public void write(String data, boolean append) throws IOException
	{
		if ((data != null) && !data.isEmpty()) {
			write(TiBlob.blobFromString(data), append);
		}
	}

	@Override
	public boolean deleteFile()
	{
		if (this.uri == null) {
			return false;
		}
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		return (contentResolver.delete(this.uri, null, null) != 0);
	}

	@Override
	public boolean exists()
	{
		// Validate.
		if (this.uri == null) {
			return false;
		}

		// Check if we have public file system access. (This is the fastest check.)
		try {
			File file = getNativeFile();
			if (file.exists()) {
				return true;
			}
		} catch (Exception ex) {
		}

		// Check if we're referencing an existing file embedded within a file.
		// Example: A file within an APK's "assets" or "res" folder.
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		try (AssetFileDescriptor descriptor = contentResolver.openAssetFileDescriptor(this.uri, "r")) {
			if (descriptor != null) {
				return true;
			}
		} catch (Exception ex) {
		}

		// Check if referencing an existing sandboxed file in the file system.
		try (ParcelFileDescriptor descriptor = contentResolver.openFileDescriptor(this.uri, "r")) {
			if (descriptor != null) {
				return true;
			}
		} catch (Exception ex) {
		}

		// Check if we can open a file stream. (The most expensive check.)
		// This can happen with in-memory files or decoded files.
		try (InputStream stream = contentResolver.openInputStream(this.uri)) {
			if (stream != null) {
				return true;
			}
		} catch (Exception ex) {
		}

		// File not found.
		return false;
	}

	@Override
	public boolean createDirectory(boolean recursive)
	{
		File file = getNativeFile();
		if (file != null) {
			TiFile tiFile = new TiFile(file, file.getAbsolutePath(), false);
			return tiFile.createDirectory(recursive);
		}
		return false;
	}

	@Override
	public boolean createFile()
	{
		File file = getNativeFile();
		if (file != null) {
			TiFile tiFile = new TiFile(file, file.getAbsolutePath(), false);
			return tiFile.createFile();
		}
		return false;
	}

	@Override
	public long createTimestamp()
	{
		// If we've successfully fetched timestamp from content provider, then return it.
		if (this.createdTime >= 0L) {
			return this.createdTime;
		}

		// Attempt to fetch timestamp via filesystem, if actually referencing a file.
		File file = getNativeFile();
		if (file != null) {
			TiFile tiFile = new TiFile(file, file.getAbsolutePath(), false);
			return tiFile.createTimestamp();
		}

		// Log a warning stating timestamp was not obtainable.
		return super.createTimestamp();
	}

	@Override
	public long modificationTimestamp()
	{
		// If we've successfully fetched timestamp from content provider, then return it.
		if (this.modifiedTime >= 0L) {
			return this.modifiedTime;
		}

		// Attempt to fetch timestamp via filesystem, if actually referencing a file.
		File file = getNativeFile();
		if (file != null) {
			return file.lastModified();
		}

		// Log a warning stating timestamp was not obtainable.
		return super.modificationTimestamp();
	}

	@Override
	public boolean isReadonly()
	{
		return !isWriteable() && exists();
	}

	@Override
	public boolean isWriteable()
	{
		if (this.uri != null) {
			ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
			try (OutputStream stream = contentResolver.openOutputStream(this.uri, "wa")) {
				return true;
			} catch (Exception ex) {
			}
		}
		return false;
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

	private static String getStringFrom(Cursor cursor, int columnIndex)
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

	private static boolean canReadFromFile(String path)
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
