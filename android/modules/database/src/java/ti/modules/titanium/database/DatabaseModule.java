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
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUrl;

import android.content.Context;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;

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
		// Validate argument.
		if (file == null) {
			throw new IllegalArgumentException("Ti.Database.open() was given a null argument.");
		}

		// Attempt to create/open the given database file/name.
		TiDatabaseProxy dbp = null;
		if (file instanceof TiFileProxy) {
			TiFileProxy tiFile = (TiFileProxy) file;
			String absolutePath = tiFile.getBaseFile().getNativeFile().getAbsolutePath();
			Log.d(TAG, "Opening database from filesystem: " + absolutePath);

			SQLiteDatabase db = SQLiteDatabase.openDatabase(
				absolutePath, null, SQLiteDatabase.CREATE_IF_NECESSARY | SQLiteDatabase.NO_LOCALIZED_COLLATORS);
			if (db != null) {
				dbp = new TiDatabaseProxy(db);
			} else {
				String badPath = (absolutePath != null) ? absolutePath : "(null)";
				badPath = "'" + badPath + "'";
				throw new RuntimeException("SQLiteDatabase.openDatabase() returned null for path: " + badPath);
			}
		} else {
			String name = TiConvert.toString(file);
			SQLiteDatabase db = TiApplication.getInstance().openOrCreateDatabase(name, Context.MODE_PRIVATE, null);
			if (db != null) {
				dbp = new TiDatabaseProxy(name, db);
			} else {
				String badName = (name != null) ? name : "(null)";
				badName = "'" + badName + "'";
				throw new RuntimeException("SQLiteDatabase.openOrCreateDatabase() returned null for name: " + badName);
			}
		}
		Log.d(TAG, "Opened database: " + dbp.getName(), Log.DEBUG_MODE);
		return dbp;
	}

	@Kroll.method
	public TiDatabaseProxy install(KrollInvocation invocation, String url, String name) throws IOException
	{
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
		TiUrl tiUrl = TiUrl.createProxyUrl(invocation.getSourceUrl());
		String sourcePath = TiUrl.resolve(tiUrl.baseUrl, url, null);
		TiBaseFile srcDb = TiFileFactory.createTitaniumFile(sourcePath, false);
		if (srcDb.isFile() == false) {
			if (url == null) {
				url = "(null)";
			}
			throw new java.io.FileNotFoundException("Failed to find source database file: '" + url + "'");
		}

		// open an empty one to get the full path and then close and delete it
		if (name.startsWith("appdata://")) {
			String path = name.substring(10);
			if (path != null && path.length() > 0 && path.charAt(0) == '/') {
				path = path.substring(1);
			}
			File f = new File(TiFileFactory.getDataDirectory(false), path);
			name = f.getAbsolutePath();
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
