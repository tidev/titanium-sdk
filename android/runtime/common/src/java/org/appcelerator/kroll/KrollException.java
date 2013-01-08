/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public class KrollException
{
	private String message;
	private String stack;

	public KrollException(String message, String stack)
	{
		this.message = message;
		this.stack = stack;
	}

	public String getStack()
	{
		return stack;
	}

	public String getMessage()
	{
		return message;
	}

}