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
	/**
	 * Implementing classes should use this method when a property changes its value
	 * @param key the key whose value has been modified
	 * @param oldValue  the old value of 'key'
	 * @param newValue  the new value of 'key'
	 * @param proxy  the proxy associated with 'key'
	 */
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy);
	
	/**
	 * Implementing classes should use this method to process the initial properties passed into the proxy.
	 * @param d  a KrollDict properties object(key,value) to process
	 */
	public void processProperties(KrollDict d);
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy);
	
	
	public void listenerAdded(String type, int count, KrollProxy proxy);
	public void listenerRemoved(String type, int count, KrollProxy proxy);
}
