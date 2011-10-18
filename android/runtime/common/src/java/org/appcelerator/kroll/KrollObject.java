/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;


/**
 * A representation of the native JS object that corresponds with a Kroll proxy
 */
public abstract class KrollObject
{
	private static final String TAG = "KrollObject";

	protected HashMap<String, Boolean> hasListenersForEventType = new HashMap<String, Boolean>();


	public boolean hasListeners(String event)
	{
		Boolean hasListeners = hasListenersForEventType.get(event);
		if (hasListeners == null) {
			return false;
		}

		return hasListeners.booleanValue();
	}

	public void setHasListenersForEventType(String event, boolean hasListeners)
	{
		hasListenersForEventType.put(event, hasListeners);
	}

	protected abstract void setProperty(String name, Object value);
	protected abstract boolean fireEvent(String type, Object data);
	protected abstract void release();
}

