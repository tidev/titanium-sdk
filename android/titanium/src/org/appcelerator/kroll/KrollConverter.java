/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.reflect.Array;
import java.util.Date;
import java.util.Iterator;
import java.util.Map;

import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public class KrollConverter implements KrollNativeConverter,
	KrollJavascriptConverter, KrollDefaultValueProvider {
	
	private static final String TAG = "KrollConverter";
	private static final boolean DBG = TiConfig.DEBUG;
	
	public static final String DEFAULT_NAME = "__default_name__";
	protected static KrollConverter _instance = new KrollConverter();
	
	public static KrollConverter getInstance() {
		return _instance;
	}
	
	public Object convertJSONObject(KrollInvocation invocation, JSONObject json) {
		if (json == JSONObject.NULL)
		{
			return Context.javaToJS(null, invocation.getScope());
		}
		KrollDict map = new KrollDict();
		Iterator<?> iter = json.keys();
		while (iter.hasNext())
		{
			String name = (String)iter.next();
			try
			{
				Object entry = convertNative(invocation, json.get(name));
				map.put(name,entry);
			}
			catch(JSONException ig)
			{
				ig.printStackTrace();
			}
		}
		return convertNative(invocation, map);
	}
	
	public Object convertJSONArray(KrollInvocation invocation, JSONArray array) {
		Object result[] = new Object[array.length()];
		for (int i = 0; i < array.length(); i++) 
		{
			try
			{
				Object r = array.get(i);
				result[i] = convertNative(invocation, r);
			}
			catch(JSONException ig)
			{
				ig.printStackTrace();
			}
		}
		return Context.getCurrentContext().newArray(invocation.getScope(), result);
	}
	
	@SuppressWarnings("serial")
	public class ScriptableMap extends ScriptableObject {
		public ScriptableMap(KrollInvocation invocation, Map<String, Object> map) {
			super(invocation.getScope(), ScriptableObject.getObjectPrototype(invocation.getScope()));
			for (String key: map.keySet()) {
				put(key, this, convertNative(invocation, map.get(key)));
			}
		}
		
		@Override
		public String getClassName() {
			return "Object";
		}

		public String toString()
		{
			StringBuilder sb = new StringBuilder();
			sb.append("{ ");

			Object[] ids = (Object[]) getIds();
			String sep = "";
			if (ids == null) ids = new Object[0];
			
			for(Object id : ids) {
				sb.append(" '").append(id).append("' : ");
				Object o = get(id.toString(), this);
				if (o == null) {
					sb.append("null");
				} else if (o instanceof String) {
					sb.append(" '").append((String)o).append("' ");
				} else if (o instanceof Number) {
					sb.append(o);
				} else if (o instanceof ScriptableObject) {
					sb.append(o);
				} else {
					sb.append(o);
				}

				sb.append(sep);
				sep = ",";
			}

			sb.append(" }");
			return sb.toString();
		}
	}
	
	@SuppressWarnings("unchecked")
	public Object convertNative(KrollInvocation invocation, Object value) {
		if (value instanceof KrollProxy) {
			return new KrollObject((KrollProxy)value);
		}
		else if (value == null || value instanceof String ||
				value instanceof Number ||
				value instanceof Boolean ||
				value instanceof Scriptable || value instanceof Function)
		{
			return Context.javaToJS(value, invocation.getScope());
		}
		else if (value instanceof JSONArray) {
			return convertJSONArray(invocation, (JSONArray)value);
		} 
		else if (value instanceof JSONObject)
		{
			return convertJSONObject(invocation, (JSONObject)value);
		}
		else if (value instanceof Map) {
			// catches Map + KrollDict
			return new ScriptableMap(invocation, (Map<String,Object>)value);
		}
		else if (value instanceof Date) {
			Date date = (Date) value;
			return Context.getCurrentContext().newObject(invocation.getScope(), "Date", new Object[] { date.getTime() });
		}
		else if (value.getClass().isArray()) {
			int length = Array.getLength(value);
			Object[] jsArray = new Object[length];
			for (int i = 0; i < length; i++) {
				jsArray[i] = convertNative(invocation, Array.get(value, i));
			}

			return Context.getCurrentContext().newArray(invocation.getScope(), jsArray);
		}
		else if (value == JSONObject.NULL || value.getClass().equals(JSONObject.NULL.getClass()))
		{
			return Context.javaToJS(null, invocation.getScope());
		}
		else if (value instanceof KrollCallback) {
			return ((KrollCallback)value).toJSFunction();
		}
		else if (value == KrollProxy.UNDEFINED) {
			return Context.getUndefinedValue();
		}
		else {
			return value;
		}
	}
	
	public boolean isArrayLike(Scriptable scriptable) {
		// some objects have length() methods, so just check the value?
		return scriptable.has("length", scriptable) &&
			scriptable.get("length", scriptable) instanceof Number &&
			!(scriptable instanceof KrollObject) &&
			!(scriptable instanceof Function);
	}

	public Object[] toArray(KrollInvocation invocation, Scriptable scriptable)
	{
		int len = (Integer) Context.jsToJava(scriptable.get("length", scriptable), Integer.class);
		Object[] a = new Object[len];
		for(int i = 0; i < len; i++) {
			Object v = scriptable.get(i, scriptable);
			if (DBG) {
				Log.d(TAG, "Index: " + i + " value: " + v + " type: " + v.getClass().getName());
			}
			a[i] = convertJavascript(invocation, v, Object.class);
		}
		return a;
	}
	
	public Object convertScriptable(KrollInvocation invocation, Scriptable scriptable) {
		if (scriptable instanceof KrollObject) {
			return ((KrollObject)scriptable).getProxy();
		} else if (isArrayLike(scriptable)) {
			return toArray(invocation, scriptable);
		} else if (scriptable.getClassName().equals("Date")) {
			double time = (Double) ScriptableObject.callMethod(scriptable, "getTime", new Object[0]);
			return new Date((long)time);
		} else if (scriptable.getClassName().equals("Error")) {
			if (scriptable.has("javaException", scriptable)) {
				NativeJavaObject exception = (NativeJavaObject) scriptable.get("javaException", scriptable);
				return exception.unwrap();
			} else {
				return scriptable.get("message", scriptable);
			}
		} else if (scriptable instanceof Function) {
			if (scriptable instanceof KrollCallback) {
				return scriptable;
			}
			
			KrollContext ctx = null;
			if (invocation.getTiContext() != null) {
				ctx = invocation.getTiContext().getKrollContext();
			}
			return new KrollCallback(ctx, invocation.getScope(), invocation.getThisObj(), (Function) scriptable);
		} else {
			KrollDict args = new KrollDict();
			for(Object key : scriptable.getIds()) {
				Object v;
				if (key instanceof String) {
					v = scriptable.get((String)key, scriptable);
				} else {
					v = scriptable.get((Integer)key, scriptable);
				}
				v = convertJavascript(invocation, v, Object.class);
				if (DBG) {
					Log.i(TAG, "Key: " + key + " value: " + v + " type: " + v.getClass().getName());
				}
				args.put(key.toString(), v);
			}
			return args;
			//Log.w(LCAT, "Unhandled type conversion of Scriptable: value: " + value.toString() + " type: " + value.getClass().getName());
		}
	}
	
	public Object convertJavascript(KrollInvocation invocation, Object value, Class<?> target) {
		if (value instanceof Scriptable) {
			return convertScriptable(invocation, (Scriptable)value);
		} else if (value instanceof String || value instanceof Number || value instanceof Boolean) {
			return Context.jsToJava(value, target);
		} else if (value == null) {
			return null;
		} else {
			if (value.getClass().isArray()) {
				Object[] values = (Object[]) value;
				Object[] newValues = new Object[values.length];
				for(int i = 0; i < values.length; i++) {
					newValues[i] = convertJavascript(invocation, values[i], Object.class);
				}
				return newValues;
			} else {
				Log.w(TAG, "Unhandled type conversion: value: " + value.toString() + " type: " + value.getClass().getName() + ", invocation: " + invocation);
			}
		}
		return value;
	}
	
	public Object getDefaultValue(Class<?> clazz) {
		return KrollDefaultValues.getDefault(clazz);
	}
	
	public static boolean toBoolean(Object value)
	{
		if (value instanceof Boolean) {
			return (Boolean) value;
		} else if (value instanceof String) {
			return Boolean.parseBoolean(((String) value));
		} else {
			throw new IllegalArgumentException("Unable to convert " + value.getClass().getName() + " to boolean.");
		}
	}
	public static boolean toBoolean(KrollDict d, String key) {
		return toBoolean(d.get(key));
	}

	public static int toInt(Object value) {
		if (value instanceof Double) {
			return ((Double) value).intValue();
		} else if (value instanceof Integer) {
			return ((Integer) value);
		} else if (value instanceof String) {
			return Integer.parseInt((String) value);
		} else {
			throw new NumberFormatException("Unable to convert " + value.getClass().getName());
		}
	}
	public static int toInt(KrollDict d, String key) {
		return toInt(d.get(key));
	}

	public static float toFloat(Object value) {
		if (value instanceof Double) {
			return ((Double) value).floatValue();
		} else if (value instanceof Integer) {
			return ((Integer) value).floatValue();
		} else if (value instanceof String) {
			return Float.parseFloat((String) value);
		} else {
			throw new NumberFormatException("Unable to convert " + value.getClass().getName());
		}
	}
	public static float toFloat(KrollDict d, String key) {
		return toFloat(d.get(key));
	}

	public static double toDouble(Object value) {
		if (value instanceof Double) {
			return ((Double) value);
		} else if (value instanceof Integer) {
			return ((Integer) value).doubleValue();
		} else if (value instanceof String) {
			return Double.parseDouble((String) value);
		} else {
			throw new NumberFormatException("Unable to convert " + value.getClass().getName());
		}
	}
	public static double toDouble(KrollDict d, String key) {
		return toDouble(d.get(key));
	}

	public static String toString(Object value) {
		return value == null ? null : value.toString();
	}
	public static String toString(KrollDict d, String key) {
		return toString(d.get(key));
	}

	public static String[] toStringArray(Object[] parts) {
		String[] sparts = (parts != null ? new String[parts.length] : new String[0]);

		if (parts != null) {
			for (int i = 0; i < parts.length; i++) {
				sparts[i] = (String) parts[i];
			}
		}
		return sparts;
	}
}
