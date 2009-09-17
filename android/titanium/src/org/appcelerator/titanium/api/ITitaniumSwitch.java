/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumSwitch extends ITitaniumNativeControl
{
	// Added in 0.7.0
	public void setValue(boolean value);
	public boolean getValue();
}
