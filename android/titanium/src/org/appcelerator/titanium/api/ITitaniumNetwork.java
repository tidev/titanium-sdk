/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;


public interface ITitaniumNetwork
{
	public ITitaniumHttpClient createHTTPClient();

	public int addEventListener(String eventName, String eventListener);
	public void removeEventListener(String eventName, int id);

	public String getUserAgent();
	public boolean isOnline();
	public String getNetworkTypeName();
	public int getNetworkType();
}
