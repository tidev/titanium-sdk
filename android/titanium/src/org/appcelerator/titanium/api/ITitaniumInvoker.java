/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumInvoker
{
	public void pushString(String s);
	public void pushObject(Object o);
	public void pushInteger(int i);
	public void pushDouble(double d);
	public void pushBoolean(boolean b);

	ITitaniumCheckedResult call(String name);

	// Internal
	public Object getObject();
}
