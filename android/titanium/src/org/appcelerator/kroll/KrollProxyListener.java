/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public interface KrollProxyListener
{
	public void listenerAdded(String type, int count, KrollProxy proxy);
	public void listenerRemoved(String type, int count, KrollProxy proxy);
}
