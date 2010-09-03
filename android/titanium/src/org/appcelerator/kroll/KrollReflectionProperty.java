/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import org.appcelerator.kroll.util.KrollReflectionUtils;

public class KrollReflectionProperty implements KrollDynamicProperty {

	protected boolean get, set, retain;
	protected String name;
	protected KrollProxy proxy;
	protected Method getMethod, setMethod;
	
	public KrollReflectionProperty(KrollProxy proxy, String name, boolean get, boolean set, String getMethodName, String setMethodName, boolean retain) {
		this.name = name;
		this.get = get;
		this.set = set;
		this.proxy = proxy;
		
		if (get && getMethodName != null) {
			this.getMethod = KrollReflectionUtils.getMethod(proxy.getClass(), getMethodName);
		}
		if (set && setMethodName != null) {
			this.setMethod = KrollReflectionUtils.getMethod(proxy.getClass(), setMethodName);
		}
		this.retain = retain;
	}
	
	@Override
	public Object get(KrollInvocation invocation, String name) {
		if (supportsGet(name)) {
			try {
				return getMethod.invoke(proxy, invocation);
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
		return KrollProxy.UNDEFINED;
	}

	@Override
	public void set(KrollInvocation invocation, String name, Object value) {
		if (supportsSet(name)) {
			if (retain) {
				proxy.setProperty(name, value);
			}
			try {
				setMethod.invoke(proxy, invocation, value);
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

	@Override
	public boolean supportsGet(String name) {
		return get && getMethod != null;
	}

	@Override
	public boolean supportsSet(String name) {
		return set && setMethod != null;
	}
}
