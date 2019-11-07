/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.io.TiStream;

import ti.modules.titanium.BufferProxy;

public class TiStreamHelper
{

	/**
	 * Common code for handling JS calls for #read() on a Ti.IOStream.
	 * @param  TAG         logging tag
	 * @param  krollObject kroll object for the stream proxy
	 * @param  tiStream    the instance of the stream
	 * @param  args        the arguments passed from JS
	 * @return             bytes read (if sync call), otherwise 0
	 */
	public static int readTiStream(final String TAG, final KrollObject krollObject, final TiStream tiStream,
								   Object[] args) throws Exception
	{
		// first throw out any obviously bad calls
		if (args.length == 0 || args.length > 4) {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		// Allow a final callback argument. If not present, spit out deprecation notice and state that usage with main thread will block/crash
		Object lastArg = args[args.length - 1];
		KrollFunction callback = null;
		if (!(lastArg instanceof KrollFunction)) {
			// must have buffer arg OR buffer, offset and length
			if (args.length != 1 && args.length != 3) {
				throw new IllegalArgumentException("Invalid number of arguments");
			}
		} else {
			callback = (KrollFunction) lastArg;
			// must have buffer and callback OR buffer, offset, length and callback
			if (args.length != 2 && args.length != 4) {
				throw new IllegalArgumentException("Invalid number of arguments");
			}
		}

		// buffer is always first arg
		if (!(args[0] instanceof BufferProxy)) {
			throw new IllegalArgumentException("Invalid buffer argument");
		}
		BufferProxy bufferProxy = (BufferProxy) args[0];
		int length = bufferProxy.getLength();
		int offset = 0;

		// if we have at least 3 args (remember we check invalid arg counts taking callback into account above)
		if (args.length >= 3) {
			if (!(args[1] instanceof Number)) {
				throw new IllegalArgumentException("Invalid offset argument");
			}
			offset = ((Number) args[1]).intValue();

			if (!(args[2] instanceof Number)) {
				throw new IllegalArgumentException("Invalid length argument");
			}
			length = ((Number) args[2]).intValue();
		}

		// If we have a callback, fire the read to happen async and return 0
		if (callback != null) {
			TiStreamHelper.readAsync(krollObject, tiStream, bufferProxy, offset, length, callback);
			return 0;
		}

		Log.w(
			TAG,
			"Synchronous invocation of read will cause performance issues under the main thread. This will no longer be supported in SDK 9.0.0. Please invoke with a final callback function to receive the result.");
		final BufferProxy finalBufferProxy = bufferProxy;
		final int finalOffset = offset;
		final int finalLength = length;
		final RunnableResult finalRunnableResult = new RunnableResult();
		Runnable runnable = new Runnable() {
			@Override
			public void run()
			{
				try {
					finalRunnableResult.streamedByteCount =
						tiStream.readSync(finalBufferProxy, finalOffset, finalLength);
				} catch (Exception ex) {
					finalRunnableResult.exception = ex;
				}
			}
		};
		if (TiApplication.isUIThread()) {
			try {
				Thread thread = new Thread(runnable);
				thread.start();
				thread.join();
			} catch (Exception ex) {
				finalRunnableResult.exception = ex;
			}
		} else {
			runnable.run();
		}
		// If the above read failed, then throw an exception.
		if (finalRunnableResult.exception != null) {
			throw finalRunnableResult.exception;
		}

		// The read was successful. Return the number of bytes read.
		return finalRunnableResult.streamedByteCount;
	}

	/**
	 * Common code for handling JS calls for #write() on a Ti.IOStream.
	 * @param  TAG         logging tag
	 * @param  krollObject kroll object for the stream proxy
	 * @param  tiStream    the instance of the stream
	 * @param  args        the arguments passed from JS
	 * @return             bytes read (if sync call), otherwise 0
	 */
	public static int writeTiStream(final String TAG, final KrollObject krollObject, final TiStream tiStream,
									Object[] args) throws Exception
	{
		// first throw out any obviously bad calls
		if (args.length == 0 || args.length > 4) {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		// Allow a final callback argument. If not present, spit out deprecation notice and state that usage with main thread will block/crash?
		Object lastArg = args[args.length - 1];
		KrollFunction callback = null;
		if (!(lastArg instanceof KrollFunction)) {
			// must have buffer arg OR buffer, offset and length args
			if (args.length != 1 && args.length != 3) {
				throw new IllegalArgumentException("Invalid number of arguments");
			}
		} else {
			callback = (KrollFunction) lastArg;
			// must have buffer and callback args OR buffer, offset, length and callback args
			if (args.length != 2 && args.length != 4) {
				throw new IllegalArgumentException("Invalid number of arguments");
			}
		}

		// buffer is always first arg
		if (!(args[0] instanceof BufferProxy)) {
			throw new IllegalArgumentException("Invalid buffer argument");
		}
		BufferProxy bufferProxy = (BufferProxy) args[0];

		int offset = 0;
		int length = bufferProxy.getLength();

		// if we have at least 3 args (remember we check invalid arg counts taking callback into account above)
		if (args.length >= 3) {
			if (!(args[1] instanceof Number)) {
				throw new IllegalArgumentException("Invalid offset argument");
			}
			offset = ((Number) args[1]).intValue();

			if (!(args[2] instanceof Number)) {
				throw new IllegalArgumentException("Invalid length argument");
			}
			length = ((Number) args[2]).intValue();
		}

		// If we have a callback, fire the write to happen async and return 0
		if (callback != null) {
			TiStreamHelper.writeAsync(krollObject, tiStream, bufferProxy, offset, length, callback);
			return 0;
		}

		Log.w(
			TAG,
			"Synchronous invocation of write will cause performance issues under the main thread. This will no longer be supported in SDK 9.0.0. Please invoke with a final callback function to receive the result.");
		final BufferProxy finalBufferProxy = bufferProxy;
		final int finalOffset = offset;
		final int finalLength = length;
		final RunnableResult finalRunnableResult = new RunnableResult();
		Runnable runnable = new Runnable() {
			@Override
			public void run()
			{
				try {
					finalRunnableResult.streamedByteCount =
						tiStream.writeSync(finalBufferProxy, finalOffset, finalLength);
				} catch (Exception ex) {
					finalRunnableResult.exception = ex;
				}
			}
		};
		if (TiApplication.isUIThread()) {
			try {
				Thread thread = new Thread(runnable);
				thread.start();
				thread.join();
			} catch (Exception ex) {
				finalRunnableResult.exception = ex;
			}
		} else {
			runnable.run();
		}
		// If the above read failed, then throw an exception.
		if (finalRunnableResult.exception != null) {
			throw finalRunnableResult.exception;
		}

		// The read was successful. Return the number of bytes written.
		return finalRunnableResult.streamedByteCount;
	}

	public static int read(InputStream inputStream, BufferProxy bufferProxy, int offset, int length) throws IOException
	{
		byte[] buffer = bufferProxy.getBuffer();

		if ((offset + length) > buffer.length) {
			length = buffer.length - offset;
		}

		return inputStream.read(buffer, offset, length);
	}

	public static void readAsync(final KrollObject krollObject, final TiStream sourceStream, final BufferProxy buffer,
								 final int offset, final int length, final KrollFunction resultsCallback)
	{
		new Thread(new Runnable() {
			public void run()
			{
				int bytesRead = -1;
				int code = 0;
				String error = "";

				try {
					bytesRead = sourceStream.readSync(buffer, offset, length);

				} catch (IOException e) {
					code = 1;
					error = e.getMessage();
				}

				resultsCallback.callAsync(krollObject, buildRWCallbackArgs(sourceStream, bytesRead, code, error));
			}
		}).start();
	}

	public static int write(OutputStream outputStream, BufferProxy bufferProxy, int offset, int length)
		throws IOException
	{
		byte[] buffer = bufferProxy.getBuffer();

		if ((offset + length) > buffer.length) {
			length = buffer.length - offset;
		}

		outputStream.write(buffer, offset, length);
		outputStream.flush();

		return length;
	}

	public static void writeAsync(final KrollObject krollObject, final TiStream outputStream, final BufferProxy buffer,
								  final int offset, final int length, final KrollFunction resultsCallback)
	{
		new Thread(new Runnable() {
			public void run()
			{
				int bytesWritten = -1;
				int code = 0;
				String error = "";

				try {
					bytesWritten = outputStream.writeSync(buffer, offset, length);

				} catch (IOException e) {
					code = 1;
					error = e.getMessage();
				}

				resultsCallback.callAsync(krollObject, buildRWCallbackArgs(outputStream, bytesWritten, code, error));
			}
		}).start();
	}

	public static KrollDict buildRWCallbackArgs(TiStream sourceStream, int bytesProcessed, int code, String error)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("source", sourceStream);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.putCodeAndMessage(code, error);

		return callbackArgs;
	}

	/** Private class used to capture async results of the "TCPProxy" read() and write() methods. */
	private static class RunnableResult
	{
		/** The number of bytes read/written to/from the socket if successful. */
		int streamedByteCount;

		/** Provides the exception error that occurred if failed. Set to null if read/write was successful. */
		Exception exception;
	}
}
