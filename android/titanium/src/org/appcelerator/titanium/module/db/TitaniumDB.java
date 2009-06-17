/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.db;

import java.lang.ref.WeakReference;

import org.appcelerator.titanium.api.ITitaniumDB;
import org.appcelerator.titanium.api.ITitaniumResultSet;

import android.content.Context;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.util.Config;
import android.util.Log;

public class TitaniumDB implements ITitaniumDB
{
	private static final String LCAT = "TiDB";
	private static final boolean DBG = Config.LOGD;

	protected String name;
	protected SQLiteDatabase db;
	protected WeakReference<Context> weakContext;
	protected String lastException;
	protected boolean statementLogging;

	public TitaniumDB(Context ctx, String name, SQLiteDatabase db) {
		this.db = db;
		this.name = name;
		this.weakContext = new WeakReference<Context>(ctx);
		this.statementLogging = false;
	}

	public void close() {
		if (db.isOpen()) {
			if (DBG) {
				Log.d(LCAT, "Closing database: " + name);
			}
			db.close();
		} else {
			if (DBG) {
				Log.d(LCAT, "Database is not open, ignoring close for " + name);
			}
		}
	}

	public ITitaniumResultSet execute(String sql, String[] args)
	{
		if(statementLogging) {
			StringBuilder sb = new StringBuilder();
			sb.append("Executing SQL: ").append(sql).append("\n  Args: [ ");
			boolean needsComma = false;

			for(String s : args) {
				if (needsComma) {
					sb.append(", \"");
				} else {
					sb.append(" \"");
					needsComma = true;
				}
				sb.append(s).append("\"");
			}
			sb.append(" ]");
			if (Config.LOGV) {
				Log.v(LCAT,  sb.toString());
			}
		}

		TitaniumResultSet rs = null;
		Cursor c = null;
		try {
			if(sql.trim().toLowerCase().startsWith("select")) {
				c = db.rawQuery(sql, args);
				if (c != null) {
					rs = new TitaniumResultSet(c);
					if (rs.isValidRow()) {
						rs.next(); // Position on first row if we have data.
					}
				}
			} else {
				db.execSQL(sql, args);
			}
		} catch (SQLException e) {
			String msg = "Error executing sql: " + e.getMessage();
			Log.e(LCAT, msg, e);
			setException(msg);
			if (c != null) {
				try {
					c.close();
				} catch (SQLException e2) {
					// Ignore
				}
			}
		}

		return rs;
	}

	public int getLastInsertRowId() {
		return (int) DatabaseUtils.longForQuery(db, "select last_insert_rowid()", null);
	}

	public int getRowsAffected() {
		return (int) DatabaseUtils.longForQuery(db, "select changes()", null);
	}

	public void remove() {
		if (db.isOpen()) {
			Log.w(LCAT, "Attempt to remove open database. Closing then removing " + name);
			db.close();
		}
		Context ctx = weakContext.get();
		if (ctx != null) {
			ctx.deleteDatabase(name);
		} else {
			Log.w(LCAT, "Unable to remove database, context has been reclaimed by GC: " + name);
		}
	}
	protected void setException(String msg) {
		lastException = msg;

	}
	public String getLastException() {
		String e = lastException;
		lastException = null;
		return e;
	}

	public void setStatementLogging(boolean enabled) {
		this.statementLogging = enabled;
	}
}
