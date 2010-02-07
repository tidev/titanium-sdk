/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.util.TiConvert;


public class TiDict
	extends HashMap<String, Object>
{
	private static final long serialVersionUID = 1L;
	private static final int INITIAL_SIZE = 5;

	public TiDict() {
		this(INITIAL_SIZE);
	}

	public TiDict(Map<? extends String, ? extends Object> map) {
		super(map);
	}

	public TiDict(int size) {
		super(size);
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
		return (String) get(key);
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

	public Double getDouble(String key) {
		return TiConvert.toDouble(get(key));
	}

	public String[] getStringArray(String key) {
		return TiConvert.toStringArray((Object[])get(key));
	}

	public TiDict getTiDict(String key) {
		return (TiDict) get(key);
	}

	public boolean isNull(String key) {
		return (get(key) == null);
	}
}
