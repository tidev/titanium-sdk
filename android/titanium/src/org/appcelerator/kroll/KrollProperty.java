/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public interface KrollProperty {

	public boolean supportsGet(String name);
	public Object get(KrollInvocation invocation, String name);
	
	public boolean supportsSet(String name);
	public void set(KrollInvocation invocation, String name, Object value);
}
