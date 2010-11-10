package org.appcelerator.kroll;

import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.mozilla.javascript.Scriptable;

// An implementation of KrollDict that is backed by a Rhino Scriptable
public class KrollScriptableDict extends KrollDict {
	protected Scriptable scriptable;
	
	public KrollScriptableDict(Scriptable scriptable) {
		this.scriptable = scriptable;
	}

	public Scriptable getScriptable() {
		return scriptable;
	}
	
	@Override
	public boolean containsKey(Object key) {
		if (key == null) return false;
		
		return scriptable.has(key.toString(), scriptable);
	}
	
	@Override
	public boolean containsValue(Object value) {
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
	public void clear() {
		for (Object key : scriptable.getIds()) {
			if (key instanceof Number) {
				scriptable.delete(((Number)key).intValue());
			} else {
				scriptable.delete(key.toString());
			}
		}
	}
	
	protected class Entry implements Map.Entry<String, Object>, Comparable<Entry> {
		protected String key;
		protected Object value;
		public Entry(String key, Object value) {
			this.key = key;
			this.value = value;
		}
		
		@Override
		public String getKey() {
			return key;
		}
		
		@Override
		public Object getValue() {
			return value;
		}
		
		@Override
		public Object setValue(Object value) {
			return put(key, value);
		}
		
		@Override
		public int compareTo(Entry other) {
			return other.key.compareTo(key);
		}
	}
	
	@Override
	public Set<Map.Entry<String, Object>> entrySet() {
		TreeSet<Map.Entry<String, Object>> entries = new TreeSet<Map.Entry<String, Object>>();
		for (Object key : scriptable.getIds()) {
			entries.add(new Entry(key.toString(), get(key)));
		}
		return entries;
	}
	
	@Override
	public Object get(Object key) {
		if (key == null) return null;
		
		KrollInvocation invocation = KrollInvocation.createPropertyGetInvocation(scriptable, scriptable, key.toString(), null, null);
		return KrollConverter.getInstance().convertJavascript(invocation, scriptable.get(key.toString(), scriptable), Object.class);
	}
	
	@Override
	public boolean isEmpty() {
		return scriptable.getIds().length == 0;
	}
	
	@Override
	public Set<String> keySet() {
		TreeSet<String> keys = new TreeSet<String>();
		for (Object key : scriptable.getIds()) {
			keys.add(key.toString());
		}
		return keys;
	}
	
	@Override
	public Object put(String key, Object value) {
		if (key == null) return null;
		
		KrollInvocation invocation = KrollInvocation.createPropertySetInvocation(scriptable, scriptable, key, null, null);
		value = KrollConverter.getInstance().convertNative(invocation, value);
		scriptable.put(key.toString(), scriptable, value);
		return value;
	}
	
	@Override
	public Object remove(Object key) {
		if (key == null) return null;
		
		Object value = get(key.toString());
		scriptable.delete(key.toString());
		return value;
	}
	
	@Override
	public int size() {
		return scriptable.getIds().length;
	}
	
	@Override
	public Collection<Object> values() {
		ArrayList<Object> values = new ArrayList<Object>();
		for (Object key : scriptable.getIds()) {
			values.add(get(key));
		}
		return values;
	}
}
