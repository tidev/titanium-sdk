/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.bridge;

public abstract class Bridge
{
	protected String url;

	public Bridge() {

	}

	public abstract void boot(String Url /*KrollProxy window*/);
	public abstract void gc();
	public abstract void shutdown();
}
