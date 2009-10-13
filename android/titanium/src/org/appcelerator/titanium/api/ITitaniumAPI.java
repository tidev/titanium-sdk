/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumAPI
{
	public void log(int severity, String msg);
	public void updateNativeControls(String json);
	public void signal(String syncId);

	// Added in 0.6.2
	public void invalidateLayout();

	// Added in 0.7.0
	public ITitaniumJSRef getObjectReference(int key);
	public int getTitaniumMemoryBlobLength(int key);

	public String getTitaniumMemoryBlobString(int key);
}
