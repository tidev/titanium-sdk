/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.database;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Context;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;

@Kroll.proxy
public class TiDatabaseProxy extends KrollProxy
{
	private static final String LCAT = "TiDB";
	private static final boolean DBG = TiConfig.LOGD;

	protected SQLiteDatabase db;
	protected String name;
	boolean statementLogging;

	public TiDatabaseProxy(TiContext tiContext, String name, SQLiteDatabase db)
	{
		super(tiContext);
		this.name = name;
		this.db = db;
		statementLogging = false;
	}

	@Kroll.method
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

	@Kroll.method
	public TiResultSetProxy execute(String sql, Object... args)
	{
		if(statementLogging) {
			StringBuilder sb = new StringBuilder();
			sb.append("Executing SQL: ").append(sql).append("\n  Args: [ ");
			boolean needsComma = false;

			for(Object s : args) {
				if (needsComma) {
					sb.append(", \"");
				} else {
					sb.append(" \"");
					needsComma = true;
				}
				sb.append(TiConvert.toString(s)).append("\"");
			}
			sb.append(" ]");
			if (TiConfig.LOGV) {
				Log.v(LCAT,  sb.toString());
			}
		}

		TiResultSetProxy rs = null;
		Cursor c = null;
		String[] newArgs = null;
		if (args != null) {
			newArgs = new String[args.length];
			for(int i = 0; i < args.length; i++) {
				newArgs[i] = TiConvert.toString(args[i]);
			}
		}
		try {
			if(sql.trim().toLowerCase().startsWith("select")) {
				c = db.rawQuery(sql, newArgs);
				if (c != null) {
					rs = new TiResultSetProxy(getTiContext(), c);
					if (rs.isValidRow()) {
						rs.next(); // Position on first row if we have data.
					}
				} else {
					rs = new TiResultSetProxy(getTiContext(), null); // because iPhone does it this way.
				}
			} else {
				if (args != null) {
					db.execSQL(sql, args);
				} else {
					db.execSQL(sql);
				}
			}
		} catch (SQLException e) {
			String msg = "Error executing sql: " + e.getMessage();
			Log.e(LCAT, msg, e);
			if (c != null) {
				try {
					c.close();
				} catch (SQLException e2) {
					// Ignore
				}
			}
			//TODO throw exception
		}

		return rs;
	}

	@Kroll.getProperty @Kroll.method
	public String getName() {
		return name;
	}

	@Kroll.getProperty @Kroll.method
	public int getLastInsertRowId() {
		return (int) DatabaseUtils.longForQuery(db, "select last_insert_rowid()", null);
	}

	@Kroll.getProperty @Kroll.method
	public int getRowsAffected() {
		return (int) DatabaseUtils.longForQuery(db, "select changes()", null);
	}

	@Kroll.method
	public void remove() {
		if (db.isOpen()) {
			Log.w(LCAT, "Attempt to remove open database. Closing then removing " + name);
			db.close();
		}
		Context ctx = getTiContext().getTiApp();
		if (ctx != null) {
			ctx.deleteDatabase(name);
		} else {
			Log.w(LCAT, "Unable to remove database, context has been reclaimed by GC: " + name);
		}
	}

}
