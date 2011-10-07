/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

/**
 * An interface that simply logs a message with a given log level
 */
public interface TiLogger
{
	public static final int TRACE = 1;
	public static final int DEBUG = 2;
	public static final int INFO = 3;
	public static final int NOTICE = 4;
	public static final int WARN = 5;
	public static final int ERROR = 6;
	public static final int CRITICAL = 7;
	public static final int FATAL = 8;

	public void log(int level, String message);
}
