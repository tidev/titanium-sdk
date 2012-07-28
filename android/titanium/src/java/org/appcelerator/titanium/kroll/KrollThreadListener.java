/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

/**
 * A listener for Kroll threads starting and ending
 */
public interface KrollThreadListener
{
	public void threadStarted(KrollHandlerThread thread);
	public void threadEnded(KrollHandlerThread thread);
}
