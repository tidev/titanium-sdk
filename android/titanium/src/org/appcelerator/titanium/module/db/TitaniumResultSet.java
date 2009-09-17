/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.db;

import java.util.HashMap;

import org.appcelerator.titanium.api.ITitaniumResultSet;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;

import android.database.Cursor;

public class TitaniumResultSet implements ITitaniumResultSet
{
	private static final String LCAT = "TiResultSet";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected Cursor rs;
	protected String lastException;
	protected HashMap<String, Integer> columnNames; // workaround case-sensitive matching in Google's implementation

	public TitaniumResultSet(Cursor rs) {
		this.rs = rs;
		String[] names = rs.getColumnNames();
		this.columnNames = new HashMap<String, Integer>(names.length);
		for(int i=0; i < names.length; i++) {
			columnNames.put(names[i].toLowerCase(), i);
		}
	}

	public void close() {
		if (!rs.isClosed()) {
			if (DBG) {
				Log.d(LCAT, "Closing database cursor");
			}
			rs.close();
		} else {
			Log.w(LCAT, "Calling close on a closed cursor.");
		}

	}

	public String getField(int index) {
		String result = null;
		try {
			result = rs.getString(index);
		} catch (IllegalStateException e) {
			String msg = "Invalid access field " + index + ". msg=" + e.getMessage();
			Log.e(LCAT, msg, e);
			setException(msg);
		}

		return result;
	}

	public String getFieldByName(String fieldName) {
		int index = -1;
		String result = null;
		try {
			Integer ndx = columnNames.get(fieldName.toLowerCase());
			if (ndx == null) {
				throw new IllegalArgumentException("column not found");
			}
			index = ndx;
			result = rs.getString(index);
		} catch (IllegalArgumentException e) {
			String msg = "Field name " + fieldName + " not found. msg=" + e.getMessage();
			Log.e(LCAT, msg);
			setException(msg);
		}
		return result;
	}

	public int getFieldCount() {
		return rs.getColumnCount();
	}

	public String getFieldName(int index) {
		return rs.getColumnName(index);
	}

	public int getRowCount() {
		return rs.getCount();
	}

	public boolean isValidRow() {
		boolean valid = false;
		if (rs != null && !rs.isClosed() && !rs.isAfterLast()) {
			valid = true;
		}
		return valid;
	}

	public void next() {
		if(isValidRow()) {
			rs.moveToNext();
		} else {
			Log.w(LCAT, "Ignoring next, row is already invalid.");
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
}
