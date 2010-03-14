/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;


public interface TiProxyListener
{
	void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy);
	void processProperties(TiDict d);

	void listenerAdded(String type, int count, TiProxy proxy);
	void listenerRemoved(String type, int count, TiProxy proxy);
}
