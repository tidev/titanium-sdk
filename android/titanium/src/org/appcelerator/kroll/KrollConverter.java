/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.mozilla.javascript.Scriptable;

public class KrollConverter implements KrollNativeConverter,
	KrollScriptableConverter, KrollDefaultValueProvider {
	
	public static final String DEFAULT_NAME = "__default_name__";
	protected static KrollConverter _instance = new KrollConverter();
	
	public static KrollConverter getInstance() {
		return _instance;
	}
	
	public Object convertNative(KrollInvocation invocation, Object o) {
		if (o instanceof KrollProxy) {
			return new KrollObject((KrollProxy)o);
		}
		return o;
	}

	public Object convertScriptable(KrollInvocation invocation, Scriptable s) {
		if (s instanceof KrollObject) {
			return ((KrollObject)s).getProxy();
		}
		return s;
	}
	
	public Object convertJavascript(KrollInvocation invocation, Object o) {
		if (o instanceof Scriptable) {
			return convertScriptable(invocation, (Scriptable)o);
		}
		return o;
	}
	
	public <T> T getDefaultValue(Class<T> clazz) {
		// TODO Auto-generated method stub
		return null;
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
