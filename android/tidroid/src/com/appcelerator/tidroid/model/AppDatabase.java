// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid.model;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

public class AppDatabase extends SQLiteOpenHelper
{
	private static final String LCAT = "TiAppDb";

	private static final String DB_NAME = "tidroid.db";
	private static final int DB_VERSION = 2;

	public AppDatabase(Context context)
	{
		super(context, DB_NAME, null, DB_VERSION);
	}

	@Override
	public void onCreate(SQLiteDatabase db)
	{
		Log.d(LCAT, "Creating Database " + DB_NAME);
		String sql =
			"create table News (" +
			"  _id INTEGER PRIMARY KEY, " +
			"  Published TEXT, " +
			"  Content TEXT " +
			");"
			;
		db.execSQL(sql);

		onUpgrade(db, 1, DB_VERSION);
	}

	@Override
	public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion)
	{
		Log.d(LCAT, "Upgrading Database from " + oldVersion + " to " + newVersion);

		int version = oldVersion;
		while(version < newVersion) {
			switch(oldVersion) {
			case 1 :
				doMigration_1(db);
				version = 2;
				break;
			}
		}
	}

	private void doMigration_1(SQLiteDatabase db)
	{
		String sql =
			"create table Apps (" +
		    "  _id INTEGER PRIMARY KEY, " +
		    "  Published TEXT, " +
		    "  AppUrl TEXT, " +
		    "  Title TEXT, " +
		    "  Guid TEXT, " +
		    "  Description TEXT, " +
		    "  Url TEXT, " +
		    "  Author TEXT, " +
		    "  Version INTEGER, " +
		    "  Downloads INTEGER, " +
		    "  Rating INTEGER, " +
		    "  Votes INTEGER, " +
		    "  ImageUrl TEXT, " +
		    "  HasVoted INTEGER " +
			");"
			;

		db.execSQL(sql);

		// Constraint is added for documentation as SQLite doesn't enforce it.
		// If it becomes an issue triggers may be used to enforce integrity
		// http://www.sqlite.org/cvstrac/wiki?p=ForeignKeyTriggers

		sql =
			"create table AppReleases (" +
			"  Apps_id INTEGER, " +
			"  Platform TEXT, " +
			"  PlatformLabel TEXT, " +
			"  Url TEXT, " +
			"  Downloads INTEGER " +
			"  CONSTRAINT fk_apps_id REFERENCES Apps(_id) ON DELETE CASCADE" +
			");"
			;

		db.execSQL(sql);
	}
}
