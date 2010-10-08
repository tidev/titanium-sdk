package org.appcelerator.kroll.util;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class KrollReflectionUtils {

	// private+protected methods/fields are only found through iteration (can't just lookup)
	public static Field getField(Class<?> clazz, String fieldName) {
		for (Field field : clazz.getDeclaredFields()) {
			if (field.getName().equals(fieldName)) {
				field.setAccessible(true);
				return field;
			}
		}
		return null;
	}
	
	public static Method getMethod(Class<?> clazz, String methodName) {
		for (Method method : clazz.getDeclaredMethods()) {
			if (method.getName().equals(methodName)) {
				method.setAccessible(true);
				return method;
			}
		}
		return null;
	}
}
