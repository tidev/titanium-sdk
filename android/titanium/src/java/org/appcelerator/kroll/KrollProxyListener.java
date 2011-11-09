/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.List;

public interface KrollProxyListener
{
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy);
	public void processProperties(KrollDict d);
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy);
	
	public void listenerAdded(String type, int count, KrollProxy proxy);
	public void listenerRemoved(String type, int count, KrollProxy proxy);
}
