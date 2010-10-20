/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.reflect.Field;

import org.appcelerator.kroll.util.KrollReflectionUtils;

public class KrollReflectionProperty implements KrollProperty {

	protected String name;
	protected boolean get, set;
	protected String fieldName;
	protected KrollNativeConverter nativeConverter;
	protected KrollJavascriptConverter javascriptConverter;
	
	public KrollReflectionProperty(String name, boolean get, boolean set, String fieldName) {
		this.name = name;
		this.get = get;
		this.set = set;
		this.fieldName = fieldName;
	}
	
	@Override
	public Object get(KrollInvocation invocation, String name) {
		if (!supportsGet(name)) return KrollProxy.UNDEFINED;
		
		if (invocation.getProxy() != null) {
			KrollProxy proxy = invocation.getProxy();
			Field field = KrollReflectionUtils.getField(proxy.getClass(), fieldName);
			try {
				return nativeConverter.convertNative(invocation, field.get(proxy));
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
		if (invocation.getProxy() != null) {
			KrollProxy proxy = invocation.getProxy();
			Field field = KrollReflectionUtils.getField(proxy.getClass(), fieldName);
			try {
				field.set(proxy,
					javascriptConverter.convertJavascript(invocation, value, Object.class));
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

	public void setNativeConverter(KrollNativeConverter nativeConverter) {
		this.nativeConverter = nativeConverter;
	}

	public void setJavascriptConverter(KrollJavascriptConverter javascriptConverter) {
		this.javascriptConverter = javascriptConverter;
	}

}
