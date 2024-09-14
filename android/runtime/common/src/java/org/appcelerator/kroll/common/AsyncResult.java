/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

import java.util.concurrent.Semaphore;

/**
 * This is a semaphore that blocks the current thread when getResult() is called until another thread calls setResult().
 * See {@link TiMessenger#sendBlockingMainMessage(android.os.Message, Object)} for an example use case.
 */
public class AsyncResult extends Semaphore
{
	private static final long serialVersionUID = 1L;

	protected Object result;
	protected Object arg;
	protected Throwable exception;

	/**
	 * Constructs an AsyncResult with no argument.
	 */
	public AsyncResult()
	{
		this(null);
	}

	/**
	 * Constructs an AsyncResult with an argument.
	 * @param arg the general user data for a {@link android.os.Message Message}.
	 */
	public AsyncResult(Object arg)
	{
		super(0);
		this.arg = arg;
	}

	/**
	 * @return the arg object that is passed into the constructor.
	 */
	public Object getArg()
	{
		return arg;
	}

	/**
	 * Sets the result asynchronously, releasing the lock.
	 * @param result the resulting object.
	 */
	public void setResult(Object result)
	{
		this.result = result;
		this.release();
	}

	/**
	 * Sets an exception to be thrown to the code that is blocking on {@link #setResult(Object)}, and releases the lock.
	 * @param exception a thrown exception. It can be thrown from any place that handles an AsyncResult.
	 */
	public void setException(Throwable exception)
	{
		this.result = null;
		this.exception = exception;
		this.release();
	}

	/**
	 * @return the result, blocking the current thread until another thread calls this method.
	 */
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

	public Object getResultUnsafe()
	{
		return result;
	}
}
