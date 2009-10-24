/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumDB;
import org.appcelerator.titanium.api.ITitaniumDatabase;
import org.appcelerator.titanium.api.ITitaniumFile;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.db.TitaniumDB;
import org.appcelerator.titanium.util.TitaniumUrlHelper;
import org.appcelerator.titanium.util.Log;

import android.content.Context;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.webkit.WebView;
import android.net.Uri;

public class TitaniumDatabase extends TitaniumBaseModule implements
		ITitaniumDatabase
{
	private static final String LCAT = "TiDatabase";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected String lastException;

	public TitaniumDatabase(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumDatabase as " + name);
		}
		webView.addJavascriptInterface((ITitaniumDatabase) this, name);
	}

	public ITitaniumDB open(String name)
	{
		ITitaniumDB tdb = null;

		try {
			SQLiteDatabase db = getTitaniumWebView().getContext().openOrCreateDatabase(name, Context.MODE_PRIVATE, null);
			if (DBG) {
				Log.d(LCAT, "Opened database: " + name);
			}

			tdb = new TitaniumDB(getTitaniumWebView().getContext(), name, db);
		} catch (SQLException e) {
			String msg = "Error opening database: " + name + " msg=" + e.getMessage();
			Log.e(LCAT, msg, e);
			setException(msg);
		}

		return tdb;
	}

	public ITitaniumDB install(String url, String name)
	{
		try {
			Context ctx = getTitaniumWebView().getContext();
			for (String dbname : ctx.databaseList())
			{
				if (dbname.equals(name))
				{
					return open(name);
				}
			}
			// open an empty one to get the full path and then close and delete it
			File dbPath = ctx.getDatabasePath(name);
			
			Log.d(LCAT,"db path is = "+dbPath);
			Log.d(LCAT,"db url is = "+url);
			
			url = TitaniumUrlHelper.buildAssetUrlFromResourcesRoot(getActivity(), url);
			// now copy our installable db into the same location and re-open

			Log.d(LCAT,"new url is = "+url);

			InputStream is = null;
			OutputStream os = null;
			
			byte[] buf = new byte[8096];
			int count = 0;
			try
			{
				is = new BufferedInputStream(ctx.getContentResolver().openInputStream(Uri.parse(url)));
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
			setException(msg);
		}
		catch (IOException e) {
			String msg = "Error installing database: " + name + " msg=" + e.getMessage();
			Log.e(LCAT, msg, e);
			setException(msg);
		}
		
		return null;
	}

	protected void setException(String msg) {
		lastException = msg;

	}
	public String getLastException() {
		String e = lastException;
		lastException = null;
		return e;
	}

}
