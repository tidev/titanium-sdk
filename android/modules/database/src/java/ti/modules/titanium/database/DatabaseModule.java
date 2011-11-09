/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
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
	private static final String LCAT = "TiDatabase";
	private static final boolean DBG = TiConfig.LOGD;

	@Kroll.constant public static final int FIELD_TYPE_UNKNOWN = -1;
	@Kroll.constant public static final int FIELD_TYPE_STRING = 0;
	@Kroll.constant public static final int FIELD_TYPE_INT = 1;
	@Kroll.constant public static final int FIELD_TYPE_FLOAT = 2;
	@Kroll.constant public static final int FIELD_TYPE_DOUBLE = 3;

	public DatabaseModule()
	{
		super();
	}

	public DatabaseModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public TiDatabaseProxy open(Object file)
	{
		TiDatabaseProxy dbp = null;

		try {
			if (file instanceof TiFileProxy) {
				// File support is read-only for now. The NO_LOCALIZED_COLLATORS flag means the database doesn't have Android metadata (i.e. vanilla)
				TiFileProxy tiFile = (TiFileProxy) file;
				String absolutePath = tiFile.getBaseFile().getNativeFile().getAbsolutePath();
				Log.d(LCAT, "Opening database from filesystem: " + absolutePath);
				
				SQLiteDatabase db = SQLiteDatabase.openDatabase(absolutePath, null, SQLiteDatabase.OPEN_READONLY | SQLiteDatabase.NO_LOCALIZED_COLLATORS);
				dbp = new TiDatabaseProxy(db);
			} else {
				String name = TiConvert.toString(file);
				SQLiteDatabase db = TiApplication.getInstance().openOrCreateDatabase(name, Context.MODE_PRIVATE, null);
				dbp = new TiDatabaseProxy(name, db);
			}
			
			if (DBG) {
				Log.d(LCAT, "Opened database: " + dbp.getName());
			}

		} catch (SQLException e) {
			String msg = "Error opening database: " + dbp.getName() + " msg=" + e.getMessage();
			Log.e(LCAT, msg, e);
			throw e;
		}

		return dbp;
	}

	@Kroll.method
	public TiDatabaseProxy install(KrollInvocation invocation, String url, String name) throws IOException
	{
		try {
			//TiContext tiContext = invocation.getTiContext();
			Context ctx = TiApplication.getInstance();
			for (String dbname : ctx.databaseList())
			{
				if (dbname.equals(name))
				{
					return open(name);
				}
			}
			// open an empty one to get the full path and then close and delete it
			File dbPath = ctx.getDatabasePath(name);

			if (DBG) {
				Log.d(LCAT,"db path is = "+dbPath);
				Log.d(LCAT,"db url is = "+url);
			}

			TiUrl tiUrl = TiUrl.createProxyUrl(invocation.getSourceUrl());
			String path = TiUrl.resolve(tiUrl.baseUrl, url, null);
			
			TiBaseFile srcDb = TiFileFactory.createTitaniumFile(path, false);

			if (DBG) {
				Log.d(LCAT,"new url is = "+url);
			}

			InputStream is = null;
			OutputStream os = null;

			byte[] buf = new byte[8096];
			int count = 0;
			try
			{
				is = new BufferedInputStream(srcDb.getInputStream());
				os = new BufferedOutputStream(new FileOutputStream(dbPath));

				while((count = is.read(buf)) != -1) {
					os.write(buf, 0, count);
				}
			}
			finally
			{
				try { is.close(); } catch (Exception ig) { }
				try { os.close(); } catch (Exception ig) { }
			}

			return open(name);

		} catch (SQLException e) {
			String msg = "Error installing database: " + name + " msg=" + e.getMessage();
			Log.e(LCAT, msg, e);
			throw e;
		}
		catch (IOException e) {
			String msg = "Error installing database: " + name + " msg=" + e.getMessage();
			Log.e(LCAT, msg, e);
			throw e;
		}
	}
}
