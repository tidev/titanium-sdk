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
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

/**
 * An extension of HashMap, used to access and store data.
 */
public class KrollDict
	extends HashMap<String, Object>
{
	private static final String TAG = "KrollDict";
	private static final long serialVersionUID = 1L;
	private static final int INITIAL_SIZE = 5;

	/**
	 * Constructs a KrollDict with a default capacity.
	 * @module.api
	 */
	public KrollDict() {
		this(INITIAL_SIZE);
	}

	@SuppressWarnings("unchecked")
	public KrollDict(JSONObject object) throws JSONException {
		for (Iterator<String> iter = object.keys(); iter.hasNext();) {
			String key = iter.next();
			Object value = object.get(key);			
			Object json = fromJSON(value);
			put(key, json);
		}
	}
	
	public static Object fromJSON(Object value) {
		try {
			if (value instanceof JSONObject) {
				return new KrollDict((JSONObject)value);

			} else if (value instanceof JSONArray) {
				JSONArray array = (JSONArray)value;
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
	 * @module.api
	 */
	public KrollDict(Map<? extends String, ? extends Object> map) {
		super(map);
	}

	/**
	 * Constructs a KrollDict with the specified capacity.
	 * @param size the specified capacity.
	 * @module.api
	 */
	public KrollDict(int size) {
		super(size);
	}

	public boolean containsKeyAndNotNull(String key) {
		return containsKey(key) && get(key) != null;
	}

	public boolean containsKeyStartingWith(String keyStartsWith) {
		if (keySet() != null) { 
			for (String key : keySet()) {
				if (key.startsWith(keyStartsWith)) {
					return true;
				}
			}
		}
		return false;
	}
	
	public boolean getBoolean(String key) {
		return TiConvert.toBoolean(get(key));
	}

	public boolean optBoolean(String key, boolean defaultValue) {
		boolean result = defaultValue;

		if (containsKey(key)) {
			result = getBoolean(key);
		}
		return result;
	}

	public String getString(String key) {
		return TiConvert.toString(get(key));
	}

	public String optString(String key, String defalt) {
		if (containsKey(key)) {
			return getString(key);
		}
		return defalt;
	}

	public Integer getInt(String key) {
		return TiConvert.toInt(get(key));
	}

	public Integer optInt(String key, Integer defaultValue) {
		Integer result = defaultValue;

		if (containsKey(key)) {
			result = getInt(key);
		}
		return result;
	}

	public Double getDouble(String key) {
		return TiConvert.toDouble(get(key));
	}

	public String[] getStringArray(String key) {
		return TiConvert.toStringArray((Object[])get(key));
	}

	public KrollDict getKrollDict(String key) {
		Object value = get(key);
		if (value instanceof KrollDict) {
			return (KrollDict) value;
		} else if (value instanceof HashMap) {
			return new KrollDict((HashMap)value);
		} else {
			return null;
		}
	}

	public boolean isNull(String key) {
		return (get(key) == null);
	}
	
	@Override
	public String toString() {
		return new JSONObject(this).toString();
	}
}
