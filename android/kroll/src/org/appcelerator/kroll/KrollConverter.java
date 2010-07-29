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
	
	public <T> T getDefaultValue(Class<T> clazz) {
		// TODO Auto-generated method stub
		return null;
	}
}
