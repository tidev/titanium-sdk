/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.reflect.Field;

import org.appcelerator.kroll.util.KrollReflectionUtils;

public class KrollProperty implements KrollDynamicProperty {

	protected KrollProxy proxy;
	protected String name;
	protected boolean get, set;
	protected Field field;
	
	public KrollProperty(KrollProxy proxy, String name, boolean get, boolean set, String fieldName) {
		this.proxy = proxy;
		this.name = name;
		this.get = get;
		this.set = set;
		this.field = KrollReflectionUtils.getField(proxy.getClass(), fieldName);
	}
	
	@Override
	public Object get(KrollInvocation invocation, String name) {
		if (!supportsGet(name)) return KrollProxy.UNDEFINED;
		
		if (proxy != null && field != null) {
			try {
				return field.get(proxy);
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IllegalAccessException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		return KrollProxy.UNDEFINED;
	}

	@Override
	public void set(KrollInvocation invocation, String name, Object value) {
		if (!supportsSet(name)) return;
		if (proxy != null && field != null) {
			try {
				field.set(proxy, value);
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IllegalAccessException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}

	@Override
	public boolean supportsGet(String name) {
		return get && name.equals(this.name);
	}

	@Override
	public boolean supportsSet(String name) {
		return set && name.equals(this.name);
	}

}
