/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

/**
 * <p> An interface for handling exceptions from the runtime. </p>
 * 
 * A KrollExceptionHandler can be registered to the runtime by calling {@link KrollRuntime#setPrimaryExceptionHandler(KrollExceptionHandler)} 
 * or {@link KrollRuntime#addAdditionalExceptionHandler(KrollExceptionHandler, String)}.<br>
 * A handler can either be added as a primary or an additional handler. There can only be one primary handler, while multiple additional handlers can be set.<br>
 * When an exception occurs, all of the additional handlers are called first, and the primary handler will be called last.<br>
 * By default, the primary handler will be set to a TiExceptionHandler that pops up an error dialog. <br>
 * 
 * <p>An example of performing additional tasks before the default error dialog:</p> 
 * 
 * <pre>
 * 	KrollExceptionHandler handler = new KrollExceptionHandler() {	
 *		&#064;Override
 *		public void handleException(ExceptionMessage arg0) {
 *			// perform additional tasks here
 *		}
 *	};
 *	KrollRuntime.addAdditionalExceptionHandler(handler, "sampleTask");
 * </pre>
 * 
 * To override the default error dialog behavior, simply override the primary handler with a custom handler.
 * 
 * @module.api
 */
public interface KrollExceptionHandler
{
	public class ExceptionMessage
	{
		public String title, message, sourceName, lineSource;
		public int line, lineOffset;

		public ExceptionMessage(final String title, final String message, final String sourceName, final int line,
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
	 * @param e An exception message containing line number, error title, message, etc
	 * @module.api
	 */
	public void handleException(ExceptionMessage e);
}
