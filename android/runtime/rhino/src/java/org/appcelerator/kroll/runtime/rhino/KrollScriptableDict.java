/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010, 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.mozilla.javascript.Scriptable;

/**
 *  An implementation of HashMap backed by a Rhino Scriptable
 */
@SuppressWarnings("serial")
public class KrollScriptableDict extends HashMap<String, Object>
{
	protected Scriptable scriptable;

	public KrollScriptableDict(Scriptable scriptable)
	{
		this.scriptable = scriptable;
	}

	public Scriptable getScriptable()
	{
		return scriptable;
	}

	@Override
	public boolean containsKey(Object key)
	{
		if (key == null) return false;
		if (key instanceof Integer) {
			return scriptable.has((Integer)key, scriptable);
		}
		if (!scriptable.has(key.toString(), scriptable)) {
			try {
				Integer i = Integer.valueOf(key.toString());
				return scriptable.has(i, scriptable);
			} catch (NumberFormatException e) {}
			return false;
		}
		return true;
	}

	@Override
	public boolean containsValue(Object value)
	{
		for (Object key : scriptable.getIds()) {
			Object v = get(key);
			if (v != null && v.equals(value)) {
				return true;
			} else if (v == null && value == null) {
				return true;
			}
		}
		return false;
	}

	@Override
	public void clear()
	{
		for (Object key : scriptable.getIds()) {
			if (key instanceof Number) {
				scriptable.delete(((Number)key).intValue());
			} else {
				scriptable.delete(key.toString());
			}
		}
	}

	protected class Entry implements Map.Entry<String, Object>, Comparable<Entry>
	{
		protected String key;
		protected Object value;
		public Entry(String key, Object value) {
			this.key = key;
			this.value = value;
		}

		@Override
		public String getKey()
		{
			return key;
		}

		@Override
		public Object getValue()
		{
			return value;
		}

		@Override
		public Object setValue(Object value)
		{
			return put(key, value);
		}

		@Override
		public int compareTo(Entry other)
		{
			return other.key.compareTo(key);
		}
	}

	@Override
	public Set<Map.Entry<String, Object>> entrySet()
	{
		TreeSet<Map.Entry<String, Object>> entries = new TreeSet<Map.Entry<String, Object>>();
		for (Object key : scriptable.getIds()) {
			entries.add(new Entry(key.toString(), get(key)));
		}
		return entries;
	}

	@Override
	public Object get(Object key)
	{
		if (key == null) {
			return null;
		}

		// Treat NOT_FOUND as null
		Object value = scriptable.get(key.toString(), scriptable);
		if (value == Scriptable.NOT_FOUND) {
			try {
				Integer i = Integer.valueOf(key.toString());
				value = scriptable.get(i, scriptable);
			} catch (NumberFormatException e) {}
			if (value == Scriptable.NOT_FOUND) {
				return null;
			}
		}
		
		return TypeConverter.jsObjectToJavaObject(value, scriptable);
	}

	@Override
	public boolean isEmpty()
	{
		return scriptable.getIds().length == 0;
	}

	@Override
	public Set<String> keySet()
	{
		TreeSet<String> keys = new TreeSet<String>();
		for (Object key : scriptable.getIds()) {
			keys.add(key.toString());
		}
		return keys;
	}

	@Override
	public Object put(String key, Object value)
	{
		if (key == null) {
			return null;
		}

		value = TypeConverter.javaObjectToJsObject(value, scriptable);
		scriptable.put(key.toString(), scriptable, value);
		return value;
	}

	@Override
	public Object remove(Object key)
	{
		if (key == null) {
			return null;
		}

		Object value = get(key.toString());
		scriptable.delete(key.toString());
		return value;
	}

	@Override
	public int size()
	{
		return scriptable.getIds().length;
	}

	@Override
	public Collection<Object> values()
	{
		ArrayList<Object> values = new ArrayList<Object>();
		for (Object key : scriptable.getIds()) {
			values.add(get(key));
		}
		return values;
	}
}
