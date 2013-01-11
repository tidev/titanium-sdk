/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public class KrollException
{
	private String message;
	private String stack;
	private String lineNumber;
	private String fileName;

	public KrollException(String message, String stack)
	{
		this.message = message;
		this.stack = stack;
		parseInfo();
	}
	
	private void parseInfo() 
	{
		if (stack == null) {
			return;
		}

		String split[];
		split = stack.split("\\n");
		if (split.length >= 2) {
			String secondLine = split[1];
			secondLine = secondLine.replace("at", " ").trim();

			String info[];
			info = secondLine.split(":");
			if (info.length >=2) {
				lineNumber = info[1];
				fileName = info[0];
			}
		}
		
		
	}

	public String getStack()
	{
		return stack;
	}

	public String getMessage()
	{
		return message;
	}
	
	public String getLineNumber()
	{
		return lineNumber;
	}
	
	public String getFileName()
	{
		return fileName;
	}

}