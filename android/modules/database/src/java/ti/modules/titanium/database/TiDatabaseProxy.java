/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.database;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Context;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;

@Kroll.proxy(parentModule=DatabaseModule.class)
public class TiDatabaseProxy extends KrollProxy
{
	private static final String TAG = "TiDB";

	protected SQLiteDatabase db;
	protected String name;
	boolean statementLogging, readOnly;

	public TiDatabaseProxy(String name, SQLiteDatabase db)
	{
		//super(tiContext);
		super();
		this.name = name;
		this.db = db;
		statementLogging = false;
		readOnly = false;
	}

	public TiDatabaseProxy(TiContext tiContext, String name, SQLiteDatabase db)
	{
		this(name, db);
	}

	// readonly database
	public TiDatabaseProxy(SQLiteDatabase db)
	{
		//super(tiContext);
		super();
		this.name = db.getPath();
		this.db = db;
		statementLogging = false;
		readOnly = true;
	}

	public TiDatabaseProxy(TiContext tiContext, SQLiteDatabase db)
	{
		this(db);
	}

	@Kroll.method
	public void close() {
		if (db.isOpen()) {
			Log.d(TAG, "Closing database: " + name, Log.DEBUG_MODE);
			db.close();
		} else {
			Log.d(TAG, "Database is not open, ignoring close for " + name, Log.DEBUG_MODE);
		}
	}

	@Kroll.method
	public TiResultSetProxy execute(String sql, Object... args)
	{
		// Handle the cases where an array is passed containing the SQL query arguments.
		// Otherwise use the variable argument list for the SQL query.
		Object[] sqlArgs;
		if (args != null && args.length == 1 && args[0] instanceof Object[]) {
			sqlArgs = (Object[]) args[0];
		} else {
			sqlArgs = args;
		}

		if(statementLogging) {
			StringBuilder sb = new StringBuilder();
			sb.append("Executing SQL: ").append(sql).append("\n  Args: [ ");
			boolean needsComma = false;

			for(Object s : sqlArgs) {
				if (needsComma) {
					sb.append(", \"");
				} else {
					sb.append(" \"");
					needsComma = true;
				}
				sb.append(TiConvert.toString(s)).append("\"");
			}
			sb.append(" ]");
			Log.v(TAG, sb.toString(), Log.DEBUG_MODE);
		}

		TiResultSetProxy rs = null;
		Cursor c = null;
		String[] newArgs = null;
		if (sqlArgs != null) {
			newArgs = new String[sqlArgs.length];
			for(int i = 0; i < sqlArgs.length; i++) {
				newArgs[i] = TiConvert.toString(sqlArgs[i]);
			}
		}
		try {
			String lcSql = sql.toLowerCase().trim(); 
			// You must use execSQL unless you are expecting a resultset, changes aren't committed
			// if you don't. Just expecting them on select or pragma may be enough, but
			// it may need additional tuning. The better solution would be to expose
			// both types of queries through the Titanium API.
			if (lcSql.startsWith("select") || lcSql.startsWith("pragma")) {
				c = db.rawQuery(sql, newArgs);
	 			if (c != null) {
					// Most non-SELECT statements won't actually return data, but some such as
					// PRAGMA do. If there are no results, just return null.
					// Thanks to brion for working through the logic, based off of commit
					// https://github.com/brion/titanium_mobile/commit/8d3251fca69e10df6a96a2a9ae513159494d17c3
					if (c.getColumnCount() > 0) {
						rs = new TiResultSetProxy(c);
						if (rs.isValidRow()) {
							rs.next(); // Position on first row if we have data.
						}
					} else {
						c.close();
						c = null;
						rs = null;
					}
				} else {
					// Leaving for historical purposes, but walking through several different
					// types of statements never hit this branch. (create, drop, select, pragma)
					rs = new TiResultSetProxy(null); // because iPhone does it this way.
				}
			} else {
				db.execSQL(sql, newArgs);
			}
		} catch (SQLException e) {
			String msg = "Error executing sql: " + e.getMessage();
			Log.e(TAG, msg, e);
			if (c != null) {
				try {
					c.close();
				} catch (SQLException e2) {
					// Ignore
				}
			}
			throw e;
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
		if (readOnly) {
			Log.w(TAG, name + " is a read-only database, cannot remove");
			return;
		}

		if (db.isOpen()) {
			Log.w(TAG, "Attempt to remove open database. Closing then removing " + name);
			db.close();
		}
		Context ctx = TiApplication.getInstance();
		if (ctx != null) {
			ctx.deleteDatabase(name);
		} else {
			Log.w(TAG, "Unable to remove database, context has been reclaimed by GC: " + name);
		}
	}

}
