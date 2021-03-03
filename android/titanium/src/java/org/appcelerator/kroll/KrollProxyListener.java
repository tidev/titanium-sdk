/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.List;

/**
 * This class is used by {@link KrollProxy KrollProxy} to delegate model changes. See {@link KrollProxy#setModelListener(KrollProxyListener)})
 * for more details.
 */
public interface KrollProxyListener {
	/**
	 * Implementing classes should notify this method when an existing property is modified.
	 * @param key the key whose value has been modified.
	 * @param oldValue  the old value.
	 * @param newValue  the new value.
	 * @param proxy  the associated proxy.
	 * @module.api
	 */
	void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy);

	/**
	 * Implementing classes can use this method to examine the properties passed into the proxy.
	 * @param properties  a set of properties to process.
	 * @module.api
	 */
	void processProperties(KrollDict properties);
	void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy);

	/**
	 * This method is called when an event listener is added for a specific event.
	 * @param type the added event listener
	 * @param count the count of event listeners.
	 * @param proxy the proxy that added the listener.
	 * @module.api
	 */
	void listenerAdded(String type, int count, KrollProxy proxy);

	/**
	 * This method is called when an event listener is removed for a specific event.
	 * @param type the removed event listener
	 * @param count the count of event listeners.
	 * @param proxy the proxy that removed the listener.
	 * @module.api
	 */
	void listenerRemoved(String type, int count, KrollProxy proxy);
}
