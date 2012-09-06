/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public interface KrollExceptionHandler
{
	public class ErrorMessage
	{
		public String title, message, sourceName, lineSource;
		public int line, lineOffset;

		public ErrorMessage(final String title, final String message, final String sourceName, final int line,
			final String lineSource, final int lineOffset)
		{
			this.title = title;
			this.message = message;
			this.sourceName = sourceName;
			this.lineSource = lineSource;
			this.line = line;
			this.lineOffset = lineOffset;
		}
	}

	/**
	 * Handles the exception
	 * 
	 * @param error An error message containing line number, error title, message, etc
	 * @module.api
	 */
	public void handleException(ErrorMessage e);
}
