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
import java.util.Set;

import org.appcelerator.titanium.TiContext;
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
import org.mozilla.javascript.Undefined;

public class KrollConverter implements KrollNativeConverter,
	KrollJavascriptConverter, KrollDefaultValueProvider {
	
	private static final String TAG = "KrollConverter";
	private static final boolean DBG = TiConfig.DEBUG;
	
	public static final String DEFAULT_NAME = "__default_name__";
	public static final String JS_CLASS_DATE = "Date";
	public static final String JS_CLASS_ERROR = "Error";
	public static final String JS_CLASS_OBJECT = "Object";
	public static final String JS_METHOD_VALUE_OF = "valueOf";
	public static final String JS_METHOD_TO_STRING = "toString";
	public static final String JS_PROPERTY_JAVA_EXCEPTION = "javaException";
	public static final String JS_PROPERTY_LENGTH = "length";
	public static final String JS_PROPERTY_MESSAGE = "message";
	public static final String JS_UNDEFINED = "undefined";
	
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
		TiContext tiContext = invocation.getTiContext();
		Object result[] = new Object[array.length()];
		for (int i = 0; i < array.length(); i++) {
			try {
				Object r = array.get(i);
				result[i] = convertNative(invocation, r);
			} catch(JSONException ig) {
				ig.printStackTrace();
			}
		}
		return Context.getCurrentContext().newArray(tiContext.getKrollBridge().getScope(), result);
	}
	
	@SuppressWarnings("serial")
	public class ScriptableMap extends ScriptableObject {
		protected Map<String, Object> map;
		
		public ScriptableMap(KrollInvocation invocation, Map<String, Object> map) {
			super(invocation.getScope(), ScriptableObject.getObjectPrototype(invocation.getScope()));
			this.map = map;
		}
		
		@Override
		public Object get(String name, Scriptable start) {
			KrollInvocation invocation = KrollInvocation.createPropertyGetInvocation(start, this, name, null, null);
			Object value = map.get(name);
			if (value == null && (name.equals(JS_METHOD_VALUE_OF) || name.equals(JS_METHOD_TO_STRING))) {
				value = new KrollMethod(name){
					@Override
					public Object invoke(KrollInvocation invocation,
							Object[] args) throws Exception
					{
						return ScriptableMap.this.toString();
					}
				};
			}
			Object result = convertNative(invocation, value);
			invocation.recycle();
			return result;
		}
		
		@Override
		public Object get(int index, Scriptable start) {
			return get(""+index, start);
		}
		
		@Override
		public void put(String name, Scriptable start, Object value) {
			KrollInvocation invocation = KrollInvocation.createPropertySetInvocation(start, this, name, null, null);
			map.put(name, convertJavascript(invocation, value, Object.class));
			invocation.recycle();
		}
		
		@Override
		public void put(int index, Scriptable start, Object value) {
			put(""+index, start, value);
		}
		
		@Override
		public String getClassName() {
			return JS_CLASS_OBJECT;
		}

		public String toString() {
			StringBuilder sb = new StringBuilder();
			sb.append("{ ");
			
			Set<String> keys = map.keySet();
			String sep = "";
			
			for(String key : keys) {
				sb.append(" '").append(key).append("' : ");
				Object o = map.get(key);
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

		@Override
		public boolean has(String name, Scriptable start) {
			boolean exists = super.has(name, start);
			if (!exists && this.map != null) {
				exists = this.map.containsKey(name);
			}
			return exists;
		}

		@Override
		public Object[] getIds() {
			if (this.map != null) {
				return this.map.keySet().toArray();
			}
			return super.getIds();
		}
	}
	
	@SuppressWarnings("unchecked")
	public Object convertNative(KrollInvocation invocation, Object value) {
		if (value instanceof KrollConvertable) {
			return ((KrollConvertable)value).getJavascriptValue();
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
			if (value instanceof KrollDate) {
				return ((KrollDate)value).getJSDate();
			}
			
			Date date = (Date) value;
			TiContext tiContext = invocation.getTiContext();
			return Context.getCurrentContext().newObject(tiContext.getKrollBridge().getScope(), JS_CLASS_DATE, new Object[] { date.getTime() });
		}
		else if (value.getClass().isArray()) {
			int length = Array.getLength(value);
			Object[] jsArray = new Object[length];
			for (int i = 0; i < length; i++) {
				jsArray[i] = convertNative(invocation, Array.get(value, i));
			}
			TiContext tiContext = invocation.getTiContext();
			return Context.getCurrentContext().newArray(tiContext.getKrollBridge().getScope(), jsArray);
		}
		else if (value == JSONObject.NULL || value.getClass().equals(JSONObject.NULL.getClass()))
		{
			return Context.javaToJS(null, invocation.getScope());
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
		return scriptable.has(JS_PROPERTY_LENGTH, scriptable) &&
			scriptable.get(JS_PROPERTY_LENGTH, scriptable) instanceof Number &&
			!(scriptable instanceof KrollObject) &&
			!(scriptable instanceof Function) &&
			scriptable.getClassName().equals("Array");
	}

	public Object[] toArray(KrollInvocation invocation, Scriptable scriptable)
	{
		int len = (Integer) Context.jsToJava(scriptable.get(JS_PROPERTY_LENGTH, scriptable), Integer.class);
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
			KrollProxy proxy = ((KrollObject)scriptable).getProxy();
			return proxy.getNativeValue();
		} else if (isArrayLike(scriptable)) {
			return toArray(invocation, scriptable);
		} else if (scriptable.getClassName().equals(JS_CLASS_DATE)) {
			return new KrollDate(scriptable);
		} else if (scriptable.getClassName().equals(JS_CLASS_ERROR)) {
			if (scriptable.has(JS_PROPERTY_JAVA_EXCEPTION, scriptable)) {
				NativeJavaObject exception = (NativeJavaObject) scriptable.get(JS_PROPERTY_JAVA_EXCEPTION, scriptable);
				return exception.unwrap();
			} else {
				return scriptable.get(JS_PROPERTY_MESSAGE, scriptable);
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
			return new KrollScriptableDict(scriptable);
		}
	}

	public Object convertArray(KrollInvocation invocation, Object[] array, Class<?> target) {
		if (target.isArray()) {
			// Handle casting native / box type arrays
			Object converted = null;
			Class<?> componentType = target.getComponentType();
			if (!componentType.equals(Object.class)) {
				if (componentType.equals(int.class)) {
					converted = new int[array.length];
				} else if (componentType.equals(Integer.class)) {
					converted = new Integer[array.length];
				} else if (componentType.equals(double.class)) {
					converted = new double[array.length];
				} else if (componentType.equals(Double.class)) {
					converted = new Double[array.length];
				} else if (componentType.equals(String.class)) {
					converted = new String[array.length];
				}
				if (converted != null) {
					for (int i = 0; i < array.length; i++) {
						Array.set(converted, i, convertJavascript(invocation, array[i], componentType));
					}
					return converted;
				}
			}
		}
		
		Object[] newValues = new Object[array.length];
		for(int i = 0; i < array.length; i++) {
			newValues[i] = convertJavascript(invocation, array[i], Object.class);
		}
		return newValues;
	}

	public Object convertJavascript(KrollInvocation invocation, Object value, Class<?> target) {
		if (value instanceof Scriptable) {
			return convertScriptable(invocation, (Scriptable)value);
		} else if (value instanceof String || value instanceof Number || value instanceof Boolean) {
			return Context.jsToJava(value, target);
		} else if (value == null) {
			return null;
		} else if (value instanceof Undefined) {
			return KrollProxy.UNDEFINED;
		} else {
			if (value.getClass().isArray()) {
				return convertArray(invocation, (Object[])value, target);
			} else {
				if (DBG) {
					Log.d(TAG, "Unhandled type conversion: value: " + value.toString() + " type: " + value.getClass().getName() + ", invocation: " + invocation);
				}
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
		return value == null ? null : (value == Scriptable.NOT_FOUND ? JS_UNDEFINED : value.toString());
	}

	public static String toString(KrollDict d, String key) {
		return toString(d.get(key));
	}

	public static String[] toStringArray(Object[] parts) {
		String[] sparts = (parts != null ? new String[parts.length] : new String[0]);
		if (parts != null) {
			for (int i = 0; i < parts.length; i++) {
				sparts[i] = parts[i] == null ? null : parts[i].toString();
			}
		}
		return sparts;
	}
}
