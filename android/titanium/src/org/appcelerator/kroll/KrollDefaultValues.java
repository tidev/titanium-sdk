/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.reflect.Array;
import java.util.HashMap;

public class KrollDefaultValues implements KrollDefaultValueProvider {
	public static final HashMap<Class<?>, Object> defaultValues = new HashMap<Class<?>, Object>();
	static {
		defaultValues.put(Boolean.class, false);
		defaultValues.put(Integer.class, -1);
		defaultValues.put(Long.class, -1);
		defaultValues.put(Double.class, -1);
		defaultValues.put(Short.class, -1);
		defaultValues.put(Byte.class, -1);
		defaultValues.put(Character.class, -1);
		defaultValues.put(Float.class, -1);
		defaultValues.put(Object.class, null);
	}
	
	public static Object getDefault(Class<?> clazz) {
		try {
			if (defaultValues.containsKey(clazz)) {
				return defaultValues.get(clazz);
			} else if (clazz.isArray()) {
				return Array.newInstance(clazz.getComponentType(), 0);
			}
			return clazz.newInstance();
		} catch (Exception e) {
			return null;
		}
	}

	public Object getDefaultValue(Class<?> clazz) {
		return getDefault(clazz);
	}
}
