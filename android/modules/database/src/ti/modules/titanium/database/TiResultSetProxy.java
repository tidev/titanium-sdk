/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.database;

import java.lang.reflect.Method;
import java.util.HashMap;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.database.AbstractWindowedCursor;
import android.database.Cursor;
import android.database.SQLException;

@Kroll.proxy
public class TiResultSetProxy extends KrollProxy
{
	private static final String LCAT = "TiResultSet";
	private static final boolean DBG = TiConfig.LOGD;
	
	private static Method isFloat;
	private static Method isLong;
	private static Method isNull;
	private static Class  args[];
	static {
		isFloat = null;
		isLong  = null;
		isNull  = null;
		if (android.os.Build.VERSION.SDK_INT > 4) {
			args = new Class[1];
			args[0] = Integer.TYPE;
			
			try {
				isFloat = AbstractWindowedCursor.class.getMethod("isFloat", args);
				isLong  = AbstractWindowedCursor.class.getMethod("isLong",  args);
				isNull  = AbstractWindowedCursor.class.getMethod("isNull",  args);
			} catch (Exception e) {}
		}
	}

	protected Cursor rs;
	protected String lastException;
	protected HashMap<String, Integer> columnNames; // workaround case-sensitive matching in Google's implementation

	public TiResultSetProxy(TiContext tiContext, Cursor rs)
	{
		super(tiContext);

		this.rs = rs;
		String[] names = rs.getColumnNames();
		this.columnNames = new HashMap<String, Integer>(names.length);
		for(int i=0; i < names.length; i++) {
			columnNames.put(names[i].toLowerCase(), i);
		}
	}

	@Kroll.method
	public void close() 
	{
		if (rs != null && !rs.isClosed()) {
			if (DBG) {
				Log.d(LCAT, "Closing database cursor");
			}
			rs.close();
		} else {
			Log.w(LCAT, "Calling close on a closed cursor.");
		}

	}

	@Kroll.method
	public Object field(Object[] args) 
	{
		return internalGetField(args);
	}

	@Kroll.method
	public Object getField(Object[] args) 
	{
		return internalGetField(args);
	}

	private Object internalGetField(Object[] args) {
		int index = -1;
		int type = DatabaseModule.FIELD_TYPE_UNKNOWN;
		if (args.length >= 1) {
			if(args[0] instanceof Number) {
				index = TiConvert.toInt(args[0]);
			} else {
				(new IllegalArgumentException("Expected int column index as first parameter was " + args[0].getClass().getSimpleName())).printStackTrace();
				throw new IllegalArgumentException("Expected int column index as first parameter was " + args[0].getClass().getSimpleName());
			}
		}
		if (args.length == 2) {
			if (args[1] instanceof Number) {
				type = TiConvert.toInt(args[1]);
			} else {
				throw new IllegalArgumentException("Expected int field type as second parameter was " + args[1].getClass().getSimpleName());
			}
		}
		
		 return internalGetField(index, type);
	}

	private Object internalGetField(int index, int type)
	{
		Object result = null;
		if (rs != null) {
			try {
				boolean fromString = true;
				if (isNull != null && rs instanceof AbstractWindowedCursor) {
					AbstractWindowedCursor awc = (AbstractWindowedCursor) rs;
					Object arguments[] = new Object[] { index };
					try {
						
						if (((Boolean) isFloat.invoke(awc, arguments)).booleanValue()) {
							result = awc.getDouble(index);
							fromString = false;
						} else if (((Boolean) isLong.invoke(awc, arguments)).booleanValue()) {
							result = awc.getLong(index);
							fromString = false;
						} else if (((Boolean) isNull.invoke(awc, arguments)).booleanValue()) {
							result = null;
							fromString = false;
						}
					} catch (Exception e) {
						Log.e(LCAT, "Error querying type from cursor", e);
					}
				}

				if (fromString) {
					result = rs.getString(index);
				}
			} catch (SQLException e) {
				String msg = "No field at index " + index + ". msg=" + e.getMessage();
				Log.e(LCAT, msg, e);
				throw e;
			}
			
			switch(type) {
				case DatabaseModule.FIELD_TYPE_STRING :
					if (! (result instanceof String)) {
						result = TiConvert.toString(result);
					}
					break;
				case DatabaseModule.FIELD_TYPE_INT :
					if (! (result instanceof Integer)) {
						result = TiConvert.toInt(result);
					}
					break;
				case DatabaseModule.FIELD_TYPE_FLOAT :
					if (! (result instanceof Float)) {
						result = TiConvert.toFloat(result);
					}
					break;
				case DatabaseModule.FIELD_TYPE_DOUBLE :
					if (! (result instanceof Double)) {
						result = TiConvert.toDouble(result);
					}
					break;					
			}
		}

		return result;
	}

	@Kroll.method
	public Object fieldByName(Object[] args) 
	{
		return internalGetFieldByName(args);
	}

	@Kroll.method
	public Object getFieldByName(Object[] args) {
		return internalGetFieldByName(args);
	}
	
	private Object internalGetFieldByName(Object[] args) {
		String name = null;
		int type = DatabaseModule.FIELD_TYPE_UNKNOWN;
		if (args.length >= 1) {
			if(args[0] instanceof String) {
				name = (String) args[0];
			} else {
				throw new IllegalArgumentException("Expected string column name as first parameter" + args[0].getClass().getSimpleName());
			}
		}
		if (args.length == 2) {
			if (args[1] instanceof Number) {
				type = TiConvert.toInt(args[1]);
			} else {
				throw new IllegalArgumentException("Expected int field type as second parameter" + args[1].getClass().getSimpleName());
			}
		}
		
		return internalGetFieldByName(name, type);
	}
	
	private Object internalGetFieldByName(String fieldName, int type) 
	{
		Object result = null;
		if (rs != null) {
			try {
				Integer ndx = columnNames.get(fieldName.toLowerCase());
				if (ndx != null)
					result = internalGetField(ndx.intValue(), type);
			} catch (SQLException e) {
				String msg = "Field name " + fieldName + " not found. msg=" + e.getMessage();
				Log.e(LCAT, msg);
				throw e;
			}
		}
		
		return result;
	}
	
	@Kroll.getProperty @Kroll.method
	public int getFieldCount() 
	{
		if (rs != null) {
			try {
				return rs.getColumnCount();
			} catch (SQLException e) {
				Log.e(LCAT, "No fields");
				throw e;
			}
		}
		
		return 0;

	}
	
	@Kroll.method
	public String fieldName(int index) 
	{
		return getFieldName(index);
	}
	
	@Kroll.method
	public String getFieldName(int index) 
	{
		if (rs != null) {
			try {
				return rs.getColumnName(index);
			} catch (SQLException e) {
				Log.e(LCAT, "No column at index: " + index);
				throw e;
			}
		}
		return null;
	}

	@Kroll.getProperty @Kroll.method
	public int getRowCount() 
	{
		if (rs != null) {
			return rs.getCount();
		}
		
		return 0;
	}

	@Kroll.method
	public boolean isValidRow() 
	{
		boolean valid = false;
		if (rs != null && !rs.isClosed() && !rs.isAfterLast()) {
			valid = true;
		}
		return valid;
	}

	@Kroll.method
	public void next() 
	{
		if(isValidRow()) {
			rs.moveToNext();
		} else {
			Log.w(LCAT, "Ignoring next, row is already invalid.");
		}
	}
}
