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
	
	public Scriptable convertNative(KrollInvocation invocation, Object o) {
		// TODO Auto-generated method stub
		return null;
	}

	public Object convertScriptable(KrollInvocation invocation, Scriptable s) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public <T> T getDefaultValue(Class<T> clazz) {
		// TODO Auto-generated method stub
		return null;
	}
}
