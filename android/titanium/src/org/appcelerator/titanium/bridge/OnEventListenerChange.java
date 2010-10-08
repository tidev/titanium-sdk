/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.bridge;

import org.appcelerator.kroll.KrollProxy;

public interface OnEventListenerChange
{
	void eventListenerAdded(String eventName, int count, KrollProxy proxy);
	void eventListenerRemoved(String eventName, int count, KrollProxy proxy);
}
