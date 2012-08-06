/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.analytics;

import java.util.HashMap;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class TiAnalyticsModel extends SQLiteOpenHelper{

	private static final String TAG = "TiAnalyticsDb";

	private static final String DB_NAME = "tianalytics.db";
	private static final int DB_VERSION = 4;

	public TiAnalyticsModel(Context context)
	{
		super(context, DB_NAME, null, DB_VERSION);
	}

	@Override
	public void onCreate(SQLiteDatabase db)
	{
		Log.d(TAG, "Creating Database " + DB_NAME, Log.DEBUG_MODE);
		String sql =
			"create table Events (" +
			"  _id INTEGER PRIMARY KEY, " +
			"  EventId TEXT, " +
			"  Name TEXT, " +
			"  Timestamp TEXT, " +
			"  MID TEXT, " +
			"  SID TEXT, " +
			"  isJSON INTEGER, " +
			"  Payload TEXT " +
			");"
			;
		db.execSQL(sql);

		onUpgrade(db, 1, DB_VERSION);
	}

	@Override
	public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion)
	{
		Log.i(TAG, "Upgrading Database from " + oldVersion + " to " + newVersion);

		int version = oldVersion;
		while(version < newVersion) {
			switch(version) {
			case 1 :
				doMigration_1(db);
				version = 2;
				break;
			case 2 :
				doMigration_2(db);
				version = 3;
				break;
			case 3 :
				doMigration_3(db);
				version = 4;
				break;
			default :
				throw new IllegalStateException("Missing migration path version=" + version);
			}
		}
	}

	private void doMigration_1(SQLiteDatabase db) {
		String sql = "drop table if exists Events";
		db.execSQL(sql);

		sql =
			"create table Events (" +
			"  _id INTEGER PRIMARY KEY AUTOINCREMENT, " +
			"  EventId TEXT, " +
			"  Name TEXT, " +
			"  Timestamp TEXT, " +
			"  MID TEXT, " +
			"  SID TEXT, " +
			"  AppID TEXT, " +
			"  isJSON INTEGER, " +
			"  Payload TEXT " +
			");"
			;
		db.execSQL(sql);
	}

	private void doMigration_2(SQLiteDatabase db) {
		String sql =
			"create table Props (" +
			"  _id INTEGER PRIMARY KEY, " +
			"  Name TEXT, " +
			"  Value TEXT " +
			");"
			;
		db.execSQL(sql);

		sql =
			"insert into Props(Name, Value) values ('Enrolled', '0')"
			;
		db.execSQL(sql);
	}

	private void doMigration_3(SQLiteDatabase db)
	{
		// We're still in working toward 1.0 of analytics, drop unsent data
		String sql =
			"drop table if exists Events"
			;
		db.execSQL(sql);

		sql =
			"create table Events (" +
			"  _id INTEGER PRIMARY KEY AUTOINCREMENT, " +
			"  EventId TEXT, " +
			"  Type TEXT, " +
			"  Event TEXT, " +
			"  Timestamp TEXT, " +
			"  MID TEXT, " +
			"  SID TEXT, " +
			"  AppGUID TEXT, " +
			"  isJSON INTEGER, " +
			"  Payload TEXT " +
			");"
			;
		db.execSQL(sql);
	}

	public void addEvent(final TiAnalyticsEvent event)
	{
		SQLiteDatabase db = null;
		try {
			db = getWritableDatabase();
			String sql =
				"insert into Events(EventId, Type, Event, Timestamp, MID, SID, AppGUID, isJSON, Payload) values(?,?,?,?,?,?,?,?,?)"
				;
			Object[] args = {
				TiPlatformHelper.createEventId(),
				event.getEventType(),
				event.getEventEvent(),
				event.getEventTimestamp(),
				event.getEventMid(),
				event.getEventSid(),
				event.getEventAppGuid(),
				event.mustExpandPayload() ? 1 : 0,
				event.getEventPayload()
			};
			db.execSQL(sql, args);
		} catch (SQLException e) {
			Log.e(TAG, "Error adding event: " + e);
		} finally {
			if (db != null) {
				db.close();
			}
		}
	}

	public void deleteEvents(int records[])
	{
		if (records.length > 0) {
			SQLiteDatabase db = null;
			try {
				db = getWritableDatabase();
				StringBuilder sb = new StringBuilder(256);
				sb.append("delete from Events where _id in (");
				for (int i = 0; i < records.length; i++) {
					if (i > 0) {
						sb.append(",");
					}
					sb.append(records[i]);
				}
				sb.append(")");
				db.execSQL(sb.toString());
			} catch (SQLException e) {
				Log.e(TAG, "Error deleting events :" + e);
			} finally {
				if (db != null) {
					db.close();
				}
			}
		}
	}

	public boolean hasEvents() {
		boolean result = false;

		SQLiteDatabase db = null;
		Cursor c = null;
		try {
			db = getReadableDatabase();

			String sql =
				"select exists(select _id from Events)"
				;

			c = db.rawQuery(sql, null);

			if(c.moveToNext()) {
				result = c.getInt(0) != 0;
			}
		} catch (SQLException e) {
			Log.e(TAG, "Error determining if there are events to send: ", e);
		} finally {
			if (c != null) {
				c.close();
			}
			if (db != null) {
				db.close();
			}
		}

		return result;
	}

	public HashMap<Integer,JSONObject> getEventsAsJSON(int limit) {
		HashMap<Integer, JSONObject> result = new HashMap<Integer,JSONObject>(limit);

		SQLiteDatabase db = null;
		Cursor c = null;
		try {
			db = getReadableDatabase();

			String sql =
				"select _id, EventId, Type, Event, Timestamp, MID, SID, AppGUID, isJSON, Payload from Events " +
				" order by 1 limit " +
				limit
				;

			c = db.rawQuery(sql, null);

			while(c.moveToNext()) {
				int seq = c.getInt(0);
				JSONObject json = new JSONObject();
				json.put("seq", seq);
				json.put("ver", "2");
				json.put("id", c.getString(1));
				json.put("type", c.getString(2));
				json.put("event", c.getString(3));
				json.put("ts", c.getString(4));
				json.put("mid", c.getString(5));
				json.put("sid", c.getString(6));
				json.put("aguid", c.getString(7));
				boolean isJSON = c.getInt(8) == 1 ? true : false;
				if (isJSON) {
					json.put("data", new JSONObject(c.getString(9)));
				} else {
					json.put("data", c.getString(9));
				}

				result.put(seq, json);
			}
		} catch (JSONException e) {
			Log.e(TAG, "Error creating JSON.", e);
		} catch (SQLException e) {
			Log.e(TAG, "Error retrieving events to send as JSON: ", e);
		} finally {
			if (c != null) {
				c.close();
			}
			if (db != null) {
				db.close();
			}
		}

		return result;
	}

	public boolean needsEnrollEvent() {
		boolean result = false;

		SQLiteDatabase db = null;
		Cursor c = null;
		try {
			db = getReadableDatabase();

			String sql =
				"select Value from Props where Name = 'Enrolled'"
				;

			c = db.rawQuery(sql, null);

			if(c.moveToNext()) {
				result = c.getInt(0) == 0;
			}
		} catch (SQLException e) {
			Log.e(TAG, "Error retrieving events to send as JSON: ", e);
		} finally {
			if (c != null) {
				c.close();
			}
			if (db != null) {
				db.close();
			}
		}

		return result;
	}

	public void markEnrolled() {
		String sql =
			"update Props set Value = '1' where Name = 'Enrolled'"
			;

		SQLiteDatabase db = null;
		try {
			db = getWritableDatabase();
			db.execSQL(sql);
		} catch (SQLException e) {
			Log.e(TAG, "Error marking enrolled :" + e);
		} finally {
			if (db != null) {
				db.close();
			}
		}
	}
}
