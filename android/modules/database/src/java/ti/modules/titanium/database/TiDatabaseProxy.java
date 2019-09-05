/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.database;

import org.appcelerator.kroll.JSError;
import org.appcelerator.kroll.KrollDict;
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

import java.lang.Exception;
import java.security.InvalidParameterException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Kroll.proxy(parentModule = DatabaseModule.class)
public class TiDatabaseProxy extends KrollProxy
{
	private static final String TAG = "TiDB";

	private Thread thread;
	private Lock dbLock = new ReentrantLock(true); // use a "fair" lock
	private BlockingQueue<Runnable> queue = new LinkedBlockingQueue<>();
	private AtomicBoolean executingQueue = new AtomicBoolean(false);
	private boolean isClosed = false;

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
				public void run()
				{
					try {

						// Query execution loop.
						while (true) {

							// Obtain query and execute.
							// NOTE: This will block until a query is available.
							queue.take().run();

							// Queue empty? Send notify event.
							if (queue.isEmpty()) {
								synchronized (executingQueue)
								{
									executingQueue.set(false);
									executingQueue.notify();
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
	 * Wait for query queue when executing on main thread.
	 */
	private void waitForQueue()
	{
		// Wait for all queued queries.
		if (Looper.getMainLooper() == Looper.myLooper()) {
			try {

				// Wait until query queue is empty.
				synchronized (executingQueue)
				{
					while (executingQueue.get()) {
						executingQueue.wait();
					}
				}

				// Continue...

			} catch (InterruptedException e) {
				// Ignore...
			}
		}
	}

	/**
	 * Close database.
	 */
	@Kroll.method
	public void close()
	{
		dbLock.lock();
		try {
			// Close database.
			if (db != null && db.isOpen()) {
				db.close();
			}
			db = null;
			isClosed = true;
		} finally {
			dbLock.unlock();
		}

		// Abort query queue execution.
		if (thread != null) {
			thread.interrupt();
			thread = null;
		}
		executingQueue.set(false);
		queue.clear();
	}

	private boolean expectResult(String query)
	{
		String lowerCaseQuery = query.toLowerCase().trim();
		return lowerCaseQuery.startsWith("select")
			|| (lowerCaseQuery.startsWith("pragma") && !lowerCaseQuery.contains("="));
	}

	/**
	 * Synchronously execute a single SQL query.
	 * @param query SQL query to execute on database.
	 * @param parameterObjects Parameters for `query`
	 */
	private TiResultSetProxy executeSQL(String query, Object[] parameterObjects) throws InterruptedException
	{
		// Validate and parse `parameterObjects`.
		if (parameterObjects != null) {
			// Validate query parameters, must be either String or Blob.
			for (int i = 0; i < parameterObjects.length; i++) {
				if (parameterObjects[i] instanceof TiBlob) {
					parameterObjects[i] = ((TiBlob) parameterObjects[i]).getBytes();
				} else {
					parameterObjects[i] = TiConvert.toString(parameterObjects[i]);
				}
			}
		} else {
			parameterObjects = new Object[0];
		}

		// If this is a synchronous call on the main thread, wait for all queued queries
		// to maintain correct execution order and prevent write-locks.
		waitForQueue();

		// lock on db proxy instance
		dbLock.lockInterruptibly();
		try {
			if (isClosed) {
				throw new IllegalStateException("database is closed");
			}

			if (!expectResult(query)) {
				db.execSQL(query, parameterObjects);
				return null;
			}

			// Query parameters must be strings.
			String parameters[] = new String[parameterObjects.length];
			if (parameterObjects.length > 0) {
				for (int i = 0; i < parameterObjects.length; i++) {
					parameters[i] = TiConvert.toString(parameterObjects[i]);
				}
			}

			// Execute query using rawQuery() in order to receive results.
			Cursor cursor = db.rawQuery(query, parameters);
			if (cursor != null) {
				// Validate and set query result.
				if (cursor.getColumnCount() > 0) {
					TiResultSetProxy result = new TiResultSetProxy(cursor);
					if (result.isValidRow()) {
						result.next();
					}
					return result;
				}

				// Cleanup result.
				try {
					cursor.close();
				} catch (Exception e) {
					// Ignore...
				}
			}

			return null;
		} finally {
			dbLock.unlock();
		}
	}

	/**
	 * Synchronously execute a single SQL query.
	 * @param query SQL query to execute on database.
	 * @param parameterObjects Parameters for `query`
	 */
	@Kroll.method
	public TiResultSetProxy execute(String query, Object... parameterObjects) throws InterruptedException
	{
		// Validate `query` parameter.
		if (query == null) {
			throw new InvalidParameterException("'query' parameter is required");
		}

		// Support either varargs or a single array as params
		if (parameterObjects != null) {
			// Only an array is defined, use that for parameters
			if (parameterObjects.length == 1 && parameterObjects[0] instanceof Object[]) {
				parameterObjects = (Object[]) parameterObjects[0];
			}
		}
		return executeSQL(query, parameterObjects);
	}

	/**
	 * Asynchronously execute a single SQL query.
	 * @param query SQL query to execute on database.
	 * @param parameterObjects Parameters for `query`
	 * @param callback Result callback for query execution.
	 */
	@Kroll.method
	public void executeAsync(final String query, final Object... parameterObjects)
	{
		// Validate `query` and `callback` parameters.
		if (query == null || parameterObjects == null || parameterObjects.length == 0) {
			throw new InvalidParameterException("'query' and 'callback' parameters are required");
		}

		// Last parameter MUST be the callback function.
		final Object lastParameter = parameterObjects[parameterObjects.length - 1];
		if (!(lastParameter instanceof KrollFunction)) {
			throw new InvalidParameterException("'callback' is not a valid function");
		}
		final KrollFunction callback = (KrollFunction) lastParameter;

		// Reconstruct parameters array without `callback` element.
		final Object parameters[] = new Object[parameterObjects.length - 1];
		System.arraycopy(parameterObjects, 0, parameters, 0, parameterObjects.length - 1);

		executingQueue.set(true);
		try {
			queue.put(new Runnable() {
				@Override
				public void run()
				{
					Object[] args = null;
					try {
						final TiResultSetProxy result = executeSQL(query, parameters);
						args = new Object[] { null, result };
					} catch (Throwable t) {
						args = new Object[] { t };
					}
					callback.callAsync(getKrollObject(), args);
				}
			});
		} catch (InterruptedException e) {
			// Ignore...
		}
	}

	/**
	 * Synchronously execute a multiple SQL queries.
	 * @param queries SQL queries to execute on database.
	 */
	@Kroll.method
	public Object[] executeAll(final String[] queries) throws BatchQueryException
	{
		// Validate `queries` parameter.
		if (queries == null || queries.length == 0) {
			throw new InvalidParameterException("'query' parameter is required");
		}

		List<TiResultSetProxy> results = new ArrayList<>(queries.length);
		for (int index = 0; index < queries.length; index++) {
			try {
				final TiResultSetProxy result = executeSQL(queries[index], null);
				results.add(result);
			} catch (Throwable t) {
				throw new BatchQueryException(t, index, results);
			}
		}
		return results.toArray();
	}

	/**
	 * Asynchronously execute a multiple SQL queries.
	 * @param queries SQL queries to execute on database.
	 * @param callback Result callback for query execution.
	 */
	@Kroll.method
	public void executeAllAsync(final String[] queries, final KrollFunction callback)
	{
		// Validate `queries` and `callback` parameters.
		if (queries == null || queries.length == 0 || callback == null) {
			throw new InvalidParameterException("'query' and 'callback' parameters are required");
		}

		executingQueue.set(true);
		try {
			queue.put(new Runnable() {
				@Override
				public void run()
				{
					Throwable error = null;
					List<TiResultSetProxy> results = new ArrayList<>(queries.length);
					for (int index = 0; index < queries.length; index++) {
						try {
							final TiResultSetProxy result = executeSQL(queries[index], null);
							results.add(result);
						} catch (Throwable t) {
							error = new BatchQueryException(t, index, null);
							break;
						}
					}
					callback.callAsync(getKrollObject(), new Object[] { error, results.toArray() });
				}
			});
		} catch (InterruptedException e) {
			// Ignore...
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
		// lock on db proxy instance
		dbLock.lock();
		try {
			if (isClosed) {
				throw new IllegalStateException("database is closed");
			}
			return (int) DatabaseUtils.longForQuery(db, "select last_insert_rowid()", null);
		} finally {
			dbLock.unlock();
		}
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
		// lock on db proxy instance
		dbLock.lock();
		try {
			if (isClosed) {
				throw new IllegalStateException("database is closed");
			}
			return (int) DatabaseUtils.longForQuery(db, "select changes()", null);
		} finally {
			dbLock.unlock();
		}
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
		} else {
			Log.w(TAG, "Unable to remove database, context has been reclaimed by GC: " + name);
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
	public void release()
	{
		this.close();
		super.release();
	}

	private static class BatchQueryException extends Exception implements JSError
	{
		private final int index;
		private final List<TiResultSetProxy> partialResults;

		BatchQueryException(Throwable t, int index, List<TiResultSetProxy> partialResults)
		{
			super(t);
			this.index = index;
			this.partialResults = partialResults;
		}

		public HashMap getJSProperties()
		{
			HashMap map = new HashMap();
			map.put("index", index);
			if (partialResults != null) {
				map.put("results", partialResults.toArray());
			}
			return map;
		}
	}
}
