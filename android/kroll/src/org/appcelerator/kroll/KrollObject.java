/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public class KrollObject extends ScriptableObject {

	protected KrollProxy proxy;
	
	public KrollObject(KrollProxy proxy) {
		this.proxy = proxy;
	}
	
	@Override
	public String getClassName() {
		return proxy.getAPIClassName();
	}
	
	@Override
	public Object get(String name, Scriptable start) {
		try {
			Object value = proxy.get(start, name);
			if (value instanceof KrollProxy) {
				return new KrollObject((KrollProxy)value);
			}
			return value;
		} catch (NoSuchFieldException e) {
			return Scriptable.NOT_FOUND;
		}
	}
	
	public KrollProxy getProxy() {
		return proxy;
	}
}
