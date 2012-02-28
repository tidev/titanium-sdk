/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.List;

/**
 * This class is used by kroll proxy to delegate model changes. See {@link KrollProxy#setModelListener(KrollProxyListener)})
 * for more details.
 */
public interface KrollProxyListener
{
	/**
	 * Implementing classes should use this method to modify an existing property.
	 * @param key the key whose value has been modified.
	 * @param oldValue  the old value.
	 * @param newValue  the new value.
	 * @param proxy  the associated proxy.
	 */
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy);
	
	/**
	 * Implementing classes should use this method to process initial properties passed into the proxy.
	 * @param properties  a set of properties to process
	 */
	public void processProperties(KrollDict properties);
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy);
	
	
	public void listenerAdded(String type, int count, KrollProxy proxy);
	public void listenerRemoved(String type, int count, KrollProxy proxy);
}
