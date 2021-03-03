/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.database;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.TiUrl;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;

@Kroll.module
public class DatabaseModule extends KrollModule
{
	private static final String TAG = "TiDatabase";

	@Kroll.constant
	public static final int FIELD_TYPE_UNKNOWN = -1;
	@Kroll.constant
	public static final int FIELD_TYPE_STRING = 0;
	@Kroll.constant
	public static final int FIELD_TYPE_INT = 1;
	@Kroll.constant
	public static final int FIELD_TYPE_FLOAT = 2;
	@Kroll.constant
	public static final int FIELD_TYPE_DOUBLE = 3;

	public DatabaseModule()
	{
		super();
	}

	@Kroll.method
	public TiDatabaseProxy open(Object file)
	{
		// Acquire database name or file object providing full file path from argument.
		TiBaseFile dbTiBaseFile = null;
		String dbName = null;
		if (file instanceof TiFileProxy) {
			// We were given a file proxy. Fetch its file object.
			dbTiBaseFile = ((TiFileProxy) file).getBaseFile();
		} else if (file instanceof String) {
			String fileString = (String) file;
			if (fileString.startsWith(File.separator)) {
				// Assume we were given an absolute file system path.
				dbTiBaseFile = TiFileFactory.createTitaniumFile(fileString, false);
			} else if (Uri.parse(fileString).getScheme() != null) {
				// We were given a URL. Box it in a Titanium file object if it's a known file scheme.
				if (TiFileFactory.isLocalScheme(fileString)) {
					dbTiBaseFile = TiFileFactory.createTitaniumFile(fileString, false);
				}
				if (dbTiBaseFile == null) {
					throw new IllegalArgumentException("Ti.Database.open() was given invalid URL: " + fileString);
				}
			} else {
				// Assume we were given a databas file name only. (This is the most common case.)
				dbName = fileString;
			}
		} else if (file != null) {
			throw new IllegalArgumentException("Ti.Database.open() argument must be of type 'String' or 'File'.");
		} else {
			throw new IllegalArgumentException("Ti.Database.open() was given a null argument.");
		}

		// Attempt to create/open the given database file/name.
		TiDatabaseProxy dbp = null;
		if (dbTiBaseFile != null) {
			// We were given a file object. Fetch its absolute path and open the database there.
			String absolutePath = null;
			if (dbTiBaseFile instanceof TiFile) {
				File actualFile = ((TiFile) dbTiBaseFile).getFile();
				if (actualFile != null) {
					absolutePath = actualFile.getAbsolutePath();
				}
			}
			if (absolutePath == null) {
				String message = "Ti.Database.open() was given invalid path: " + dbTiBaseFile.nativePath();
				throw new IllegalArgumentException(message);
			}
			Log.d(TAG, "Opening database from filesystem: " + absolutePath);
			SQLiteDatabase db = SQLiteDatabase.openDatabase(
				absolutePath, null, SQLiteDatabase.CREATE_IF_NECESSARY | SQLiteDatabase.NO_LOCALIZED_COLLATORS);
			if (db != null) {
				dbp = new TiDatabaseProxy(db);
			} else {
				throw new RuntimeException("SQLiteDatabase.openDatabase() returned null for path: " + absolutePath);
			}
		} else if (dbName != null) {
			// We were given a database name only. Open it under app's default database directory.
			SQLiteDatabase db = TiApplication.getInstance().openOrCreateDatabase(dbName, Context.MODE_PRIVATE, null);
			if (db != null) {
				dbp = new TiDatabaseProxy(dbName, db);
			} else {
				throw new RuntimeException("Context.openOrCreateDatabase() returned null for name: " + dbName);
			}
		} else {
			throw new IllegalArgumentException("Ti.Database.open() failed to extract path from argument: " + file);
		}

		// Return a proxy to the opened database.
		Log.d(TAG, "Opened database: " + dbp.getName(), Log.DEBUG_MODE);
		return dbp;
	}

	@Kroll.method
	public TiDatabaseProxy install(KrollInvocation invocation, String url, String name) throws IOException
	{
		// Validate arguments.
		if ((url == null) || url.isEmpty()) {
			throw new IllegalArgumentException("Ti.Database.install() 1st argument must be a non-empty string.");
		}
		if ((name == null) || name.isEmpty()) {
			throw new IllegalArgumentException("Ti.Database.install() 2nd argument must be a non-empty string.");
		}

		// Do not continue if the database has already been installed.
		// Open a connection to it and stop here.
		Context ctx = TiApplication.getInstance();
		for (String dbname : ctx.databaseList()) {
			if (dbname.equals(name)) {
				return open(name);
			}
		}

		// Fetch a path to the source database file. This is the file to be copied/installed.
		// Throw an exception if the source database was not found.
		Log.d(TAG, "db url is = " + url, Log.DEBUG_MODE);
		String resolveUrl = url;
		if (invocation != null) {
			TiUrl tiUrl = TiUrl.createProxyUrl(invocation.getSourceUrl());
			resolveUrl = TiUrl.resolve(tiUrl.baseUrl, url, null);
		}
		TiBaseFile srcDb = TiFileFactory.createTitaniumFile(resolveUrl, false);
		if (srcDb.isFile() == false) {
			String message = "Ti.Database.install() failed to find 1st argument's source database file: " + url;
			throw new java.io.FileNotFoundException(message);
		}

		// If target DB path/name is a URL such as "file://" or "appdata://", then turn it into a file system path.
		// Note: Normally you would set this to a file name, but Android also supports absolute file systems paths.
		if (Uri.parse(name).getScheme() != null) {
			boolean wasSuccessful = false;
			if (TiFileFactory.isLocalScheme(name)) {
				TiBaseFile tiBaseFile = TiFileFactory.createTitaniumFile(name, false);
				if (tiBaseFile instanceof TiFile) {
					File file = ((TiFile) tiBaseFile).getFile();
					if (file != null) {
						name = file.getAbsolutePath();
						wasSuccessful = true;
					}
				}
			}
			if (!wasSuccessful) {
				String message = "Ti.Database.install() 2nd argument was given invalid destination path: " + name;
				throw new IllegalArgumentException(message);
			}
		}

		// Set up the destination path that the source database file will be copied to.
		File dbPath = ctx.getDatabasePath(name);
		Log.d(TAG, "db path is = " + dbPath, Log.DEBUG_MODE);

		// Create the destination directory tree if it doesn't exist.
		dbPath.getParentFile().mkdirs();

		// Copy the source database file to the destination directory. (ie: Do the install.)
		try (InputStream inputStream = new BufferedInputStream(srcDb.getInputStream());
			 OutputStream outputStream = new BufferedOutputStream(new FileOutputStream(dbPath))) {

			byte[] byteBuffer = new byte[8096];
			int byteCount = 0;
			while ((byteCount = inputStream.read(byteBuffer)) > 0) {
				outputStream.write(byteBuffer, 0, byteCount);
			}
			outputStream.flush();
		}

		// Open a connection to the installed database.
		return open(name);
	}

	@Override
	public String getApiName()
	{
		return "Ti.Database";
	}
}
