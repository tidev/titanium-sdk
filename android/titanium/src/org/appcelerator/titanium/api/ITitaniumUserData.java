/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

/**
 * interface used to dynamically load private application data that is 
 * compiled into the application at build time
 */
public interface ITitaniumUserData
{
	void load(ITitaniumProperties properties);
}
