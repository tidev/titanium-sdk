/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;


public interface ITitaniumGeolocation
{
	public void getCurrentPosition(String successListener, String failureListener, String options);
	public int watchPosition(String successListener, String failureListener, String options);
	public void clearWatch(int watchId);
}
