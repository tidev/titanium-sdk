/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

import java.util.concurrent.Semaphore;

public class AsyncResult extends Semaphore
{
	private static final long serialVersionUID = 1L;

	protected Object result;
	protected Object arg;
	protected Throwable exception;
	
	public AsyncResult() {
		this(null);
	}

	public AsyncResult(Object arg) {
		super(0);
		this.arg = arg;
	}

	/**
	 * Returning object arg that was passed into the constructor. 
	 * @return
	 */
	public Object getArg() {
		return arg;
	}

	/**
	 * Setting the result asynchronously, releasing the lock.
	 * @param result  the resulting Object.
	 */
	public void setResult(Object result) {
		this.result = result;
		this.release();
	}
	
	/**
	 * Set the exception that will be thrown in TiMessenger.sendBlockingMessage(...). Also releases the lock.
	 * @param exception the exception to be thrown.
	 */
	public void setException(Throwable exception) {
		this.result = null;
		this.exception = exception;
		this.release();
	}

	public Object getResult()
	{
		try {
			this.acquire();
		} catch (InterruptedException e) {
			// Ignore
		}
		if (exception != null) {
			throw new RuntimeException(exception);
		}
		return result;
	}

	public Object getResultUnsafe() {
		return result;
	}
}
