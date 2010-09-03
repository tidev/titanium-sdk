package org.appcelerator.kroll;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import org.appcelerator.kroll.util.KrollReflectionUtils;

public class KrollInjector {

	public static void injectValueIntoField(Object o, String fieldName, Object value) {
		Field f = KrollReflectionUtils.getField(o.getClass(), fieldName);
		if (f != null) {
			try {
				f.set(o, value);
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IllegalAccessException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
	
	public static void injectValueIntoMethod(Object o, String methodName, Object value) {
		Method m = KrollReflectionUtils.getMethod(o.getClass(), methodName);
		if (m != null) {
			try {
				m.invoke(o, value);
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IllegalAccessException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (InvocationTargetException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
}
