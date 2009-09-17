/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;

import org.appcelerator.titanium.api.ITitaniumCheckedResult;
import org.appcelerator.titanium.api.ITitaniumInvoker;

public class TitaniumDelegate implements ITitaniumInvoker
{
	private Object obj;
	private ArrayList<Object> argList;
	private ArrayList<Class<?>> typeList;

	public TitaniumDelegate(Object obj) {
		this.obj = obj;
		this.typeList = new ArrayList<Class<?>>();
		this.argList = new ArrayList<Object>();
	}

	public void pushBoolean(boolean b) {
		typeList.add(boolean.class);
		argList.add(b);
	}

	public void pushDouble(double d) {
		typeList.add(double.class);
		argList.add(d);
	}

	public void pushInteger(int i) {
		typeList.add(int.class);
		argList.add(i);
	}

	public void pushObject(Object o) {
		typeList.add((o == null) ? Object.class : o.getClass());
		argList.add(o);
	}

	public void pushString(String s) {
		typeList.add(String.class);
		argList.add(s);
	}

	public ITitaniumCheckedResult call(String name)
	{
		ITitaniumCheckedResult result = null;

		Class<?>[] types = typeList.toArray(new Class<?>[0]);
		Object[] args = argList.toArray();

		try {
			Method m = obj.getClass().getMethod(name, types);
			Object r = m.invoke(obj, args);
			result = new TitaniumCheckedResult(r);
		} catch (NoSuchMethodException e) {
			throw new RuntimeException("Missing method: " + name, e);
		} catch (InvocationTargetException e) {
			result = new TitaniumCheckedResult(null, e.getCause().getMessage());
		} catch (Exception e) {
			result = new TitaniumCheckedResult(null, e.getMessage());
		}

		typeList.clear();
		argList.clear();

		return result;
	}

}
