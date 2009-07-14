/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumButton
{
	public void open(String json);
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);
}
