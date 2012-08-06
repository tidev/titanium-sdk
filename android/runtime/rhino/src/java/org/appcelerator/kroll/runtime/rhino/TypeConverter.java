/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.lang.reflect.Array;
import java.util.Date;
import java.util.Map;

import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.json.JSONObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;

/**
 * This class converts values between Rhino (JS) and Java / Titanium native types
 */
public class TypeConverter
{
	private static final String TAG = "TypeConverter";

	public static final String JS_CLASS_DATE = "Date";
	public static final String JS_CLASS_ERROR = "Error";
	public static final String JS_CLASS_OBJECT = "Object";
	public static final String JS_CLASS_SCOPEVARS = "ScopeVars";
	public static final String JS_METHOD_VALUE_OF = "valueOf";
	public static final String JS_METHOD_TO_STRING = "toString";
	public static final String JS_PROPERTY_CONSTRUCTOR = "constructor";
	public static final String JS_PROPERTY_JAVA_EXCEPTION = "javaException";
	public static final String JS_PROPERTY_LENGTH = "length";
	public static final String JS_PROPERTY_MESSAGE = "message";
	public static final String JS_PROPERTY_NAME = "name";
	public static final String JS_UNDEFINED = "undefined";

	@SuppressWarnings("serial")
	public static class ScriptableMap extends ScriptableObject
	{
		protected Map<String, Object> map;

		public ScriptableMap(Scriptable scope, Map<String, Object> map)
		{
			super(scope, ScriptableObject.getObjectPrototype(scope));
			this.map = map;
		}

		@Override
		public Object get(String name, Scriptable start)
		{
			Object value = map.get(name);
			return javaObjectToJsObject(value, start);
		}

		@Override
		public Object get(int index, Scriptable start)
		{
			return get("" + index, start);
		}

		@Override
		public void put(String name, Scriptable start, Object value)
		{
			map.put(name, jsObjectToJavaObject(value, start));
		}

		@Override
		public void put(int index, Scriptable start, Object value)
		{
			put("" + index, start, value);
		}

		@Override
		public String getClassName()
		{
			return JS_CLASS_OBJECT;
		}

		@Override
		public Object getDefaultValue(Class<?> typeHint)
		{
			if (typeHint == null || typeHint.equals(ScriptRuntime.StringClass)) {
				return "[object Object]";
			}
			return super.getDefaultValue(typeHint);
		}

		@Override
		public boolean has(String name, Scriptable start)
		{
			boolean exists = super.has(name, start);
			if (!exists && this.map != null) {
				exists = this.map.containsKey(name);
			}
			return exists;
		}

		@Override
		public Object[] getIds()
		{
			if (this.map != null) {
				return this.map.keySet().toArray();
			}
			return super.getIds();
		}
	}

	public static Scriptable javaObjectArrayToJsArray(Object[] value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		int length = value.length;
		Object[] jsArray = new Object[length];
		for (int i = 0; i < length; i++) {
			jsArray[i] = javaObjectToJsObject(value[i], scope);
		}
		return Context.getCurrentContext().newArray(scope, jsArray);
	}

	
	public static Scriptable javaStringArrayToJsArray(String[] value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		int length = value.length;
		Object[] jsArray = new Object[length];
		for (int i = 0; i < length; i++) {
			jsArray[i] = value[i];
		}
		return Context.getCurrentContext().newArray(scope, jsArray);
	}


	public static Scriptable javaIntArrayToJsArray(int[] value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		int length = value.length;
		Object[] jsArray = new Object[length];
		for (int i = 0; i < length; i++) {
			jsArray[i] = value[i];
		}
		return Context.getCurrentContext().newArray(scope, jsArray);
	}

	public static Scriptable javaLongArrayToJsArray(long[] value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		int length = value.length;
		Object[] jsArray = new Object[length];
		for (int i = 0; i < length; i++) {
			jsArray[i] = value[i];
		}
		return Context.getCurrentContext().newArray(scope, jsArray);
	}
	
	public static Scriptable javaFloatArrayToJsArray(float[] value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		int length = value.length;
		Object[] jsArray = new Object[length];
		for (int i = 0; i < length; i++) {
			jsArray[i] = value[i];
		}
		return Context.getCurrentContext().newArray(scope, jsArray);
	}

	public static Scriptable javaArrayToJsArray(Object value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		int length = Array.getLength(value);
		Object[] jsArray = new Object[length];
		for (int i = 0; i < length; i++) {
			jsArray[i] = javaObjectToJsObject(Array.get(value, i), scope);
		}

		return Context.getCurrentContext().newArray(scope, jsArray);
	}

	@SuppressWarnings("unchecked")
	public static Object javaObjectToJsObject(Object value, Scriptable scope)
	{
		if (value == null || value instanceof String ||
				value instanceof Number ||
				value instanceof Boolean ||
				value instanceof Scriptable || value instanceof Function) {

			return Context.javaToJS(value, scope);

		} else if (value instanceof KrollProxySupport) {
			KrollProxySupport proxySupport = (KrollProxySupport) value;
			RhinoObject rhinoObject = (RhinoObject) proxySupport.getKrollObject();

			if (rhinoObject == null) {
				Proxy proxy = ProxyFactory.createRhinoProxy(
					Context.getCurrentContext(), scope, proxySupport);

				proxySupport.setKrollObject(proxy.getRhinoObject());
				return proxy;
			}

			return rhinoObject.getNativeObject();

		} else if (value instanceof Map) {
			// catches Map + KrollDict
			if (value instanceof KrollScriptableDict) {
				return ((KrollScriptableDict) value).getScriptable();
			}

			return new ScriptableMap(scope, (Map<String,Object>)value);

		} else if (value instanceof Date) {
			if (value instanceof KrollDate) {
				return ((KrollDate)value).getJSDate();
			}

			Date date = (Date) value;
			return Context.getCurrentContext().newObject(scope,
				JS_CLASS_DATE, new Object[] { date.getTime() });

		} else if (value.getClass().isArray()) {
			return javaArrayToJsArray(value, scope);

		} else if (value instanceof RhinoFunction) {
			return ((RhinoFunction) value).getFunction();

		} else if (value == JSONObject.NULL || value.getClass().equals(JSONObject.NULL.getClass())) {
			return Context.javaToJS(null, scope);

		} else if (value == KrollRuntime.UNDEFINED) {
			return Context.getUndefinedValue();

		} else {
			return value;
		}
	}

	public static boolean jsScriptableIsCreationDict(Scriptable scriptable)
	{
		return !(scriptable instanceof Proxy
			|| scriptable instanceof Function
			|| ScriptRuntime.isArrayObject(scriptable)
			|| scriptable.getClassName().equals(JS_CLASS_DATE)
			|| scriptable.getClassName().equals(JS_CLASS_ERROR));
	}

	public static boolean jsScriptableIsScopeVarsDict(Scriptable scriptable)
	{
		if (scriptable == null) {
			return false;
		}
		Object constructor = ScriptableObject.getProperty(scriptable, JS_PROPERTY_CONSTRUCTOR);
		if (constructor instanceof Scriptable) {
			Object name = ScriptableObject.getProperty((Scriptable) constructor, JS_PROPERTY_NAME);
			if (JS_CLASS_SCOPEVARS.equals(name)) {
				return true;
			}
		}
		return false;
	}

	public static Object jsScriptableToJavaObject(Scriptable scriptable, Scriptable scope)
	{
		if (scriptable instanceof Proxy) {
			Proxy proxy = (Proxy) scriptable;
			return proxy.getProxy();

		} else if (ScriptRuntime.isArrayObject(scriptable)) {
			return jsArrayToJavaObjectArray(scriptable, scope);

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
			return new RhinoFunction((Function) scriptable);

		} else {
			return new KrollScriptableDict(scriptable);
		}
	}

	public static Object[] jsArrayToJavaObjectArray(Scriptable array, Scriptable scope)
	{
		if (array == null) {
			return null;
		}
		int len = (Integer) Context.jsToJava(array.get(JS_PROPERTY_LENGTH, array), Integer.class);
		Object[] a = new Object[len];
		for (int i = 0; i < len; i++) {
			Object v = array.get(i, array);
			Log.d(TAG, "Index: " + i + " value: " + v + " type: " + v.getClass().getName(), Log.DEBUG_MODE);
			a[i] = jsObjectToJavaObject(v, scope);
		}
		return a;
	}
	
	public static String[] jsArrayToJavaStringArray(Scriptable array, Scriptable scope)
	{
		if (array == null) {
			return null;
		}
		int len = (Integer) Context.jsToJava(array.get(JS_PROPERTY_LENGTH, array), Integer.class);
		String[] a = new String[len];
		for (int i = 0; i < len; i++) {
			Object v = array.get(i, array);
			Log.d(TAG, "Index: " + i + " value: " + v + " type: " + v.getClass().getName(), Log.DEBUG_MODE);
			a[i] = jsObjectToJavaString(v, scope);
		}
		return a;
	}

	public static int[] jsArrayToJavaIntArray(Scriptable array, Scriptable scope)
	{
		if (array == null) {
			return null;
		}
		int len = (Integer) Context.jsToJava(array.get(JS_PROPERTY_LENGTH, array), Integer.class);
		int[] a = new int[len];
		for (int i = 0; i < len; i++) {
			Object v = array.get(i, array);
			Log.d(TAG, "Index: " + i + " value: " + v + " type: " + v.getClass().getName(), Log.DEBUG_MODE);
			a[i] = jsObjectToJavaInt(v, scope);
		}
		return a;
	}

	public static long[] jsArrayToJavaLongArray(Scriptable array, Scriptable scope)
	{
		if (array == null) {
			return null;
		}
		int len = (Integer) Context.jsToJava(array.get(JS_PROPERTY_LENGTH, array), Integer.class);
		long[] a = new long[len];
		for (int i = 0; i < len; i++) {
			Object v = array.get(i, array);
			Log.d(TAG, "Index: " + i + " value: " + v + " type: " + v.getClass().getName(), Log.DEBUG_MODE);
			a[i] = jsObjectToJavaLong(v, scope);
		}
		return a;
	}
	
	public static float[] jsArrayToJavaFloatArray(Scriptable array, Scriptable scope)
	{
		if (array == null) {
			return null;
		}
		int len = (Integer) Context.jsToJava(array.get(JS_PROPERTY_LENGTH, array), Integer.class);
		float[] a = new float[len];
		for (int i = 0; i < len; i++) {
			Object v = array.get(i, array);
			Log.d(TAG, "Index: " + i + " value: " + v + " type: " + v.getClass().getName(), Log.DEBUG_MODE);
			a[i] = jsObjectToJavaFloat(v, scope);
		}
		return a;
	}

	public static Object jsArrayToJavaArray(Object[] array, Class<?> target, Scriptable scope)
	{
		if (array == null) {
			return null;
		}
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
						Array.set(converted, i, jsObjectToJavaObject(array[i], scope));
					}
					return converted;
				}
			}
		}
		
		Object[] newValues = new Object[array.length];
		for (int i = 0; i < array.length; i++) {
			newValues[i] = jsObjectToJavaObject(array[i], scope);
		}
		return newValues;
	}

	public static Object[] jsArgumentsToJavaObjectArray(Scriptable arguments)
	{
		Object lengthValue = ScriptableObject.getProperty(arguments, "length");
		int length = ((Number) lengthValue).intValue();
		Object[] args = new Object[length];

		for (int i = 0; i < length; i++) {
			args[i] = jsObjectToJavaObject(
				ScriptableObject.getProperty(arguments, i), arguments);
		}

		return args;
	}

	public static int jsObjectToJavaInt(Object value, Scriptable scope)
	{
		if (value instanceof Number) {
			return ((Number) value).intValue();
		}
		return Integer.parseInt(value.toString());
	}

	public static short jsObjectToJavaShort(Object value, Scriptable scope)
	{
		if (value instanceof Number) {
			return ((Number) value).shortValue();
		}
		return Short.parseShort(value.toString());
	}

	public static long jsObjectToJavaLong(Object value, Scriptable scope)
	{
		if (value instanceof Number) {
			return ((Number) value).longValue();
		}
		return Long.parseLong(value.toString());
	}

	public static float jsObjectToJavaFloat(Object value, Scriptable scope)
	{
		if (value instanceof Number) {
			return ((Number) value).floatValue();
		}
		return Float.parseFloat(value.toString());
	}

	public static double jsObjectToJavaDouble(Object value, Scriptable scope)
	{
		if (value instanceof Number) {
			return ((Number) value).doubleValue();
		}
		return Double.parseDouble(value.toString());
	}

	public static boolean jsObjectToJavaBoolean(Object value, Scriptable scope)
	{
		if (value instanceof Boolean) {
			return ((Boolean) value).booleanValue();
		}

		return Boolean.valueOf(value.toString());
	}

	public static String jsObjectToJavaString(Object value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		if (value instanceof Proxy) {
			return ((Proxy) value).getProxy().toString();

		} else if (value instanceof String) {
			return (String) value;
		}

		return value.toString();
	}

	public static Object jsObjectToJavaObject(Object value, Scriptable scope)
	{
		if (value == null) {
			return null;
		}

		if (value instanceof Scriptable) {
			return jsScriptableToJavaObject((Scriptable)value, scope);

		} else if (value instanceof Number) {
			return ((Number) value).doubleValue();

		} else if (value instanceof String || value instanceof Boolean) {
			return Context.jsToJava(value, value.getClass());

		} else if (value instanceof Undefined) {
			return KrollRuntime.UNDEFINED;

		} else {
			if (value.getClass().isArray()) {
				return jsArrayToJavaArray((Object[])value, Object.class, scope);
			} else {
				Log.d(TAG, "Unhandled type conversion: value: " + value.toString() + " type: " + value.getClass().getName(),
					Log.DEBUG_MODE);
			}
		}
		return value;
	}
}
