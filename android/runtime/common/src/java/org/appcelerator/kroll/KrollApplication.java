/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.kroll.common.CurrentActivityListener;

import android.app.Activity;

/**
 * An interface for things Kroll needs from the application instance
 */
public interface KrollApplication
{
	public int getThreadStackSize();
	
	public Activity getCurrentActivity();
	
	public void waitForCurrentActivity(CurrentActivityListener l);
	
}
