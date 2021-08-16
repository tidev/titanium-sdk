/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.TiC;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

/**
 * An extension of HashMap, used to access and store data.
 */
public class KrollDict extends HashMap<String, Object>
{
	private static final String TAG = "KrollDict";
	private static final long serialVersionUID = 1L;
	private static final int INITIAL_SIZE = 5;

	/**
	 * Constructs a KrollDict with a default capacity.
	 */
	public KrollDict()
	{
		this(INITIAL_SIZE);
	}

	public KrollDict(JSONObject object) throws JSONException
	{
		for (Iterator<String> iter = object.keys(); iter.hasNext();) {
			String key = iter.next();
			Object value = object.get(key);
			Object json = fromJSON(value);
			put(key, json);
		}
	}

	public static Object fromJSON(Object value)
	{
		try {
			if (value instanceof JSONObject) {
				return new KrollDict((JSONObject) value);

			} else if (value instanceof JSONArray) {
				JSONArray array = (JSONArray) value;
				Object[] values = new Object[array.length()];
				for (int i = 0; i < array.length(); i++) {
					values[i] = fromJSON(array.get(i));
				}
				return values;

			} else if (value == JSONObject.NULL) {
				return null;
			}
		} catch (JSONException e) {
			Log.e(TAG, "Error parsing JSON", e);
		}

		return value;
	}

	/**
	 * Constructs a KrollDict by copying an existing Map
	 * @param map the existing map to copy
	 */
	public KrollDict(Map<? extends String, ? extends Object> map)
	{
		super(map);
	}

	/**
	 * Constructs a KrollDict with the specified capacity.
	 * @param size the specified capacity.
	 */
	public KrollDict(int size)
	{
		super(size);
	}

	public void putCodeAndMessage(int code, String message)
	{
		this.put(TiC.PROPERTY_SUCCESS, Boolean.valueOf(code == 0));
		this.put(TiC.PROPERTY_CODE, Integer.valueOf(code));
		if (message != null) {
			this.put(TiC.EVENT_PROPERTY_ERROR, message);
		}
	}

	public boolean containsKeyAndNotNull(String key)
	{
		return containsKey(key) && get(key) != null;
	}

	public boolean containsKeyStartingWith(String keyStartsWith)
	{
		if (keySet() != null) {
			for (String key : keySet()) {
				if (key.startsWith(keyStartsWith)) {
					return true;
				}
			}
		}
		return false;
	}

	public boolean getBoolean(String key)
	{
		return TiConvert.toBoolean(get(key));
	}

	public boolean optBoolean(String key, boolean defaultValue)
	{
		boolean result = defaultValue;

		if (containsKey(key)) {
			try {
				result = getBoolean(key);
			} catch (Exception e) {
			}
		}
		return result;
	}

	public String getString(String key)
	{
		return TiConvert.toString(get(key));
	}

	public String optString(String key, String defaultString)
	{
		String result = defaultString;
		if (containsKey(key)) {
			try {
				result = getString(key);
			} catch (Exception e) {
			}
		}
		return result;
	}

	public Integer getInt(String key)
	{
		return TiConvert.toInt(get(key));
	}

	public Integer optInt(String key, Integer defaultValue)
	{
		Integer result = defaultValue;

		if (containsKey(key)) {
			try {
				result = getInt(key);
			} catch (Exception e) {
			}
		}
		return result;
	}

	public Double getDouble(String key)
	{
		return TiConvert.toDouble(get(key));
	}

	public String[] getStringArray(String key)
	{
		return TiConvert.toStringArray((Object[]) get(key));
	}

	public int[] getIntArray(String key)
	{
		return TiConvert.toIntArray((Object[]) get(key));
	}

	@SuppressWarnings("unchecked")
	public KrollDict getKrollDict(String key)
	{
		Object value = get(key);
		if (value instanceof KrollDict) {
			return (KrollDict) value;
		} else if (value instanceof HashMap) {
			return new KrollDict((HashMap<String, Object>) value);
		} else {
			return null;
		}
	}

	public KrollDict[] getKrollDictArray(String key)
	{
		String[] value = getStringArray(key);
		KrollDict[] result = new KrollDict[value.length];
		int index = 0;
		for (String record : value) {
			KrollDict dictionary = null;
			try {
				dictionary = new KrollDict(new JSONObject(record));
			} catch (JSONException e) {
				e.printStackTrace();
				Log.w(TAG, "Unable to parse dictionary.");
			}
			result[index++] = dictionary;
		}
		return result;
	}

	public boolean isNull(String key)
	{
		return (get(key) == null);
	}

	@Override
	public String toString()
	{
		return new JSONObject(this).toString();
	}
}
