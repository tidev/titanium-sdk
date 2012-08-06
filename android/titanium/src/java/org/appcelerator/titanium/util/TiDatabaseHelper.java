/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.kroll.common.Log;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteDoneException;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteStatement;


public class TiDatabaseHelper extends SQLiteOpenHelper
{
	private static final String TAG = "TiDbHelper";

	private static final String name = "Titanium";
	private static final int version = 1;

	public TiDatabaseHelper(Context context)
	{
		super(context,name,null,version);
	}
	public void setPlatformParam (String key, String value)
	{
		String platformSQL = "insert into platform values (?,?)";
		SQLiteDatabase db = getWritableDatabase();
		try
		{
			SQLiteStatement platformInsertStatement = db.compileStatement(platformSQL);
			platformInsertStatement.bindString(1,key);
			platformInsertStatement.bindString(2,value);
			platformInsertStatement.executeInsert();
			platformInsertStatement.close();
		}
		finally
		{
			db.close();
		}
	}
	public void updatePlatformParam (String key, String value)
	{
		deletePlatformParam(key);
		setPlatformParam(key, value);
	}
	public void deletePlatformParam (String key)
	{
		String platformSQL = "delete from platform where name = ?";
		SQLiteDatabase db = getWritableDatabase();
		try
		{
			SQLiteStatement platformInsertStatement = db.compileStatement(platformSQL);
			platformInsertStatement.bindString(1,key);
			platformInsertStatement.executeInsert();
			platformInsertStatement.close();
		}
		finally
		{
			db.close();
		}
	}
	public String getPlatformParam (String key, String def)
	{
		String platformSQL = "select value from platform where name = ?";
		SQLiteDatabase db = getReadableDatabase();
		try
		{
			SQLiteStatement platformSelectStatement = db.compileStatement(platformSQL);
			platformSelectStatement.bindString(1,key);
			String result = platformSelectStatement.simpleQueryForString();
			platformSelectStatement.close();
			if (result == null)
			{
				return def;
			}
			return result;
		}
		catch (SQLiteDoneException e) 
		{
			// This is not an error, so fallthrough and let it return the default.
			Log.i(TAG, "No value in database for platform key: '" + key + "' returning supplied default '" + def + "'");
		}
		catch (Exception e)
		{
			Log.e(TAG, "Problem retrieving data from platform: ", e);
		}
		finally
		{
			db.close();
		}
		return def;
	}
	public void onCreate(SQLiteDatabase db)
	{
		String platformSQL = "create table platform(name TEXT,value TEXT)";
		db.execSQL(platformSQL);
	}
	public void onOpen(SQLiteDatabase db)
	{
	}
	public void onUpgrade(SQLiteDatabase db,int from,int to)
	{
	}
}