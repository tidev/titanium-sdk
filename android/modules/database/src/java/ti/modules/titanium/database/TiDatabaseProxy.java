/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.database;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Context;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.database.sqlite.SQLiteDatabase;
import android.os.Looper;

import java.util.ArrayList;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Kroll.proxy(parentModule = DatabaseModule.class)
public class TiDatabaseProxy extends KrollProxy
{
	private static final String TAG = "TiDB";

	private static Thread thread;
	private static BlockingQueue<Runnable> queue = new LinkedBlockingQueue<>();

	protected SQLiteDatabase db;
	protected String name;

	/**
	 * Create a TiDatabaseProxy for SQLiteDatabase instance.
	 * @param name Database name.
	 * @param db SQLiteDatabase instance.
	 */
	public TiDatabaseProxy(String name, SQLiteDatabase db)
	{
		super();

		if (this.thread == null) {

			// Query execution thread.
			this.thread = new Thread(new Runnable() {
				@Override
				public void run() {
					try {

						// Query execution loop.
						while (true) {

							// Obtain query and execute.
							// NOTE: This will block until a query is available.
							queue.take().run();

							// Queue empty? Send notify event.
							if (queue.isEmpty()) {
								synchronized (queue) {
									queue.notify();
								}
							}
						}
					} catch (InterruptedException e) {
					}
				}
			});
			this.thread.start();
		}

		this.name = name;
		this.db = db;
	}

	/**
	 * Create a TiDatabaseProxy for SQLiteDatabase instance.
	 * @param db SQLiteDatabase instance.
	 */
	public TiDatabaseProxy(SQLiteDatabase db)
	{
		this(db.getPath(), db);
	}

	/**
	 * Close database.
	 */
	@Kroll.method
	public void close()
	{
		if (db.isOpen()) {
			db.close();
		}
	}

	/**
	 * Synchronously execute a single SQL query.
	 * @param query SQL query to execute on database.
	 * @param parameterObjects Parameters for `query`
	 */
	@Kroll.method
	private TiResultSetProxy execute(String query, Object... parameterObjects)
	{
		// Validate and parse parameter objects.
		if (parameterObjects != null && parameterObjects.length == 1 && parameterObjects[0] instanceof Object[]) {
			parameterObjects = (Object[]) parameterObjects[0];
		}
		for (int i = 0; i < parameterObjects.length; i++) {
			if (parameterObjects[i] instanceof TiBlob) {
				parameterObjects[i] = ((TiBlob) parameterObjects[i]).getBytes();
			} else {
				parameterObjects[i] = TiConvert.toString(parameterObjects[i]);
			}
		}

		// If this is a synchronous call on the main thread, wait for all queued queries
		// to maintain correct execution order and prevent write-locks.
		if (Looper.getMainLooper() == Looper.myLooper()) {
			try {

				// Wait until query queue is empty.
				while(!queue.isEmpty()) {
					synchronized (queue) {
						queue.wait();
					}
				}

				// Continue execution, retaining correct order.

			} catch (InterruptedException e) {
				// Ignore...
			}
		}

		// Log.d(TAG, "execute: " + query);

		TiResultSetProxy result = null;
		Cursor cursor = null;
		try {
			String lowerCaseQuery = query.toLowerCase().trim();

			// Execute query using rawQuery() in order to receive results.
			if (lowerCaseQuery.startsWith("select") || lowerCaseQuery.startsWith("insert") || lowerCaseQuery.startsWith("update")
					|| lowerCaseQuery.startsWith("delete") || (lowerCaseQuery.startsWith("pragma") && !lowerCaseQuery.contains("="))) {

				// Query parameters must be strings.
				ArrayList<String> parameters = new ArrayList<>();
				for (Object parameter : parameterObjects) {
					parameters.add(TiConvert.toString(parameter));
				}

				cursor = db.rawQuery(query, parameters.toArray(new String[0]));
				if (cursor != null) {

					// Validate and set query result.
					if (cursor.getColumnCount() > 0) {
						result = new TiResultSetProxy(cursor);
						if (result.isValidRow()) {
							result.next();
						}
					}
				}

			// Query does not return result, use execSQL()
			} else {
				db.execSQL(query, parameterObjects);
			}
		} finally {

			// Cleanup result.
			if (cursor != null) {
				try {
					cursor.close();
				} catch (Exception e) {
					// Ignore...
				}
			}
		}

		return result;
	}

	/**
	 * Asynchronously execute a single SQL query.
	 * @param callback Result callback for query execution.
	 * @param query SQL query to execute on database.
	 * @param parameters Parameters for `query`
	 */
	@Kroll.method
	public void executeAsync(final KrollFunction callback, final String query, final Object... parameters)
	{
		try {
			queue.put(new Runnable() {
				@Override
				public void run() {
					final TiResultSetProxy result = execute(query, parameters);
					callback.callAsync(getKrollObject(), new Object[] { result });
				}
			});
		} catch (InterruptedException e) {
		}
	}

	/**
	 * Synchronously execute a multiple SQL queries.
	 * @param queries SQL queries to execute on database.
	 */
	@Kroll.method
	public Object[] executeAll(final String[] queries)
	{
		ArrayList<TiResultSetProxy> results = new ArrayList<>();
		for (String query : queries) {
			final TiResultSetProxy result = execute(query);
			results.add(result);
		}
		return results.toArray();
	}

	/**
	 * Asynchronously execute a multiple SQL queries.
	 * @param callback Result callback for query execution.
	 * @param queries SQL queries to execute on database.
	 */
	@Kroll.method
	public void executeAllAsync(final KrollFunction callback, final String[] queries)
	{
		try {
			queue.put(new Runnable() {
				@Override
				public void run() {
					final Object[] results = executeAll(queries);
					callback.callAsync(getKrollObject(), new Object[] { results });
				}
			});
		} catch (InterruptedException e) {
		}
	}

	/**
	 * Get database name.
	 * @return Database name.
	 */
	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getName()
	// clang-format on
	{
		return name;
	}

	/**
	 * Get last inserted row identifier.
	 * @return Row identifier.
	 */
	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getLastInsertRowId()
	// clang-format on
	{
		return (int) DatabaseUtils.longForQuery(db, "select last_insert_rowid()", null);
	}

	/**
	 * Get number of rows affected by last query.
	 * @return Number of rows.
	 */
	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getRowsAffected()
	// clang-format on
	{
		return (int) DatabaseUtils.longForQuery(db, "select changes()", null);
	}

	/**
	 * Remove database from device. This closes and deletes the database.
	 */
	@Kroll.method
	public void remove()
	{
		// Close database.
		this.close();

		// Delete database from device.
		Context ctx = TiApplication.getInstance();
		if (ctx != null) {
			ctx.deleteDatabase(name);
			Log.w(TAG, "Removed database: '" + name + "''");
		} else {
			Log.w(TAG, "Unable to remove database: '" + name + "''");
		}
	}

	/**
	 * Get database file.
	 * @return `Ti.File` reference of SQLiteDatabase.
	 */
	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public TiFileProxy getFile()
	// clang-format on
	{
		String path = TiApplication.getInstance().getApplicationContext().getDatabasePath(this.name).getAbsolutePath();
		return new TiFileProxy(TiFileFactory.createTitaniumFile(path, false));
	}

	/**
	 * Get proxy name.
	 * @return Proxy name.
	 */
	@Override
	public String getApiName()
	{
		return "Ti.Database.DB";
	}

	/**
	 * Close and release database instance.
	 */
	@Override
	public void release() {
		this.close();
		this.db = null;
	}
}
